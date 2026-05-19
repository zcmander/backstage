---
'@backstage/plugin-catalog-backend': patch
---

Fixed a race condition in the stitch queue claim logic where the `SELECT FOR UPDATE SKIP LOCKED` row locks were released before the `next_stitch_at` bump, allowing multiple workers to claim the same entity. Both statements now run inside a single transaction.
