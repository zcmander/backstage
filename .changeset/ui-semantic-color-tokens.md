---
'@backstage/ui': patch
---

Introduces a new set of semantic color token families — Accent, Announcement, Warning, Negative, and Positive — each providing a consistent set of background, foreground, and border tokens for both light and dark themes. A gray scale (`--bui-gray-1` through `--bui-gray-11`) and updated foreground tokens are also included.

The previous tokens (`--bui-bg-solid-*`, `--bui-bg-neutral-*`, `--bui-bg-danger/warning/success/info`, `--bui-fg-solid`, `--bui-fg-danger/success/info`, `--bui-border-*`, and `--bui-shadow`) remain in place for backward compatibility but are now deprecated and will be removed in a future release.
