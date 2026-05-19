---
'@backstage/plugin-catalog-backend-module-github': patch
'@backstage/plugin-catalog-backend-module-github-org': patch
---

Added experimental support for checking suspended users via the GitHub REST API instead of the GraphQL `suspendedAt` field. Enable by setting both `excludeSuspendedUsers: true` and `experimental_checkForSuspendedUsersWithRest: true` in the provider config. When enabled, responses are cached using conditional HTTP requests to minimize REST API rate limit usage.
