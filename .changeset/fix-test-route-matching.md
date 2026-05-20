---
'@backstage/frontend-test-utils': patch
---

Fixed `renderInTestApp` to set up React Router route matching when `mountedRoutes` are provided. Previously, mounted routes only fed the route resolution API for link generation (`useRouteRef`), but did not create `<Route>` elements for param extraction (`useParams`). This meant that `initialRouteEntries` had no effect on route param availability. The test element is now wrapped in `<Routes>` with a `<Route>` for each mounted path, matching the behavior of the real `AppRoutes` extension.
