---
'@backstage/catalog-model': minor
---

Added `backstage.io/v1alpha2` of the `API` kind. It behaves identically to `v1alpha1` / `v1beta1` for the existing string-`definition` shape, and additionally supports a new `spec.type: 'mcp-server'` subtype that carries a structured `spec.remotes` list for representing Model Context Protocol (MCP) servers in the catalog. See RFC [#32062](https://github.com/backstage/backstage/issues/32062). New public exports: `ApiEntityV1alpha2`, `ApiEntityV1alpha2Default`, `McpServerApiEntityV1alpha2`, `McpServerRemote`, `apiEntityV1alpha2Validator`, `mcpServerApiEntityV1alpha2Validator`, and the `isMcpServerApiEntity` type guard.
