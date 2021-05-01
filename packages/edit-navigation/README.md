# Edit navigation

Edit Navigation page module for WordPress - a Gutenberg-based UI for editing navigation menus.

> This package is meant to be used only with WordPress core. Feel free to use it in your own project but please keep in mind that it might never get fully documented.

## Usage

```js
/**
 * WordPress dependencies
 */
import { initialize } from '@wordpress/edit-navigation';

/**
 * Internal dependencies
 */
import blockEditorSettings from './block-editor-settings';

initialize( '#navigation-editor-root', blockEditorSettings );
```

## Hooks

`useMenuItems` and `useNavigationBlock` hooks are the central part of this package. They bridge the gap between the API and the block editor interface:

```js
const menuId = 1;
const query = useMemo( () => ( { menus: menuId, per_page: -1 } ), [ menuId ] );
// Data manipulation:
const {
	menuItems,
	eventuallySaveMenuItems,
	createMissingMenuItems,
} = useMenuItems( query );

// Working state:
const { blocks, setBlocks, menuItemsRef } = useNavigationBlocks( menuItems );

return (
	<BlockEditorProvider
		value={ blocks }
		onInput={ ( updatedBlocks ) => setBlocks( updatedBlocks ) }
		onChange={ ( updatedBlocks ) => {
			createMissingMenuItems( updatedBlocks, menuItemsRef );
			setBlocks( updatedBlocks );
		} }
		settings={ blockEditorSettings }
	>
		<NavigationStructureArea blocks={ blocks } initialOpen />
		<BlockEditorArea
			menuId={ menuId }
			saveBlocks={ () => eventuallySaveMenuItems( blocks, menuItemsRef ) }
			onDeleteMenu={ () => {
				/* ... */
			} }
		/>
	</BlockEditorProvider>
);
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as IE browsers then using [core-js](https://github.com/zloirock/core-js) will add polyfills for these methods._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
