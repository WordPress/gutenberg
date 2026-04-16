# Prevent unsafe `render` composition order in `@wordpress/ui` (`ui-no-unsafe-render-order`)

Prevents `render` prop composition patterns in `@wordpress/ui` that silently change the final DOM element and strip useful semantics.

This rule currently covers two high-signal cases:

- `Dialog.Title`, `Popover.Title`, `Field.Label`, and `Fieldset.Legend` should not host `render={ <VisuallyHidden /> }`, because that replaces their semantic element with `VisuallyHidden`'s default `<div>`.
- `Link` should not host `render={ <Text /> }`, because that replaces the anchor with `Text`'s default `<span>`.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
import { Dialog, Link, Text, VisuallyHidden } from '@wordpress/ui';

<Dialog.Title render={ <VisuallyHidden /> }>Title</Dialog.Title>;
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

When set to `true`, the rule also checks tracked components imported from relative paths. This is useful inside the `@wordpress/ui` package itself, where components are often imported locally instead of from `@wordpress/ui`.

```json
{
	"@wordpress/ui-no-unsafe-render-order": [
		"error",
		{ "checkLocalImports": true }
	]
}
```

## Important notes

- By default, the rule only checks components imported from `@wordpress/ui`.
- Named import aliases such as `import { Dialog as UIDialog }` are tracked.
- Namespace imports such as `import * as UI from '@wordpress/ui'` are also tracked.
- The rule is intentionally narrow for now and only covers patterns that are already documented as unsafe.
