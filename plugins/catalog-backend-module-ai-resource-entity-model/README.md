# @backstage/plugin-catalog-backend-module-ai-resource-entity-model

Adds support for the `AiResource` entity kind to the catalog backend plugin. AI resources represent contextual information consumed by AI coding tools, such as skills and rules.

## Installation

Add the module to your backend:

```ts
backend.add(
  import('@backstage/plugin-catalog-backend-module-ai-resource-entity-model'),
);
```

## Entity shape

```yaml
apiVersion: backstage.io/v1alpha1
kind: AiResource
metadata:
  name: frontend-design
  description: Skill for creating production-grade frontend interfaces
spec:
  type: skill
  lifecycle: production
  owner: ai-platform-team
  system: ai-tooling
  disciplines:
    - web
  categories:
    - framework
  agents:
    - claude-code
  dependsOn:
    - airesource:default/base-coding-standards
```

The `type` field determines which spec fields are available. Currently supported types:

- **`skill`** — reusable contextual knowledge for AI coding tools. Supports additional fields: `disciplines`, `categories`, `agents`, `dependsOn`.

Any other `type` value is accepted with the base spec fields: `type`, `lifecycle`, `owner`, and optionally `system`.
