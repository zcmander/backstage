---
'@backstage/plugin-catalog-backend-module-msgraph': patch
---

Reverted the server-side `accountEnabled eq true` base filter that was added in v1.51.0, which broke the `userGroupMember` path because the group members endpoint doesn't support `$filter` on that property. Disabled users are now filtered client-side in both the `/users` and group members paths. The mutual exclusivity check between `userFilter` and `userGroupMemberFilter` has been restored.
