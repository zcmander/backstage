---
'@backstage/frontend-test-utils': patch
---

Added a `mountPath` option to `renderInTestApp` that controls the route path pattern the test element is rendered at. When set, the element is wrapped in a `<Route>` with the given path, enabling `useParams()` to extract route parameters from the URL. When `mountPath` is set and `initialRouteEntries` is not, the initial route entry defaults to the mount path. This is useful for testing page components that depend on URL parameters, such as entity pages that use `useRouteRefParams`.
