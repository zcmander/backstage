/*
 * Copyright 2026 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// @ts-check

/**
 * Deduplicates the search table, adds covering indices (including a UNIQUE
 * constraint on (entity_id, key, value)), and drops superseded indices.
 *
 * On PostgreSQL this uses CREATE INDEX CONCURRENTLY which avoids blocking
 * reads/writes but can take several minutes on large tables (13M+ rows).
 * Each step is idempotent: it checks the current state and skips work
 * already done, or cleans up INVALID indices left by an interrupted
 * attempt before retrying. However, an interrupted index build does NOT
 * leave partial progress — each retry starts from scratch. If the
 * Kubernetes liveness probe kills the pod before an index build completes,
 * the next startup will drop the INVALID index and restart the build. On
 * large tables this can repeat indefinitely. To prevent this, either
 * increase the liveness probe timeout for this one-time upgrade, or run
 * the SQL commands below manually before deploying.
 *
 * ## Recommended: run manually before deploying (large installations)
 *
 * For PostgreSQL installations with millions of search rows, run these
 * commands against your database BEFORE deploying this version. Each
 * index build takes a few minutes but does not block reads or writes.
 *
 *   -- 1. Remove duplicate search rows
 *   WITH cte AS (
 *     SELECT ctid,
 *            row_number() OVER (PARTITION BY entity_id, key, value) AS rn
 *     FROM search
 *   )
 *   DELETE FROM search USING cte
 *   WHERE search.ctid = cte.ctid AND cte.rn > 1;
 *
 *   -- 2. Create indices (run each separately)
 *   CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS
 *     search_entity_key_value_idx ON search (entity_id, key, value);
 *   CREATE INDEX CONCURRENTLY IF NOT EXISTS
 *     search_key_value_entity_idx ON search (key, value, entity_id);
 *   CREATE INDEX CONCURRENTLY IF NOT EXISTS
 *     search_facets_covering_idx ON search (key, original_value, entity_id)
 *     WHERE original_value IS NOT NULL;
 *
 *   -- 3. Drop old indices
 *   DROP INDEX CONCURRENTLY IF EXISTS search_key_value_idx;
 *   DROP INDEX CONCURRENTLY IF EXISTS search_key_original_value_idx;
 *
 * If these commands have already completed, the migration will detect the
 * existing indices and skip all work — startup will be instant.
 */

/**
 * @param {import('knex').Knex} knex
 */
exports.up = async function up(knex) {
  const client = knex.client.config.client;

  if (client.includes('pg')) {
    await upPostgres(knex);
  } else if (client.includes('mysql')) {
    await upMysql(knex);
  } else {
    await upSqlite(knex);
  }
};

/**
 * @param {import('knex').Knex} knex
 */
exports.down = async function down(knex) {
  const client = knex.client.config.client;

  if (client.includes('pg')) {
    // Remove the new indices and restore the old ones
    await knex.raw(
      'DROP INDEX CONCURRENTLY IF EXISTS search_entity_key_value_idx',
    );
    await knex.raw(
      'DROP INDEX CONCURRENTLY IF EXISTS search_key_value_entity_idx',
    );
    await knex.raw(
      'DROP INDEX CONCURRENTLY IF EXISTS search_facets_covering_idx',
    );
    await knex.raw(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS search_key_value_idx ON search (key, value)',
    );
    await knex.raw(
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS search_key_original_value_idx ON search (key, original_value)',
    );
  } else if (client.includes('mysql')) {
    await mysqlDropIndexIfExists(knex, 'search_entity_key_value_idx');
    await mysqlDropIndexIfExists(knex, 'search_key_value_entity_idx');
    await mysqlDropIndexIfExists(knex, 'search_facets_covering_idx');
    await knex.schema.alterTable('search', table => {
      table.index(['key', 'value'], 'search_key_value_idx');
      table.index(['key', 'original_value'], 'search_key_original_value_idx');
    });
  } else {
    await knex.raw('DROP INDEX IF EXISTS search_entity_key_value_idx');
    await knex.raw('DROP INDEX IF EXISTS search_key_value_entity_idx');
    await knex.raw('DROP INDEX IF EXISTS search_facets_covering_idx');
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS search_key_value_idx ON search (key, value)',
    );
    await knex.raw(
      'CREATE INDEX IF NOT EXISTS search_key_original_value_idx ON search (key, original_value)',
    );
  }
};

exports.config = { transaction: false };

// ---------------------------------------------------------------------------
// PostgreSQL
// ---------------------------------------------------------------------------

/** @param {import('knex').Knex} knex */
async function upPostgres(knex) {
  // Step 1: Remove duplicate search rows. The window function's
  // PARTITION BY treats NULLs as equal, so this handles both NULL-value
  // and non-NULL-value duplicates. Idempotent: deletes 0 rows if clean.
  await knex.raw(`
    WITH cte AS (
      SELECT ctid,
             row_number() OVER (PARTITION BY entity_id, key, value) AS rn
      FROM search
    )
    DELETE FROM search
    USING cte
    WHERE search.ctid = cte.ctid AND cte.rn > 1
  `);

  // Step 2: Create covering indices. Each call is idempotent — it checks
  // the index state and only does work if needed.
  await ensurePgIndex(knex, {
    name: 'search_entity_key_value_idx',
    columns: '(entity_id, key, value)',
    unique: true,
  });
  await ensurePgIndex(knex, {
    name: 'search_key_value_entity_idx',
    columns: '(key, value, entity_id)',
    unique: false,
  });
  await ensurePgIndex(knex, {
    name: 'search_facets_covering_idx',
    columns: '(key, original_value, entity_id)',
    where: 'WHERE original_value IS NOT NULL',
    unique: false,
  });

  // Step 3: Drop superseded indices.
  await dropPgIndexIfExists(knex, 'search_key_value_idx');
  await dropPgIndexIfExists(knex, 'search_key_original_value_idx');
}

