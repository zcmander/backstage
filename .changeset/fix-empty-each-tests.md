---
'@backstage/backend-test-utils': patch
---

Fixed a crash in test suites that use `TestDatabases` or `TestCaches` when none of the requested database or cache engines are available. Previously, `eachSupportedId()` would return an empty array causing `describe.each` to throw and prevent the entire suite from running. Now returns a placeholder entry so individual tests report a clear failure instead.
