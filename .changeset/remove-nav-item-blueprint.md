---
'@backstage/frontend-plugin-api': minor
'@backstage/plugin-app': patch
'@backstage/plugin-catalog': patch
'@backstage/plugin-search': patch
'@backstage/plugin-home': patch
'@backstage/plugin-api-docs': patch
'@backstage/plugin-scaffolder': patch
'@backstage/plugin-techdocs': patch
'@backstage/plugin-user-settings': patch
'@backstage/plugin-devtools': patch
'@backstage/plugin-catalog-unprocessed-entities': patch
'@backstage/plugin-app-visualizer': patch
'@backstage/frontend-test-utils': patch
---

Removed the deprecated `NavItemBlueprint`. Navigation items are now discovered from page extensions via their `title` and `icon` params. The app nav extension still accepts legacy `nav-item` extensions for backward compatibility.
