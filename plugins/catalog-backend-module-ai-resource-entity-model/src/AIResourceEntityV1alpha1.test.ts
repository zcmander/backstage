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

import type { Entity } from '@backstage/catalog-model';
import {
  type AIResourceEntityV1alpha1,
  aiResourceEntityV1alpha1Validator as validator,
  isAIResourceEntity,
} from './AIResourceEntityV1alpha1';

describe('AIResourceV1alpha1Validator', () => {
  let entity: AIResourceEntityV1alpha1;

  beforeEach(() => {
    entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIResource',
      metadata: {
        name: 'frontend-design',
      },
      spec: {
        type: 'skill',
        lifecycle: 'production',
        owner: 'ai-platform-team',
        system: 'ai-tooling',
      },
    };
  });

  it('accepts valid data', async () => {
    await expect(validator.check(entity)).resolves.toBe(true);
  });

  it('ignores unknown apiVersion', async () => {
    (entity as any).apiVersion = 'backstage.io/v1beta0';
    await expect(validator.check(entity)).resolves.toBe(false);
  });

  it('ignores unknown kind', async () => {
    (entity as any).kind = 'Wizard';
    await expect(validator.check(entity)).resolves.toBe(false);
  });

  it('rejects missing type', async () => {
    delete (entity as any).spec.type;
    await expect(validator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects wrong type', async () => {
    (entity as any).spec.type = 7;
    await expect(validator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects empty type', async () => {
    (entity as any).spec.type = '';
    await expect(validator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects missing lifecycle', async () => {
    delete (entity as any).spec.lifecycle;
    await expect(validator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects wrong lifecycle', async () => {
    (entity as any).spec.lifecycle = 7;
    await expect(validator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects empty lifecycle', async () => {
    (entity as any).spec.lifecycle = '';
    await expect(validator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects missing owner', async () => {
    delete (entity as any).spec.owner;
    await expect(validator.check(entity)).rejects.toThrow(/owner/);
  });

  it('rejects wrong owner', async () => {
    (entity as any).spec.owner = 7;
    await expect(validator.check(entity)).rejects.toThrow(/owner/);
  });

  it('rejects empty owner', async () => {
    (entity as any).spec.owner = '';
    await expect(validator.check(entity)).rejects.toThrow(/owner/);
  });

  it('accepts missing system', async () => {
    delete (entity as any).spec.system;
    await expect(validator.check(entity)).resolves.toBe(true);
  });

  it('rejects wrong system', async () => {
    (entity as any).spec.system = 7;
    await expect(validator.check(entity)).rejects.toThrow(/system/);
  });

  it('rejects empty system', async () => {
    (entity as any).spec.system = '';
    await expect(validator.check(entity)).rejects.toThrow(/system/);
  });
});

describe('isAIResourceEntity', () => {
  it('returns true for a valid AIResource entity', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIResource',
      metadata: { name: 'test' },
    };
    expect(isAIResourceEntity(entity)).toBe(true);
  });

  it('returns false for a different kind', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'test' },
    };
    expect(isAIResourceEntity(entity)).toBe(false);
  });

  it('returns false for a different apiVersion', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1beta1',
      kind: 'AIResource',
      metadata: { name: 'test' },
    };
    expect(isAIResourceEntity(entity)).toBe(false);
  });
});
