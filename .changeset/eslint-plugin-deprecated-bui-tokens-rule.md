---
'@backstage/eslint-plugin': patch
---

Adds a new `@backstage/no-deprecated-bui-tokens` lint rule that warns when a deprecated `@backstage/ui` CSS token is referenced in a JavaScript or TypeScript file. The rule is included in the `recommended` config, so plugin authors using `plugin:@backstage/recommended` will receive warnings automatically when using tokens that have been superseded by the new semantic color families.
