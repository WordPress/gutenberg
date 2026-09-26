# Prevent Unsafe `render` Composition Order (`no-unsafe-render-order`)

Prevents `render` prop composition patterns that silently change the final DOM element and strip useful semantics.

This rule currently covers two patterns:

-   No component should host `render={ <VisuallyHidden /> }`, because that replaces the host element with `VisuallyHidden`'s default `<div>`.
-   `Link` should not host `render={ <Text /> }`, because that replaces the anchor with `Text`'s default `<span>`.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
import { Dialog, Link, Text, VisuallyHidden } from '@wordpress/ui';

<Dialog.Title render={ <VisuallyHidden /> }>Title</Dialog.Title>;
<CustomThing render={ <VisuallyHidden /> }>Hidden content</CustomThing>;
<Link href="#" render={ <Text /> }>
	Read more
</Link>;
```

Examples of **correct** code for this rule:

```jsx
import { Dialog, Link, Text, VisuallyHidden } from '@wordpress/ui';

<VisuallyHidden render={ <Dialog.Title /> }>Title</VisuallyHidden>;
<Text render={ <Link href="#" /> }>Read more</Text>;
```

## Options

### `checkLocalImports`

When set to `true`, the rule also checks tracked components imported from relative paths. This is useful inside packages where the components are imported locally instead of from a package entrypoint.

```json
{
	"@wordpress/no-unsafe-render-order": [
		"error",
		{ "checkLocalImports": true }
	]
}
```

## Important notes

-   By default, the rule checks `VisuallyHidden`, `Text`, and `Link` when they are imported from `@wordpress/ui`.
-   Named import aliases such as `import { Link as UILink }` are tracked.
-   When `checkLocalImports` is enabled, the rule also tracks local named imports for the covered patterns.
