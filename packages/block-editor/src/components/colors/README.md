# Color Higher-Order Component and Hook

A set of functions to enable color functionality in blocks. The first two functions use the concept of a higher-order component (HOC), see [React's Higher-Order Components documentation](https://reactjs.org/docs/higher-order-components.html) for additional details.

## `withColors` Higher-Order Component

A higher-order component, which handles color logic for class generation color value, retrieval and color attribute setting.

### Usage

```jsx
export default compose(
	withColors( 'backgroundColor', { textColor: 'color' } ),
	MyColorfulComponent
);
```

## `createCustomColors` HOC

A higher-order component factory for creating a 'withCustomColors' HOC, which handles color logic for class generation color value, retrieval and color attribute setting. Use this higher-order component to work with a custom set of colors.

### Usage

```jsx
import { createCustomColorsHOC } from '@wordpress/block-editor';

const CUSTOM_COLORS = [
	{ name: 'Red', slug: 'red', color: '#ff0000' },
	{ name: 'Blue', slug: 'blue', color: '#0000ff' },
];
const withCustomColors = createCustomColorsHOC( CUSTOM_COLORS );

export default compose(
	withCustomColors( 'backgroundColor', 'borderColor' ),
	MyColorfulComponent
);
```

## `useColors` hook

Provides the functionality of `withColors` as a React hook, see [React's hook overview](https://reactjs.org/docs/hooks-overview.html) for additional details on using hooks.

It takes an array of color configuration objects for its first parameter. The second parameter is an optional hooks dependency array for cases where you have closures in your configuration objects, and the third is an optional string to overwrite the default panel title, `__( 'Color Settings' )`.

### Usage

```jsx
import { __experimentalUseColors } from '@wordpress/block-editor';

function MyColorfulComponent() {
	const { TextColor } = __experimentalUseColors(
		[ { name: 'textColor', property: 'color' } ],
		{
			contrastCheckers: [
				{
					textColor: true,
				},
			],
		}
	);

	return (
		<>
			<TextColor>{ /* Colorful content */ }</TextColor>
		</>
	);
}
```

### Note on sunsetting.

The functionality provided by the `useColors` hook is also available in the form of a—[also currently experimental](https://github.com/WordPress/gutenberg/pull/21021)—support key, `__experimentalColor`. It's expected that the support key version of this feature sunsets the hook.

## Related components.

-   [`PanelColorSettings`](https://github.com/WordPress/gutenberg/blob/bb00ad891db9937862b16867dcebd2a4d830ea86/packages/block-editor/src/components/panel-color-settings/index.js).
-   [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/bb00ad891db9937862b16867dcebd2a4d830ea86/packages/block-editor/src/components/inspector-controls/README.md).
