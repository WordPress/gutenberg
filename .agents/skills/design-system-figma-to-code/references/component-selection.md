# Component Selection

Match design elements to @wordpress/ui components. Use `get_components` / `get_component_details` MCP tools if available.

| Design element | Component | Notes |
|---------------|-----------|-------|
| Clickable button | `Button` | Props: `variant`, `tone`, `size` |
| Icon-only button | `IconButton` | Requires `aria-label` |
| Text content | `Text` | Props: `variant` for typography |
| Vertical/horizontal layout | `Stack` | Props: `gap`, `direction`, `align` |
| Modal/dialog | `Dialog.*` | Compound: `Root`, `Trigger`, `Popup`, `Header`, `Content`, `Footer` |
| Confirmation dialog | `AlertDialog.*` | Same structure as Dialog |
| Slide-out panel | `Drawer.*` | Same structure as Dialog |
| Tooltip | `Tooltip.*` | Compound: `Root`, `Trigger`, `Popup`, `Portal` |
| Popover | `Popover.*` | Compound: `Root`, `Trigger`, `Popup`, `Portal` |
| Tab navigation | `Tabs.*` | Compound: `Root`, `List`, `Tab`, `Panel` |
| Expandable section | `Collapsible.*` | Compound: `Root`, `Trigger`, `Panel` |
| Card with collapse | `CollapsibleCard.*` | Built on Collapsible |
| Status indicator | `Badge` | Props: `tone`, `variant` |
| Empty state | `EmptyState` | |
| Form feedback | `Notice` | |
| Hidden label | `VisuallyHidden` | Screen-reader-only content |
| Link | `Link` | Semantic `<a>` with design system styling |

## Variant Mapping

Design variants (size, style, state) map to component props and CSS classes.

In @wordpress/ui, variants use **CSS Module class names** (not data attributes):

```tsx
// Button variants: variant='solid'|'outline'|'minimal', tone='brand'|'neutral', size='default'|'compact'|'small'
<Button variant="outline" tone="neutral" size="compact">Secondary Action</Button>

// Text variants map directly to typography roles:
<Text variant="heading-xl">Page Title</Text>
<Text variant="body-sm">Caption text</Text>
```

If no component matches, check if you can compose existing ones. If not, build a custom component following the [Component Implementation skill](../../design-system-component-implementation/SKILL.md).
