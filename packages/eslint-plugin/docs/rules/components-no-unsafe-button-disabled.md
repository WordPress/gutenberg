# Disallow using disabled on Button without accessibleWhenDisabled (components-no-unsafe-button-disabled)

Disabling a `Button` component without maintaining focusability can cause accessibility issues by hiding its presence from screen reader users, or preventing focus from returning to a trigger element.

This rule enforces that `Button` components from `@wordpress/components` include the `accessibleWhenDisabled` prop when the `disabled` prop is set.

## Rule details

Examples of **incorrect** code for this rule:

```jsx
import { Button } from '@wordpress/components';

<Button disabled>Click me</Button>
<Button disabled={true}>Click me</Button>
<Button disabled={someVar}>Click me</Button>
```

Examples of **correct** code for this rule:

```jsx
import { Button } from '@wordpress/components';

<Button disabled accessibleWhenDisabled>Click me</Button>
<Button disabled accessibleWhenDisabled={true}>Click me</Button>
<Button disabled accessibleWhenDisabled={false}>Click me</Button>
<Button disabled accessibleWhenDisabled={someVar}>Click me</Button>
<Button disabled={false}>Click me</Button>
<Button onClick={handleClick}>Click me</Button>
```

## Options

### checkLocalImports

When set to `true`, the rule also checks `Button` components imported from relative paths. This is useful inside the `@wordpress/components` package itself, where components are imported via relative paths instead of `@wordpress/components`.

```json
{
	"@wordpress/components-no-unsafe-button-disabled": [
		"error",
		{ "checkLocalImports": true }
	]
}
```

## Important notes

-   By default, this rule only applies to `Button` components imported from `@wordpress/components`.
-   `Button` components from other packages (like `@wordpress/ui`) or locally defined components with the same name are not affected.
-   Aliased imports (e.g., `import { Button as WPButton }`) are correctly tracked.
-   Use the `checkLocalImports` option when linting inside the `@wordpress/components` package.
