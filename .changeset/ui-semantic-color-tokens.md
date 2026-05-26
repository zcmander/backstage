---
'@backstage/ui': patch
---

Introduces a new set of semantic color token families — Accent, Announcement, Warning, Negative, and Positive — each providing a consistent set of background, foreground, and border tokens for both light and dark themes. A gray scale (`--bui-gray-1` through `--bui-gray-11`) and updated foreground tokens are also included.

The previous tokens remain in place for backward compatibility but are now deprecated and will be removed in a future release. Migrate using the table below.

## Migration

### Surfaces

| Deprecated           | Replacement       |
| -------------------- | ----------------- |
| `--bui-bg-app`       | `--bui-surface-1` |
| `--bui-bg-neutral-1` | `--bui-surface-2` |
| `--bui-bg-neutral-2` | `--bui-surface-3` |
| `--bui-bg-neutral-3` | `--bui-surface-4` |
| `--bui-bg-neutral-4` | `--bui-surface-5` |

### Foreground

| Deprecated         | Replacement             |
| ------------------ | ----------------------- |
| `--bui-fg-danger`  | `--bui-fg-negative`     |
| `--bui-fg-success` | `--bui-fg-positive`     |
| `--bui-fg-info`    | `--bui-fg-announcement` |

### Accent

| Deprecated                | Replacement                |
| ------------------------- | -------------------------- |
| `--bui-bg-solid`          | `--bui-accent-bg`          |
| `--bui-bg-solid-hover`    | `--bui-accent-bg-hover`    |
| `--bui-bg-solid-disabled` | `--bui-accent-bg-disabled` |
| `--bui-fg-solid`          | `--bui-accent-fg`          |
| `--bui-fg-solid-disabled` | `--bui-accent-fg-disabled` |

### Positive

| Deprecated               | Replacement                 |
| ------------------------ | --------------------------- |
| `--bui-bg-success`       | `--bui-positive-bg-subdued` |
| `--bui-fg-success-on-bg` | `--bui-positive-fg-subdued` |
| `--bui-border-success`   | `--bui-positive-border`     |

### Negative

| Deprecated              | Replacement                 |
| ----------------------- | --------------------------- |
| `--bui-bg-danger`       | `--bui-negative-bg-subdued` |
| `--bui-fg-danger-on-bg` | `--bui-negative-fg-subdued` |
| `--bui-border-danger`   | `--bui-negative-border`     |

### Warning

| Deprecated               | Replacement                |
| ------------------------ | -------------------------- |
| `--bui-bg-warning`       | `--bui-warning-bg-subdued` |
| `--bui-fg-warning-on-bg` | `--bui-warning-fg-subdued` |
| `--bui-border-warning`   | `--bui-warning-border`     |

### Announcement

| Deprecated            | Replacement                     |
| --------------------- | ------------------------------- |
| `--bui-bg-info`       | `--bui-announcement-bg-subdued` |
| `--bui-fg-info-on-bg` | `--bui-announcement-fg-subdued` |
| `--bui-border-info`   | `--bui-announcement-border`     |
