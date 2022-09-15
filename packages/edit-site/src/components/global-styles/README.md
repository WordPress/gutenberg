# Global Styles

This folder contains all the necessary APIs to render the global styles UI and to manipulate the global styles data. It can be potentially extracted to its own package.

# Available public APIs

## GlobalStylesUI

A component used to render the Global Styles UI. It's current used in the sidebar of the site editor.

```js
import { GlobalStylesUI } from './global-styles';

function MyComponent() {
	return <GlobalStylesUI />;
}
```

## useGlobalStylesReset

A React hook used to retrieve whether the Global Styles have been edited and a callback to reset to the default theme values.

```js
import { useGlobalStylesReset } from './global-styles';

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
import { useGlobalStylesOutput } from './global-styles';
import { BlockEditorProvider, BlockList } from '@wordpress/block-editor';

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

## useStyle

A react hook used to retrieve the style applied to a given context.

```js
import { useStyle } from './global-styles';

function MyComponent() {
	// Text color for the site root.
	const [ color, setColor ] = useStyle( 'color.text' ); 

	// The user modified color for the core paragraph block.
	const [ pColor, setPColor ] = useStyle( 'color.text', 'core/paragraph', 'user' ); 

	return "Something";
}
```

## useSetting

A react hook used to retrieve the setting applied to a given context.

```js
import { useSetting } from './global-styles';

function MyComponent() {
	// The default color palette.
	const [ colorPalette, setColorPalette ] = useSetting( 'color.palette' ); 

	// The base (theme + core) color palette for the paragraph block,
	// ignoring user provided palette.
	// If the palette is not defined for the paragraph block, the root one is returned.
	const [ pColor, setPColor ] = useSetting( 'color.palette', 'core/paragraph', 'base' ); 

	return "Something";
}
```
