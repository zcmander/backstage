---
'@backstage/backend-defaults': patch
---

Fixed Valkey cluster mode to use `iovalkey`'s `Cluster` class instead of
`createCluster` from `@keyv/redis`. The previous implementation passed a
`@redis/client` `RedisCluster` instance to `@keyv/valkey`, which expects an
`iovalkey` `Cluster` instance. This caused the cluster client to not be
recognized correctly, as the two libraries have incompatible object models.
