---
'@backstage/plugin-catalog-backend': minor
---

`/entities/by-query` now accepts a `totalItems` parameter (`'include'` or `'exclude'`, default `'include'`) that controls whether the response's `totalItems` count is computed. Pass `'exclude'` to skip the count entirely when the caller doesn't need it — useful for cursor-paginated user interfaces that only display the count cosmetically. The accepted values list is forward-compatible: future modes (e.g. approximate counts) can be added without breaking existing callers.

The internal `queryEntities` implementation has also been refactored to run the list and count queries concurrently via `Promise.all`. The list query is now a single statement that the planner can drive with `LIMIT` short-circuiting (no longer wrapped in a multi-reference CTE that forced materialization). Together with `totalItems: 'exclude'` this materially improves the wall-clock time of paginated catalog list views — particularly cursor-paginated user interfaces and second-page-and-onwards traffic where the count is already cached on the cursor.

The internal `QueryEntitiesInitialRequest.skipTotalItems` option has been replaced by `totalItems: 'include' | 'exclude'`. Note that `skipTotalItems` was never exposed as a REST API parameter, so this is only a TypeScript-level change affecting direct callers of `EntitiesCatalog.queryEntities`.
