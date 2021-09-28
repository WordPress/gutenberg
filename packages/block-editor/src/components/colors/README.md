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
## Related components.

-   [`PanelColorSettings`](https://github.com/WordPress/gutenberg/blob/bb00ad891db9937862b16867dcebd2a4d830ea86/packages/block-editor/src/components/panel-color-settings/index.js).
-   [`InspectorControls`](https://github.com/WordPress/gutenberg/blob/bb00ad891db9937862b16867dcebd2a4d830ea86/packages/block-editor/src/components/inspector-controls/README.md).
