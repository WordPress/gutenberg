# Disallow missing `__next40pxDefaultSize` prop (components-no-missing-40px-size-prop)

Enforces that specific components from `@wordpress/components` include the `__next40pxDefaultSize` prop to opt-in to the new 40px default size.

This is a temporary rule to help migrate components to the new default size. Once the grace period is over and all components default to the new 40px size, this rule can be removed.

## Rule details

The following components are checked by this rule:

-   BorderBoxControl
-   BorderControl
-   BoxControl
-   Button
-   ComboboxControl
-   CustomSelectControl
-   FontAppearanceControl
-   FontFamilyControl
-   FontSizePicker
-   FormFileUpload (special case - see below)
-   FormTokenField
-   InputControl
-   LetterSpacingControl
-   LineHeightControl
-   NumberControl
-   RangeControl
-   SelectControl
-   TextControl
-   ToggleGroupControl
-   UnitControl

Examples of **incorrect** code for this rule:

```jsx
import { Button, InputControl } from '@wordpress/components';

<Button>Click me</Button>
<InputControl value={value} onChange={onChange} />
<Button __next40pxDefaultSize={false}>Click me</Button>
<Button size="default">Click me</Button>
```

Examples of **correct** code for this rule:

```jsx
import { Button, InputControl } from '@wordpress/components';

<Button __next40pxDefaultSize>Click me</Button>
<Button __next40pxDefaultSize={true}>Click me</Button>
<InputControl __next40pxDefaultSize value={value} onChange={onChange} />
<Button size="small">Click me</Button>
<Button size="compact">Click me</Button>
```

## FormFileUpload special case

`FormFileUpload` can use either the `__next40pxDefaultSize` prop or the `render` prop to be considered valid:

```jsx
import { FormFileUpload } from '@wordpress/components';

// Both are valid:
<FormFileUpload __next40pxDefaultSize />
<FormFileUpload render={({ open }) => <button onClick={open}>Upload</button>} />
```

## Options

### checkLocalImports

When set to `true`, the rule also checks components imported from relative paths. This is useful inside the `@wordpress/components` package itself, where components are imported via relative paths instead of `@wordpress/components`.

```json
{
	"@wordpress/components-no-missing-40px-size-prop": [
		"error",
		{ "checkLocalImports": true }
	]
}
```

## Important notes

-   By default, this rule only applies to components imported from `@wordpress/components`.
-   Components from other packages (like `@wordpress/ui`) or locally defined components with the same name are not affected.
-   Aliased imports (e.g., `import { Button as WPButton }`) are correctly tracked.
-   Components with a non-default `size` prop (e.g., `size="small"`, `size="compact"`) are exempt from this rule.
-   Use the `checkLocalImports` option when linting inside the `@wordpress/components` package.
