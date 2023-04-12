# Global Styles

This folder contains all the necessary APIs to manipulate the global styles data. It can be potentially extracted to its own package.

# Available public APIs

## useGlobalStylesReset

A React hook used to retrieve whether the Global Styles have been edited and a callback to reset to the default theme values.

```js
import { useGlobalStylesReset } from '@wordpress/block-editor';

function MyComponent() {
	const [ canReset, reset ] = useGlobalStylesReset();

	return canReset 
		? <Button onClick={ () => reset() }>Reset</Button> 
		: null;
}
```

## useGlobalStylesOutput

A React hook used to retrieve the styles array and settings to provide for block editor instances based on the current global styles.

```js
import { useGlobalStylesOutput, BlockEditorProvider, BlockList } from '@wordpress/block-editor';

function MyComponent() {
	const [ styles, settings ] = useGlobalStylesOutput();

	return <BlockEditorProvider settings={{
		styles,
		__experimentalFeatures: settings
	}}>
		<BlockList />
	</BlockEditorProvider>
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
	const [ pColor, setPColor ] = useGlobalStyle( 'color.text', 'core/paragraph', 'user' ); 

	return "Something";
}
```

## useGlobalSetting

A react hook used to retrieve the setting applied to a given context.

```js
import { useGlobalSetting } from '@wordpress/block-editor';

function MyComponent() {
	// The theme color palette.
	const [ colorPalette, setColorPalette ] = useGlobalSetting( 'color.palette.theme' ); 

	// The theme color palette for the paragraph block, ignoring user changes.
	// If the palette is not defined for the paragraph block, the root one is returned.
	const [ pColor, setPColor ] = useGlobalSetting( 'color.palette.theme', 'core/paragraph', 'base' ); 

	return "Something";
}
```
