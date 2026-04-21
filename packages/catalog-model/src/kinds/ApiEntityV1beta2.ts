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

import type { Entity } from '../entity/Entity';
import defaultSchema from '../schema/kinds/API.v1beta2.schema.json';
import mcpServerSchema from '../schema/kinds/API.v1beta2.mcp-server.schema.json';
import { ajvCompiledJsonSchemaValidator } from './util';

/**
 * Backstage API kind entity, v1beta2. Introduces structured subtypes via
 * spec.type, starting with 'mcp-server'. Other values of spec.type continue
 * to use the string-definition shape.
 *
 * @public
 */
export type ApiEntityV1beta2 =
  | ApiEntityV1beta2Default
  | McpServerApiEntityV1beta2;

/**
 * The default (string-definition) shape for v1beta2 API entities. Applies
 * when spec.type is anything other than a declared structured subtype.
 *
 * @public
 */
export interface ApiEntityV1beta2Default extends Entity {
  apiVersion: 'backstage.io/v1beta2';
  kind: 'API';
  spec: {
    type: string;
    lifecycle: string;
    owner: string;
    system?: string;
    definition: string;
  };
}

/**
 * An MCP (Model Context Protocol) server represented as an API entity
 * (v1beta2, spec.type: 'mcp-server').
 *
 * @public
 */
export interface McpServerApiEntityV1beta2 extends Entity {
  apiVersion: 'backstage.io/v1beta2';
  kind: 'API';
  spec: {
    type: 'mcp-server';
    lifecycle: string;
    owner: string;
    system?: string;
    remotes: McpServerRemote[];
  };
}

/**
 * A transport endpoint for an MCP server.
 *
 * @public
 */
export type McpServerRemote = {
  type: string;
  url: string;
};

/**
 * {@link KindValidator} for the default specType of {@link ApiEntityV1beta2}.
 *
 * @public
 */
export const apiEntityV1beta2Validator =
  ajvCompiledJsonSchemaValidator(defaultSchema);

/**
 * {@link KindValidator} for the `mcp-server` specType of {@link ApiEntityV1beta2}.
 *
 * @public
 */
export const mcpServerApiEntityV1beta2Validator =
  ajvCompiledJsonSchemaValidator(mcpServerSchema);

/**
 * Type guard: narrows a v1beta2 API entity to the MCP server subtype.
 *
 * @public
 */
export function isMcpServerApiEntity(
  entity: ApiEntityV1beta2,
): entity is McpServerApiEntityV1beta2 {
  return entity.spec.type === 'mcp-server';
}
