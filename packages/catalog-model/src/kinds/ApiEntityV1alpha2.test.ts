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

import {
  ApiEntityV1alpha2Default,
  McpServerApiEntityV1alpha2,
  apiEntityV1alpha2Validator,
  mcpServerApiEntityV1alpha2Validator,
  isMcpServerApiEntity,
} from './ApiEntityV1alpha2';

describe('apiEntityV1alpha2Validator (default specType)', () => {
  let entity: ApiEntityV1alpha2Default;

  beforeEach(() => {
    entity = {
      apiVersion: 'backstage.io/v1alpha2',
      kind: 'API',
      metadata: { name: 'test' },
      spec: {
        type: 'openapi',
        lifecycle: 'production',
        owner: 'me',
        definition: 'openapi: "3.0.0"',
        system: 'system',
      },
    };
  });

  it('accepts a valid v1alpha2 string-definition entity', async () => {
    await expect(apiEntityV1alpha2Validator.check(entity)).resolves.toBe(true);
  });

  it('ignores v1alpha1', async () => {
    (entity as any).apiVersion = 'backstage.io/v1alpha1';
    await expect(apiEntityV1alpha2Validator.check(entity)).resolves.toBe(false);
  });

  it('rejects missing definition', async () => {
    delete (entity as any).spec.definition;
    await expect(apiEntityV1alpha2Validator.check(entity)).rejects.toThrow(
      /definition/,
    );
  });

  it('rejects missing lifecycle', async () => {
    delete (entity as any).spec.lifecycle;
    await expect(apiEntityV1alpha2Validator.check(entity)).rejects.toThrow(
      /lifecycle/,
    );
  });
});

describe('mcpServerApiEntityV1alpha2Validator', () => {
  let entity: McpServerApiEntityV1alpha2;

  beforeEach(() => {
    entity = {
      apiVersion: 'backstage.io/v1alpha2',
      kind: 'API',
      metadata: { name: 'test-mcp' },
      spec: {
        type: 'mcp-server',
        lifecycle: 'experimental',
        owner: 'backstage',
        remotes: [
          {
            type: 'streamable-http',
            url: 'http://localhost:7007/api/mcp',
          },
        ],
      },
    };
  });

  it('accepts a valid mcp-server entity', async () => {
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).resolves.toBe(true);
  });

  it('rejects wrong spec.type value', async () => {
    (entity as any).spec.type = 'openapi';
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).rejects.toThrow(/type/);
  });

  it('rejects missing remotes', async () => {
    delete (entity as any).spec.remotes;
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).rejects.toThrow(/remotes/);
  });

  it('rejects empty remotes array', async () => {
    (entity as any).spec.remotes = [];
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).rejects.toThrow(/remotes/);
  });

  it('rejects remote missing url', async () => {
    (entity as any).spec.remotes[0] = { type: 'stdio' };
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).rejects.toThrow(/url/);
  });

  it('rejects remote missing type', async () => {
    (entity as any).spec.remotes[0] = { url: 'http://x' };
    await expect(
      mcpServerApiEntityV1alpha2Validator.check(entity),
    ).rejects.toThrow(/type/);
  });
});

describe('isMcpServerApiEntity', () => {
  it('returns true for an mcp-server entity', () => {
    const entity: McpServerApiEntityV1alpha2 = {
      apiVersion: 'backstage.io/v1alpha2',
      kind: 'API',
      metadata: { name: 'm' },
      spec: {
        type: 'mcp-server',
        lifecycle: 'production',
        owner: 'me',
        remotes: [{ type: 'stdio', url: 'cmd' }],
      },
    };
    expect(isMcpServerApiEntity(entity)).toBe(true);
  });

  it('returns false for a default entity', () => {
    const entity: ApiEntityV1alpha2Default = {
      apiVersion: 'backstage.io/v1alpha2',
      kind: 'API',
      metadata: { name: 'a' },
      spec: {
        type: 'openapi',
        lifecycle: 'production',
        owner: 'me',
        definition: 'x',
      },
    };
    expect(isMcpServerApiEntity(entity)).toBe(false);
  });
});
