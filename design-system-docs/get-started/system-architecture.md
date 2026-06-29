# System architecture

The system has four practical layers.

| Layer | Purpose | Flexibility | Use when |
| --- | --- | --- | --- |
| `@wordpress/theme` | Tokens, theme generation, token validation, and build-time token fallbacks. | Low-level foundation | You need color, spacing, radius, motion, typography, or theming behavior. |
| `@wordpress/ui` | New generic UI primitives built on design tokens. | High | You need reusable buttons, overlays, forms, text, layout, or status primitives. |
| `@wordpress/admin-ui` | Opinionated admin page shell and page-level layout. | Intentionally low | You need a WordPress admin page to follow the shared page spec. |
| Product code | Routing, data fetching, app chrome, feature-specific composition. | Product-owned | You need to connect system pieces to application behavior. |

A useful rule from the admin-ui proposal is: admin-ui hides decisions, `@wordpress/ui` exposes them. Generic controls belong in UI. Admin page structure belongs in admin-ui. Routing and data loading belong to the consumer.

## Architectural rules

- Keep tokens in `@wordpress/theme`; consume semantic tokens rather than copying values.
- Keep generic components in `@wordpress/ui`; do not hide product-specific decisions in generic primitives.
- Keep page-shell decisions in `@wordpress/admin-ui`; avoid exporting a loose bag of layout pieces when the point is consistency.
- Prefer typed data for highly constrained admin page structure, such as breadcrumbs and action groups.
- Keep routing integration as data or a narrow adapter prop. Do not make admin-ui depend directly on a router.

## Sources

- [Admin UI 2.0 proposal, issue #77628](../_sources/github/threads/issue-77628.md)
- [@wordpress/admin-ui README](../../packages/admin-ui/README.md)
- [@wordpress/ui README](../../packages/ui/README.md)
