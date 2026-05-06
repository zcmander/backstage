---
'@backstage/plugin-auth-backend': patch
---

Added a new `auth.experimentalRefreshToken.validateCatalogUserExistence` config option. When enabled, refresh token usage will verify that the user's catalog entity still exists before issuing a new access token. If the user has been removed from the catalog, the refresh is rejected and the session is revoked. Transient catalog errors reject the refresh but preserve the session for retry.
