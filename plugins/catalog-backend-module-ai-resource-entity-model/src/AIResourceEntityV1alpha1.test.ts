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
  type AIResourceEntityV1alpha1Default,
  type SkillAIResourceEntityV1alpha1,
  aiResourceEntityV1alpha1Validator as defaultValidator,
  skillAIResourceEntityV1alpha1Validator as skillValidator,
  isAIResourceEntity,
  isSkillAIResourceEntity,
} from './AIResourceEntityV1alpha1';

describe('AIResourceV1alpha1 default validator', () => {
  let entity: AIResourceEntityV1alpha1Default;

  beforeEach(() => {
    entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIResource',
      metadata: {
        name: 'internal-design-system',
      },
      spec: {
        type: 'rule',
        lifecycle: 'production',
        owner: 'frontend-platform',
        system: 'ai-tooling',
      },
    };
  });

  it('accepts valid data', async () => {
    await expect(defaultValidator.check(entity)).resolves.toBe(true);
  });

  it('ignores unknown apiVersion', async () => {
    (entity as any).apiVersion = 'backstage.io/v1beta0';
    await expect(defaultValidator.check(entity)).resolves.toBe(false);
  });

  it('ignores unknown kind', async () => {
    (entity as any).kind = 'Wizard';
    await expect(defaultValidator.check(entity)).resolves.toBe(false);
  });

  it('rejects missing type', async () => {
    delete (entity as any).spec.type;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects wrong type', async () => {
    (entity as any).spec.type = 7;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects empty type', async () => {
    (entity as any).spec.type = '';
    await expect(defaultValidator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects missing lifecycle', async () => {
    delete (entity as any).spec.lifecycle;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects wrong lifecycle', async () => {
    (entity as any).spec.lifecycle = 7;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects empty lifecycle', async () => {
    (entity as any).spec.lifecycle = '';
    await expect(defaultValidator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects missing owner', async () => {
    delete (entity as any).spec.owner;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/owner/);
  });

  it('rejects wrong owner', async () => {
    (entity as any).spec.owner = 7;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/owner/);
  });

  it('rejects empty owner', async () => {
    (entity as any).spec.owner = '';
    await expect(defaultValidator.check(entity)).rejects.toThrow(/owner/);
  });

  it('accepts missing system', async () => {
    delete (entity as any).spec.system;
    await expect(defaultValidator.check(entity)).resolves.toBe(true);
  });

  it('rejects wrong system', async () => {
    (entity as any).spec.system = 7;
    await expect(defaultValidator.check(entity)).rejects.toThrow(/system/);
  });

  it('rejects empty system', async () => {
    (entity as any).spec.system = '';
    await expect(defaultValidator.check(entity)).rejects.toThrow(/system/);
  });
});

describe('AIResourceV1alpha1 skill validator', () => {
  let entity: SkillAIResourceEntityV1alpha1;

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
        disciplines: ['web', 'backend'],
        categories: ['framework'],
        agents: ['claude-code'],
        dependsOn: ['airesource:default/base-coding-standards'],
      },
    };
  });

  it('accepts valid skill data with all fields', async () => {
    await expect(skillValidator.check(entity)).resolves.toBe(true);
  });

  it('accepts skill with only required fields', async () => {
    entity.spec = {
      type: 'skill',
      lifecycle: 'experimental',
      owner: 'team-a',
    };
    await expect(skillValidator.check(entity)).resolves.toBe(true);
  });

  it('rejects non-skill type', async () => {
    (entity as any).spec.type = 'rule';
    await expect(skillValidator.check(entity)).rejects.toThrow(/type/);
  });

  it('rejects missing lifecycle', async () => {
    delete (entity as any).spec.lifecycle;
    await expect(skillValidator.check(entity)).rejects.toThrow(/lifecycle/);
  });

  it('rejects missing owner', async () => {
    delete (entity as any).spec.owner;
    await expect(skillValidator.check(entity)).rejects.toThrow(/owner/);
  });

  it('accepts missing optional fields', async () => {
    delete (entity as any).spec.system;
    delete (entity as any).spec.disciplines;
    delete (entity as any).spec.categories;
    delete (entity as any).spec.agents;
    delete (entity as any).spec.dependsOn;
    await expect(skillValidator.check(entity)).resolves.toBe(true);
  });

  it('rejects disciplines with empty strings', async () => {
    (entity as any).spec.disciplines = [''];
    await expect(skillValidator.check(entity)).rejects.toThrow(/disciplines/);
  });

  it('rejects categories with wrong type', async () => {
    (entity as any).spec.categories = 'not-an-array';
    await expect(skillValidator.check(entity)).rejects.toThrow(/categories/);
  });

  it('rejects agents with wrong item type', async () => {
    (entity as any).spec.agents = [42];
    await expect(skillValidator.check(entity)).rejects.toThrow(/agents/);
  });

  it('rejects dependsOn with empty strings', async () => {
    (entity as any).spec.dependsOn = [''];
    await expect(skillValidator.check(entity)).rejects.toThrow(/dependsOn/);
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

describe('isSkillAIResourceEntity', () => {
  it('returns true for a skill AIResource', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIResource',
      metadata: { name: 'test' },
      spec: { type: 'skill' },
    };
    expect(isSkillAIResourceEntity(entity)).toBe(true);
  });

  it('returns false for a non-skill AIResource', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'AIResource',
      metadata: { name: 'test' },
      spec: { type: 'rule' },
    };
    expect(isSkillAIResourceEntity(entity)).toBe(false);
  });

  it('returns false for a different kind', () => {
    const entity: Entity = {
      apiVersion: 'backstage.io/v1alpha1',
      kind: 'Component',
      metadata: { name: 'test' },
      spec: { type: 'skill' },
    };
    expect(isSkillAIResourceEntity(entity)).toBe(false);
  });
});
