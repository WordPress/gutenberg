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

By default, the Navigation Editor screen allows users to create and edit complex navigations using a block-based UI. The aim is to supercede [the current Menus screen](https://codex.wordpress.org/WordPress_Menu_User_Guide) by providing a superior experience whilst retaining backwards compatibility.

The editing experience is provided as a block editor wrapper around the core functionality of the **Navigation _block_**. Features of the block are disabled/enhanced as necessary to provide an experience appropriate to editing a navigation outside of a Full Site Editing context.

## Modes

The Navigation Editor has two "modes" for _persistence_ ("saving" navigations) and _rendering_:

1. **Classic (default)** - navigations are saved to the _existing_ (post type powered) Menus system and rendered using standard Walker classes.
2. **Block-based** (opt _in_) - navigations continue to be _saved_ using the existing post type system, but:
    - the [navigation is _rendered_ using the `core/navigation` block](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/lib/navigation.php#L228) (as opposed to Walker) to provide access to the full power of blocks (with some tradeoffs in terms of backwards compatibility).
    - non-link blocks (anything that is not `core/navigation-link`) are saved as _blocks_.

### Classic Mode

In this mode, navigations created in the Navigation Editor are stored using the _existing Menu post type_ (`nav_menu_item`) system. As this method matches that used in the _existing_ Menus screen, there is a smooth upgrade path to using new Navigation Editor screen to edit navigations.

Moreover, when the navigation is rendered on the front of the site the system continues to use [the classic Navigation "Walker" class](https://developer.wordpress.org/reference/classes/walker_nav_menu/), thereby ensuring the HTML markup remains the same when using a classic Theme.

### Block-based Mode

**Important**: block-based mode has been temporarily **_disabled_** until it becomes stable. So, if a theme declares support for the `block-nav-menus` feature it will not affect the frontend.

If desired, themes are able to opt into [_rendering_ complete block-based menus](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/lib/navigation.php#L228) using the Navigation Editor. This allows for arbitrarily complex navigation block structures to be used in an existing theme whilst still ensuring the navigation data is still _saved_ to the existing (post type powered) Menus system.

Themes can opt into this behaviour by declaring:

```php
add_theme_support( 'block-nav-menus' );
```

This unlocks significant additional capabilities in the Navigation Editor. For example, by default, [the Navigation Editor screen only allows _link_ (`core/navigation-link`) blocks to be inserted into a navigation](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/filters/disable-inserting-non-navigation-blocks.js). When a theme opts into `block-nav-menus` however, users are able to add non-link blocks to a navigation using the Navigation Editor screen, including:

-   `core/navigation-link`.
-   `core/social`.
-   `core/search`.

As these items are still saved to `nav_menu_items` this ensures if we ever revert to classic (Walker-based) rendering, these items will still be rendered (as blocks).

## Backwards compatibility

By design the underlying systems of the Nav Editor screen should be largely backwards compatible with the existing Menus screen. Therefore any navigations created or edited using the new Navigation Editor screen should continue to work in the existing classic Menus screen.

Currently, the only exception to this would be any custom functionality added (by Plugins or otherwise) to the existing Menus screen would not be replicated in the new Navigation Editor screen. In this scenario there might be danger of some data loss.

### Downgrading from block-based to classic Themes

If the user switches to a theme that does not support block menus, or disables this functionality, ~non-link blocks are no longer rendered on the frontend~ [block-based links will still be rendered on the front end](https://github.com/WordPress/gutenberg/blob/7310097da5e16159b79e6e039a2cb3812cb9055e/lib/navigation.php#L104-L135). Care is also taken to ensure that users can still see their data on the existing Menus screen.

## Block to Menu Item mapping

The Navigation Editor needs to be able to map navigation items in two directions:

1. `nav_menu_item`s to Blocks - when displaying an existing navigation.
2. Blocks to `nav_menu_item`s - when _saving_ an navigation being editing in the Navigation screen.

The Navigation Editor has two dedicated methods for handling mapping between these two expressions of the data:

-   [`menuItemToBlockAttributes()`](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/store/utils.js#L261-L313).
-   [`blockAttributestoMenuItem()`](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/store/utils.js#L184-L253)

To understand these fully, one must appreciate that WordPress maps raw `nav_menu_item` posts to [Menu item _objects_](https://core.trac.wordpress.org/browser/tags/5.7.1/src/wp-includes/nav-menu.php#L786). These have various properties which map as follows:

| Menu Item object property |               Equivalent Block Attribute               |                                                Description                                                |
| :------------------------ | :----------------------------------------------------: | :-------------------------------------------------------------------------------------------------------: |
| `ID`                      |                      Not mapped.                       |                         The term_id if the menu item represents a taxonomy term.                          |
| `attr_title`              |                        `title`                         |                        The title attribute of the link element for this menu item.                        |
| `classes`                 |                      `classNames`                      |                The array of class attribute values for the link element of this menu item.                |
| `db_id`                   |                      Not mapped.                       |          The DB ID of this item as a nav_menu_item object, if it exists (0 if it doesn't exist).          |
| `description`             |                     `description`                      |                                    The description of this menu item.                                     |
| `menu_item_parent`        | Not mapped.<sup>[1](#menu_item_menu_item_parent)</sup> |           The DB ID of the nav_menu_item that is this item's menu parent, if any. 0 otherwise.            |
| `object`                  |                         `type`                         |          The type of object originally represented, such as 'category', 'post', or 'attachment'.          |
| `object_id`               |                          `id`                          | The DB ID of the original object this menu item represents, e.g. ID for posts and term_id for categories. |
| `post_parent`             |                      Not mapped.                       |                  The DB ID of the original object's parent object, if any (0 otherwise).                  |
| `post_title`              |                      Not mapped.                       |                   A "no title" label if menu item represents a post that lacks a title.                   |
| `target`                  |    `opensInNewTab`<sup>[2](#menu_item_target)</sup>    |                       The target attribute of the link element for this menu item.                        |
| `title`                   |                        `label`                         |                                       The title of this menu item.                                        |
| `type`                    |                         `kind`                         |             The family of objects originally represented, such as 'post_type' or 'taxonomy'.              |
| `type_label`              |                      Not mapped.                       |                        The singular label used to describe this type of menu item.                        |
| `url`                     |                         `url`                          |                                  The URL to which this menu item points.                                  |
| `xfn`                     |                         `rel`                          |                       The XFN relationship expressed in the link of this menu item.                       |
| `\_invalid`               |                      Not mapped.                       |                     Whether the menu item represents an object that no longer exists.                     |

-   [<a name="menu_item_menu_item_parent">1</a>] - the parent -> child relationship is expressed in block via the `innerBlocks` attribute and is therefore not required as a explicit block attribute.
-   [<a name="menu_item_target">2</a>] - applies only if the value of the `target` field is `_blank`.

### Inconsistencies

#### Mapping

For historical reasons, the following properties display some inconsistency in their mapping from Menu Item Object to Block attribute:

-   `type` -> `kind` - the family of objects is stored as `kind` on the block and so must be mapped accordingly.
-   `object` -> `type` - the type of object is stored as `type` on the block and so must be mapped accordingly.
-   `object_id` -> `id` - the block stores a reference to the original object's ID as the `id` _attribute_. This should not be confused with the block's `clientId` which is unrelated.
-   `attr_title` -> `title` - the HTML `title` attribute is stored as `title` on the block and so must be mapped accordingly.

#### Object Types

-   Menu Item objects which represent "Tags" are stored in WordPress as `post_tag` but the block expects their `type` attribute to be `tag` (omiting the `post_` suffix). This inconsistency is accounted for in [the mapping utilities methods](https://github.com/WordPress/gutenberg/blob/7fcd57c9a62c232899e287f6d96416477d810d5e/packages/edit-navigation/src/store/utils.js#L279-L281).

## Hooks

The `useNavigationEditor` and `useEntityBlockEditor` hooks are the central part of this package. They bridge the gap between the API and the block editor interface:

```jsx
// Data from API:
const {
	menus,
	hasLoadedMenus,
	selectedMenuId,
	navigationPost,
} = useNavigationEditor();

// Working state:
const [ blocks, onInput, onChange ] = useEntityBlockEditor(
	NAVIGATION_POST_KIND,
	NAVIGATION_POST_POST_TYPE,
	{
		id: navigationPost?.id,
	}
);

const isBlockEditorReady = !! (
	menus?.length &&
	navigationPost &&
	selectedMenuId
);

return (
	<BlockEditorProvider
		value={ blocks }
		onInput={ onInput }
		onChange={ onChange }
		settings={ blockEditorSettings }
	>
		{ isBlockEditorReady && (
			<div className="edit-navigation-layout__content-area">
				<BlockTools>
					<Editor isPending={ ! hasLoadedMenus } />
				</BlockTools>
			</div>
		) }
	</BlockEditorProvider>
);
```

## Glossary

-   **(Navigation) link** - the basic `core/navigation-link` block which is the standard block used to add links within navigations.
-   **Block-based link** - any navigation item that is _not_ a `core/navigation-link` block. These are persisted as blocks but still utilise the existing Menus post type system.
-   **Navigation block** - the root `core/navigation` block which can be used both with the Navigation Editor and outside (eg: Post / Site Editor).
-   **Navigation editor / screen** - the new screen provided by Gutenberg to allow the user to edit navigations using a block-based UI.
-   **Menus screen** - the current/existing [interface/screen for managing Menus](https://codex.wordpress.org/WordPress_Menu_User_Guide) in WordPress WPAdmin.

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
