---
'@backstage/plugin-catalog-react': patch
---

The entity list provider now fetches the entity list and the total count as two separate parallel requests when using cursor or offset pagination. The list query skips the expensive count computation (using `totalItems: 'exclude'`), so the table populates immediately. The count arrives asynchronously and updates the title. This significantly improves perceived latency for catalog page loads on large catalogs.
