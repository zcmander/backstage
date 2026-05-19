---
'@backstage/plugin-catalog-backend': patch
---

Added `catalog.actions.experimentalCatalogLayersDescriptions.enabled` config option. When enabled, the `query-catalog-entities` action description references `get-catalog-model-description` for field information instead of embedding a static model description.
