/*
 * Copyright 2020 The Backstage Authors
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

import { createCatalogModelLayer } from '../model/createCatalogModelLayer';
import type { Entity } from '../entity/Entity';
import jsonSchema from '../schema/kinds/API.v1alpha1.schema.json';
import defaultSchemaV1beta2 from '../schema/kinds/API.v1beta2.schema.json';
import mcpServerSchemaV1beta2 from '../schema/kinds/API.v1beta2.mcp-server.schema.json';
import { ajvCompiledJsonSchemaValidator } from './util';

/**
 * Backstage API kind Entity. APIs describe the interfaces for Components to communicate.
 *
 * @remarks
 *
 * See {@link https://backstage.io/docs/features/software-catalog/system-model}
 *
 * @public
 */
export interface ApiEntityV1alpha1 extends Entity {
  apiVersion: 'backstage.io/v1alpha1' | 'backstage.io/v1beta1';
  kind: 'API';
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    definition: string;
    system?: string;
  };
}

/**
 * {@link KindValidator} for {@link ApiEntityV1alpha1}.
 *
 * @public
 */
export const apiEntityV1alpha1Validator =
  ajvCompiledJsonSchemaValidator(jsonSchema);

const apiRelationFields = [
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
 * Extends the catalog model with the API kind.
 *
 * @alpha
 */
export const apiEntityModel = createCatalogModelLayer({
  layerId: 'catalog.backstage.io/kind-api',
  builder: model => {
    model.addKind({
      group: 'backstage.io',
      names: {
        kind: 'API',
        singular: 'api',
        plural: 'apis',
      },
      description:
        'An API describes an interface that can be exposed by a component.',
      versions: [
        {
          name: ['v1alpha1', 'v1beta1'],
          relationFields: apiRelationFields,
          schema: { jsonSchema },
        },
        {
          name: 'v1beta2',
          relationFields: apiRelationFields,
          schema: { jsonSchema: defaultSchemaV1beta2 },
        },
        {
          name: 'v1beta2',
          specType: 'mcp-server',
          description:
            'An MCP (Model Context Protocol) server exposed as an API entity.',
          relationFields: apiRelationFields,
          schema: { jsonSchema: mcpServerSchemaV1beta2 },
        },
      ],
    });
  },
});
