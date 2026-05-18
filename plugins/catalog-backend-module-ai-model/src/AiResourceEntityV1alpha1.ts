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
  type Entity,
  entityKindSchemaValidator,
  type KindValidator,
} from '@backstage/catalog-model';
import { createCatalogModelLayer } from '@backstage/catalog-model/alpha';
import type { JsonObject } from '@backstage/types';
import defaultJsonSchema from './schema/AiResource.v1alpha1.schema.json';
import skillJsonSchema from './schema/AiResource.v1alpha1.skill.schema.json';

/**
 * Default AiResource entity for types that don't have a structured spec.
 *
 * @public
 */
export interface AiResourceEntityV1alpha1Default extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AiResource';
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    system?: string;
  };
}

/**
 * AiResource entity with spec.type 'skill'. Represents reusable contextual
 * knowledge consumed by AI coding tools.
 *
 * @public
 */
export interface SkillAiResourceEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AiResource';
  spec: {
    type: 'skill';
    lifecycle: string;
    owner: string;
    system?: string;
    disciplines?: string[];
    categories?: string[];
    agents?: string[];
    dependsOn?: string[];
  };
}

/**
 * Backstage catalog AiResource kind Entity. Represents contextual information
 * consumed by AI coding tools, such as skills and rules.
 *
 * @public
 */
export type AiResourceEntityV1alpha1 =
  | AiResourceEntityV1alpha1Default
  | SkillAiResourceEntityV1alpha1;

const defaultValidator = entityKindSchemaValidator(defaultJsonSchema);

/**
 * Entity data validator for the default {@link AiResourceEntityV1alpha1}.
 *
 * @public
 */
export const aiResourceEntityV1alpha1Validator: KindValidator = {
  async check(data: Entity) {
    return defaultValidator(data) === data;
  },
};

const skillValidator = entityKindSchemaValidator(skillJsonSchema);

/**
 * Entity data validator for {@link SkillAiResourceEntityV1alpha1}.
 *
 * @public
 */
export const skillAiResourceEntityV1alpha1Validator: KindValidator = {
  async check(data: Entity) {
    return skillValidator(data) === data;
  },
};

/**
 * Type guard for {@link AiResourceEntityV1alpha1}.
 *
 * @public
 */
export const isAiResourceEntity = (
  entity: Entity,
): entity is AiResourceEntityV1alpha1 =>
  entity.apiVersion === 'backstage.io/v1alpha1' && entity.kind === 'AiResource';

/**
 * Type guard for {@link SkillAiResourceEntityV1alpha1}.
 *
 * @public
 */
export const isSkillAiResourceEntity = (
  entity: Entity,
): entity is SkillAiResourceEntityV1alpha1 =>
  isAiResourceEntity(entity) && entity.spec?.type === 'skill';

const baseRelationFields = [
  {
    selector: { path: 'spec.owner' },
    relation: 'ownedBy',
    defaultKind: 'Group',
    defaultNamespace: 'inherit' as const,
    allowedKinds: ['Group', 'User'],
  },
  {
    selector: { path: 'spec.system' },
    relation: 'partOf',
    defaultKind: 'System',
    defaultNamespace: 'inherit' as const,
  },
];

/**
 * Extends the catalog model with the AiResource kind.
 *
 * @alpha
 */
export const aiResourceEntityModel = createCatalogModelLayer({
  layerId: 'catalog.backstage.io/kind-ai-resource',
  builder: model => {
    model.addKind({
      group: 'backstage.io',
      names: {
        kind: 'AiResource',
        singular: 'airesource',
        plural: 'airesources',
      },
      description:
        'An AI resource represents contextual information consumed by AI coding tools, such as skills and rules.',
      versions: [
        {
          name: 'v1alpha1',
          relationFields: baseRelationFields,
          schema: {
            jsonSchema: defaultJsonSchema as JsonObject,
          },
        },
        {
          name: 'v1alpha1',
          specType: 'skill',
          relationFields: [
            ...baseRelationFields,
            {
              selector: { path: 'spec.dependsOn' },
              relation: 'dependsOn',
              defaultKind: 'AiResource',
              defaultNamespace: 'inherit' as const,
            },
          ],
          schema: {
            jsonSchema: skillJsonSchema as JsonObject,
          },
        },
      ],
    });
  },
});