/**
 * Creates or replaces an index on the search table, handling all edge cases:
 * - Already valid with correct uniqueness: skip
 * - Exists but INVALID (interrupted CREATE): drop and recreate
 * - Exists but wrong uniqueness (e.g. non-unique but we need unique): drop and recreate
 * - Missing: create from scratch
 *
 * @param {import('knex').Knex} knex
 * @param {{ name: string; columns: string; unique: boolean; where?: string }} opts
 */
async function ensurePgIndex(knex, opts) {
  const { name, columns, unique, where } = opts;

  const result = await knex.raw(
    `
    SELECT indisunique, indisvalid
    FROM pg_index
    WHERE indexrelid = (
      SELECT oid FROM pg_class WHERE relname = ?
    )
  `,
    [name],
  );

  if (result.rows.length > 0) {
    const { indisunique, indisvalid } = result.rows[0];
    if (indisvalid && indisunique === unique) {
      return; // Already correct
    }
    // Wrong state — drop and recreate
    await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
  }

  const uniqueKw = unique ? 'UNIQUE' : '';
  const whereClause = where || '';
  await knex.raw(
    `CREATE ${uniqueKw} INDEX CONCURRENTLY "${name}" ON search ${columns} ${whereClause}`,
  );
}

/**
 * @param {import('knex').Knex} knex
 * @param {string} name
 */
async function dropPgIndexIfExists(knex, name) {
  const result = await knex.raw(
    `
    SELECT 1 FROM pg_class WHERE relname = ?
  `,
    [name],
  );
  if (result.rows.length > 0) {
    await knex.raw(`DROP INDEX CONCURRENTLY IF EXISTS "${name}"`);
  }
}

// ---------------------------------------------------------------------------
// MySQL
// ---------------------------------------------------------------------------

/** @param {import('knex').Knex} knex */
async function upMysql(knex) {
  // Dedup via temp table
  await knex.transaction(async trx => {
    await trx.raw(
      'CREATE TEMPORARY TABLE IF NOT EXISTS `_search_keep` (' +
        '`entity_id` VARCHAR(255), `key` VARCHAR(255), ' +
        '`value` VARCHAR(255), `original_value` VARCHAR(255))',
    );
    await trx.raw('DELETE FROM `_search_keep`');
    await trx.raw(
      'INSERT INTO `_search_keep` ' +
        'SELECT `entity_id`, `key`, `value`, MAX(`original_value`) ' +
        'FROM `search` GROUP BY `entity_id`, `key`, `value`',
    );
    await trx.raw('DELETE FROM `search`');
    await trx.raw(
      'INSERT INTO `search` (`entity_id`, `key`, `value`, `original_value`) ' +
        'SELECT * FROM `_search_keep`',
    );
    await trx.raw('DROP TEMPORARY TABLE `_search_keep`');
  });

  // Drop old indices if present, then create new ones
  await mysqlDropIndexIfExists(knex, 'search_key_value_idx');
  await mysqlDropIndexIfExists(knex, 'search_key_original_value_idx');
  await mysqlDropIndexIfExists(knex, 'search_entity_key_value_idx');
  await mysqlDropIndexIfExists(knex, 'search_key_value_entity_idx');
  await mysqlDropIndexIfExists(knex, 'search_facets_covering_idx');

  await knex.schema.alterTable('search', table => {
    table.unique(['entity_id', 'key', 'value'], 'search_entity_key_value_idx');
    table.index(['key', 'value', 'entity_id'], 'search_key_value_entity_idx');
  });
  // MySQL doesn't support partial indices — create a full one
  await knex.schema.alterTable('search', table => {
    table.index(
      ['key', 'original_value', 'entity_id'],
      'search_facets_covering_idx',
    );
  });
}

/** @param {import('knex').Knex} knex @param {string} name */
async function mysqlDropIndexIfExists(knex, name) {
  const [rows] = await knex.raw(
    `SHOW INDEX FROM \`search\` WHERE Key_name = ?`,
    [name],
  );
  if (rows.length > 0) {
    await knex.schema.alterTable('search', t => {
      t.dropIndex([], name);
    });
  }
}

// ---------------------------------------------------------------------------
// SQLite
// ---------------------------------------------------------------------------

/** @param {import('knex').Knex} knex */
async function upSqlite(knex) {
  await knex.transaction(async trx => {
    await trx.raw(`
      DELETE FROM search
      WHERE rowid NOT IN (
        SELECT MIN(rowid) FROM search GROUP BY entity_id, key, value
      )
    `);
  });

  // Drop old, create new — SQLite is fast on small tables
  await knex.raw('DROP INDEX IF EXISTS search_key_value_idx');
  await knex.raw('DROP INDEX IF EXISTS search_key_original_value_idx');
  await knex.raw('DROP INDEX IF EXISTS search_entity_key_value_idx');
  await knex.raw('DROP INDEX IF EXISTS search_key_value_entity_idx');
  await knex.raw('DROP INDEX IF EXISTS search_facets_covering_idx');

  await knex.raw(
    'CREATE UNIQUE INDEX search_entity_key_value_idx ON search (entity_id, key, value)',
  );
  await knex.raw(
    'CREATE INDEX search_key_value_entity_idx ON search (key, value, entity_id)',
  );
  await knex.raw(
    'CREATE INDEX search_facets_covering_idx ON search (key, original_value, entity_id)',
  );
}
