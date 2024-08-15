# Global Styles

This folder contains all the necessary APIs to manipulate the global styles data. It can be potentially extracted to its own package.

# Available public APIs

## useGlobalStylesReset

A React hook used to retrieve whether the Global Styles have been edited and a callback to reset to the default theme values.

```js
import { useGlobalStylesReset } from '@wordpress/block-editor';

function MyComponent() {
	const [ canReset, reset ] = useGlobalStylesReset();

	return canReset ? <Button onClick={ () => reset() }>Reset</Button> : null;
}
```

## useGlobalStylesOutput

A React hook used to retrieve the styles array and settings to provide for block editor instances based on the current global styles.

```js
import {
	useGlobalStylesOutput,
	BlockEditorProvider,
	BlockList,
} from '@wordpress/block-editor';

function MyComponent() {
	const [ styles, settings ] = useGlobalStylesOutput();

	return (
		<BlockEditorProvider
			settings={ {
				styles,
				__experimentalFeatures: settings,
			} }
		>
			<BlockList />
		</BlockEditorProvider>
	);
}
```

## useGlobalStyle

A react hook used to retrieve the style applied to a given context.

```js
import { useGlobalStyle } from '@wordpress/block-editor';

function MyComponent() {
	// Text color for the site root.
	const [ color, setColor ] = useGlobalStyle( 'color.text' );

	// The user modified color for the core paragraph block.
	const [ pColor, setPColor ] = useGlobalStyle(
		'color.text',
		'core/paragraph',
		'user'
	);

	return 'Something';
}
```

## useGlobalSetting

A react hook used to retrieve the setting applied to a given context.

```js
import { useGlobalSetting } from '@wordpress/block-editor';

function MyComponent() {
	// The theme color palette.
	const [ colorPalette, setColorPalette ] = useGlobalSetting(
		'color.palette.theme'
	);

	// The theme color palette for the paragraph block, ignoring user changes.
	// If the palette is not defined for the paragraph block, the root one is returned.
	const [ pColor, setPColor ] = useGlobalSetting(
		'color.palette.theme',
		'core/paragraph',
		'base'
	);

	return 'Something';
}
```

## UI Components

The global styles folder also offers a set of reusable UI components. These components follow a strict set of guidelines:

-   They are independent of any context or any store dependency. They only rely on the props passed to them.
-   They receive a similar set of props:

    -   `value`: The value is a style object that maps closely the format used in `theme.json` and is also very close to the format of the `style` attributes for blocks. There are some differences with the block attributes due to the iteration process and the fact that we need to maintain compatibility with the existing blocks even if they predate the introduction of Global Styles and these UI components. An example value for a style object is:

```js
{
	color: {
		text: 'var:preset|color|blue',
		background: '#FF0000',
	},
	typography: {
		fontFamily: 'var:preset|font-family|base',
		fontSize: '10px',
		lineHeight: 1.5,
	},
	spacing: {
		padding: 'var:preset|spacing|medium',
	},
	elements: {
		link: {
			color: {
			text: 'var:preset|color|green',
			},
		},
	},
}
```

-   `onChange`: A callback that receives the new value and is called when the user changes the value of the UI component.
-   `inheritedValue`: The inherited value is a style object that represents the combined value of the style inherited from the parent context in addition to the style applied to the current context. The format is the same as the `value` prop.
-   `settings`: The settings are the theme.json settings. They are used to provide the UI components with the necessary information to render the UI. An example value for the settings is:

```js
{
	color: {
		palette: {
			custom: [
				{
					slug: 'black',
					color: '#000000',
				},
				{
					slug: 'white',
					color: '#FFFFFF',
				},
				{
					slug: 'blue',
					color: '#0000FF',
				},
			]
		},
		gradients: {
			custom: [
				{
					slug: 'gradient-1',
					gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
				},
				{
					slug: 'gradient-2',
					gradient: 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
				},
			]
		},
	},
	typography: {
		fontSizes: [
			{
				slug: 'small',
				size: '12px',
			},
			{
				slug: 'medium',
				size: '16px',
			},
			{
				slug: 'large',
				size: '24px',
			},
		],
	}
}
```
-   `defaultControls`: The default controls are the controls that are used by default to render the UI. They are used to provide the UI components with the necessary information to render the UI. An example value for the default controls for the `ColorPanel` component is:

```js
{
	background: true,
	text: true,
	link: true,
},
```
