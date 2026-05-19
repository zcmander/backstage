---
'@backstage/frontend-plugin-api': minor
---

**BREAKING**: Removed the deprecated `NavItemBlueprint`. Navigation items are now discovered from `PageBlueprint` extensions based on their `title` and `icon` params.

If you were still using `NavItemBlueprint`, migrate by moving `title` and `icon` to your `PageBlueprint` instead:

```diff
-const navItem = NavItemBlueprint.make({
-  params: { title: 'Example', icon: ExampleIcon, routeRef },
-});
 const page = PageBlueprint.make({
   params: {
+    title: 'Example',
+    icon: <ExampleIcon fontSize="inherit" />,
     routeRef,
     path: '/example',
     loader: () => import('./Page').then(m => <m.Page />),
   },
 });
```
