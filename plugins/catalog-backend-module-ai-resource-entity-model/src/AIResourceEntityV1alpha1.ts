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
import jsonSchema from './schema/AIResource.v1alpha1.schema.json';

/**
 * Backstage catalog AIResource kind Entity. Represents contextual information
 * consumed by AI coding tools, such as skills and rules.
 *
 * @public
 */
export interface AIResourceEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1';
  kind: 'AIResource';
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    system?: string;
  };
}

const validator = entityKindSchemaValidator(jsonSchema);

/**
 * Entity data validator for {@link AIResourceEntityV1alpha1}.
 *
 * @public
 */
export const aiResourceEntityV1alpha1Validator: KindValidator = {
  async check(data: Entity) {
    return validator(data) === data;
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
          relationFields: [
            {
              selector: { path: 'spec.owner' },
              relation: 'ownedBy',
              defaultKind: 'Group',
              defaultNamespace: 'inherit',
              allowedKinds: ['Group', 'User'],
            },
            {
              selector: { path: 'spec.system' },
              relation: 'partOf',
              defaultKind: 'System',
              defaultNamespace: 'inherit',
            },
          ],
          schema: {
            jsonSchema: jsonSchema as JsonObject,
          },
        },
      ],
    });
  },
});
