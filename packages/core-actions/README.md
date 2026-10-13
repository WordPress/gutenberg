# Core Actions

The actions WordPress core registers for its entities, such as "Rename", "Duplicate" or "Move to trash". They are shown in the DataViews lists of the site editor and in the inspector of the editor.

WordPress registers them on the server through the entity actions API, like a plugin registers its own: the data of each action, such as its label, is registered in PHP, and its JavaScript parts, such as its callback or its modal, are in a script module. The editor reads the actions of an entity from the `/wp/v2/entity-actions` REST API route, imports the script modules the route lists, and merges each action with its JavaScript parts. The actions moved here from `@wordpress/fields`.

## Collections

The actions of this package live in folders of `src`, one per collection:

-   `post_type_supports`: the default actions of every post type (`delete-post`, `duplicate-post`, `move-to-trash`, `order-pages`, `permanently-delete`, `rename-post`, `reset-post`, `restore`, `view-post`, and `view-post-revisions`).
-   `wp_block`: the actions patterns have on top of the defaults (`duplicate-pattern` and `export-pattern`).
-   `wp_template_part`: the actions template parts have on top of the defaults (`duplicate-template-part`).

Each action has a folder named after its id, with the data of the action in `action.php` and its JavaScript parts in `action.tsx`. The `index.ts` of each collection is its script module, whose default export maps the id of each action to its JavaScript parts.

`src/index.php` registers the actions of each post type exposed in the REST API, on the `wp_entity_actions_api_init` action at priority 0, so a plugin hooking it at the default priority can remove or replace them:

-   `view-post`, for the viewable post types.
-   `view-post-revisions`, for the post types supporting `revisions`.
-   `duplicate-post`, for the post types the user can create, except templates, template parts, and patterns. Only in the Gutenberg plugin.
-   `duplicate-template-part`, for template parts, when the user can create them and the theme is a block theme.
-   `duplicate-pattern`, for patterns, when the user can create them.
-   `rename-post`, for the post types supporting `title`.
-   `order-pages`, for the post types supporting `page-attributes`.
-   `export-pattern`, for patterns.
-   `restore`, `reset-post`, `delete-post`, `move-to-trash`, and `permanently-delete`, for every post type. Each one checks which posts it applies to.

The actions are registered in that order, which is the order they are shown in, for the current user: the actions depending on what the user can do are only registered for the users who can. The Gutenberg plugin copies the PHP files into its build, with its `gutenberg_` prefix.

## Prerequisites

The modules use the `wp.*` globals the `wp-editor` script loads, such as `wp.data` and `wp.components`, so they only run on pages that load the editor script. They are dynamic module dependencies of `wp-editor`, which adds them to the import map of every page loading it.

## Installation

Install the module:

```bash
npm install @wordpress/core-actions --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

The package provides the `@wordpress/core-actions/post_type_supports`, `@wordpress/core-actions/wp_block`, and `@wordpress/core-actions/wp_template_part` script modules. Their default export maps the id of each action to the properties of the DataViews action that PHP cannot serialize, which complete the action the `/wp/v2/entity-actions` route returns:

```js
const { default: actions } = await import(
	'@wordpress/core-actions/post_type_supports'
);
const renamePost = { ...actionFromTheServer, ...actions[ 'rename-post' ] };
```

A plugin replacing a core action registers its own definition with the script module of the core action, so the action keeps its JavaScript parts:

```php
add_action( 'wp_entity_actions_api_init', function () {
	wp_unregister_entity_actions( 'postType', 'page', array( 'move-to-trash' ) );
	wp_register_entity_actions(
		'acme',
		'postType',
		'page',
		array(
			array(
				'id'           => 'move-to-trash',
				'label'        => __( 'Move to the bin…', 'acme' ),
				'supportsBulk' => true,
			),
		),
		'@wordpress/core-actions/post_type_supports'
	);
} );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
