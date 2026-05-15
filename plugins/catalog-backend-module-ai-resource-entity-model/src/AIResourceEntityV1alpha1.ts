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
import defaultJsonSchema from './schema/AIResource.v1alpha1.schema.json';
import skillJsonSchema from './schema/AIResource.v1alpha1.skill.schema.json';

/**
 * Default AIResource entity for types that don't have a structured spec.
 *
 * @public
 */
export interface AIResourceEntityV1alpha1Default extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AIResource';
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    system?: string;
  };
}

/**
 * AIResource entity with spec.type 'skill'. Represents reusable contextual
 * knowledge consumed by AI coding tools.
 *
 * @public
 */
export interface SkillAIResourceEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AIResource';
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
 * Backstage catalog AIResource kind Entity. Represents contextual information
 * consumed by AI coding tools, such as skills and rules.
 *
 * @public
 */
export type AIResourceEntityV1alpha1 =
  | AIResourceEntityV1alpha1Default
  | SkillAIResourceEntityV1alpha1;

const defaultValidator = entityKindSchemaValidator(defaultJsonSchema);

/**
 * Entity data validator for the default {@link AIResourceEntityV1alpha1}.
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
 * Entity data validator for {@link SkillAIResourceEntityV1alpha1}.
 *
 * @public
 */
export const skillAIResourceEntityV1alpha1Validator: KindValidator = {
  async check(data: Entity) {
    return skillValidator(data) === data;
  },
};

/**
 * Type guard for {@link AIResourceEntityV1alpha1}.
 *
 * @public
 */
export const isAIResourceEntity = (
  entity: Entity,
): entity is AIResourceEntityV1alpha1 =>
  entity.apiVersion === 'backstage.io/v1alpha1' && entity.kind === 'AIResource';

/**
 * Type guard for {@link SkillAIResourceEntityV1alpha1}.
 *
 * @public
 */
export const isSkillAIResourceEntity = (
  entity: Entity,
): entity is SkillAIResourceEntityV1alpha1 =>
  isAIResourceEntity(entity) && entity.spec?.type === 'skill';

/**
 * Extends the catalog model with the AIResource kind.
 *
 * @alpha
 */
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
 * Extends the catalog model with the AIResource kind.
 *
 * @alpha
 */
export const aiResourceEntityModel = createCatalogModelLayer({
  layerId: 'catalog.backstage.io/kind-ai-resource',
  builder: model => {
    model.addKind({
      group: 'backstage.io',
      names: {
        kind: 'AIResource',
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
              defaultKind: 'AIResource',
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
