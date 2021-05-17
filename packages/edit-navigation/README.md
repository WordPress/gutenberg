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

## Purpose

By default, the Navigation Editor screen creates block based representations of menus allows users to create and edit complex menus using block-based UI.

In addition to this the Navigation Editor has two "modes" for _persistence_ ("saving" navigations) and _rendering_:

1. Default - navigations are saved to the _existing_ (post type powered) Menus system and rendered using standard Walker classes.
2. Block-based - navigations continue to be _saved_ using the existing post type system, but non-link blocks are saved (see technical implementation) and _rendered_ as blocks to provide access to the full power of the Navigation block (with some tradeoffs in terms of backwards compatibility).

### Default Mode

In this mode, navigations created in the Navigation Editor are stored using the _existing Menu post type_ (`nav_menu_item`) system. As this method matches that used in the _existing_ Menus screen, there is a smooth upgrade path to using new Navigation Editor screen to edit navigations.

Moreover, when the navigation is rendered on the front of the site the system continues to use [the classic Navigation "Walker" class](https://developer.wordpress.org/reference/classes/walker_nav_menu/), thereby ensuring the HTML markup remains the same when using a classic Theme.

### Block-based Mode

If desired, themes are able to opt into _rendering_ complete block-based menus. This allows for arbitrarily complex Navigation block structures to be used in an existing theme whilst still ensuring the navigation data is still _saved_ to the existing (post type powered) Menus system.

Themes can opt into this by declaring:

```php
add_theme_support( 'block-nav-menus' );
```

This unlocks significant additional capabilities in the Navigation Editor. For example, by default, the Navigation Editor screen only allows link blocks to be inserted into a navigation. When a theme opts into `block-nav-menus` however, users are able to add non-link blocks to a navigation using the Navigation Editor screen, including:

-   `core/navigation-link`.
-   `core/social`.
-   `core/search`.

These are persisted as a `nav_menu_item` post with a type of `block` and when rendered on the frontend these are parsed and rendered as _blocks_.

#### Technical Implementation details

By default, `core/navigation-link` items are serialized and persisted as `nav_menu_item` posts. No serialized block HTML is stored for link blocks.

Non-link navigation items however, are persisted as `nav_menu_items` with a special `type` of `block`. These items have an _additional_ `content` field which is used to store the serialized block markup.

When rendered on the front-end, the blocks are `parse`d from the `content` field and rendered as blocks.

If the user switches to a theme that does not support block menus, or disables this functionality, non-link blocks are no longer rendered on the frontend. Care is taken, however, to ensure that users can still see their data on the existing Menus screen.

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
