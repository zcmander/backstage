---
'@backstage/plugin-app': patch
---

Updated the built-in app nav to discover sidebar entries from page extensions, following the removal of `NavItemBlueprint` in `@backstage/frontend-plugin-api`. Legacy `nav-item` extensions are still accepted so older plugins keep working until they migrate.
