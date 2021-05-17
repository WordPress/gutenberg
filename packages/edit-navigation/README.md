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

By default, the Navigation Editor screen allows users to create and edit complex navigations using a block-based UI. The aim is to supercede the current Menus screen by providing a superior experience whilst retaining backwards compatibility.

## Modes

The Navigation Editor has two "modes" for _persistence_ ("saving" navigations) and _rendering_:

1. **Default** - navigations are saved to the _existing_ (post type powered) Menus system and rendered using standard Walker classes.
2. **Block-based** (opt _in_) - navigations continue to be _saved_ using the existing post type system, but non-link blocks are saved (see technical implementation) and _rendered_ as blocks to provide access to the full power of the Navigation block (with some tradeoffs in terms of backwards compatibility).

### Default Mode

In this mode, navigations created in the Navigation Editor are stored using the _existing Menu post type_ (`nav_menu_item`) system. As this method matches that used in the _existing_ Menus screen, there is a smooth upgrade path to using new Navigation Editor screen to edit navigations.

Moreover, when the navigation is rendered on the front of the site the system continues to use [the classic Navigation "Walker" class](https://developer.wordpress.org/reference/classes/walker_nav_menu/), thereby ensuring the HTML markup remains the same when using a classic Theme.

### Block-based Mode

If desired, themes are able to opt into _rendering_ complete block-based menus using the Navigation Editor. This allows for arbitrarily complex navigation block structures to be used in an existing theme whilst still ensuring the navigation data is still _saved_ to the existing (post type powered) Menus system.

Themes can opt into this behaviour by declaring:

```php
add_theme_support( 'block-nav-menus' );
```

This unlocks significant additional capabilities in the Navigation Editor. For example, by default, [the Navigation Editor screen only allows _link_ (`core/navigation-link`) blocks to be inserted into a navigation](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/filters/disable-inserting-non-navigation-blocks.js). When a theme opts into `block-nav-menus` however, users are able to add non-link blocks to a navigation using the Navigation Editor screen, including:

-   `core/navigation-link`.
-   `core/social`.
-   `core/search`.

#### Technical Implementation details

By default, `core/navigation-link` items are serialized and persisted as `nav_menu_item` posts. No serialized block HTML is stored for these standard link blocks.

_Non_-link navigation items however, are [persisted as `nav_menu_items` with a special `type` of `block`](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/store/utils.js#L159-L166). These items have an [_additional_ `content` field which is used to store the serialized block markup](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/lib/navigation.php#L71-L101).

When rendered on the front-end, the blocks are [`parse`d from the `content` field](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/lib/navigation.php#L191-L203) and [rendered as blocks](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/lib/navigation.php#L103-L135).

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

## Glossary

-   **Link block** - the basic `core/navigation-link` block which is the standard block used to add links within navigations.
-   **Navigation block** - the root `core/navigation` block which can be used both with the Navigation Editor and outside (eg: Post / Site Editor).
-   **Navigation Editor screen** - the new screen provided by Gutenberg to allow the user to edit navigations using a block-based UI.

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as IE browsers then using [core-js](https://github.com/zloirock/core-js) will add polyfills for these methods._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
