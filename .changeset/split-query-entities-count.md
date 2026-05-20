---
'@backstage/plugin-catalog-backend': patch
---

Split the `queryEntities` list and count into separate queries instead of a multi-reference CTE. When the `filtered` CTE was referenced twice (once for the count, once for the data), PostgreSQL refused to inline it, forcing full materialization of the filtered set before applying `LIMIT`. By running the count as a standalone query, the list CTE is only referenced once, allowing the planner to short-circuit on `LIMIT` and return the first page in milliseconds instead of waiting for the full filtered set to materialize.
