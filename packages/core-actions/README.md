# Core Actions

The actions WordPress core registers for its entities, such as "Rename", "Duplicate" or "Move to trash". They are shown in the DataViews lists of the site editor and in the inspector of the editor.

WordPress core registers these actions on the server, through the Entity actions API, like a plugin registers its own: see `wp_register_core_actions()` in `src/index.php`. The client reads them from the `wp/v2/entity-actions` route, imports the script modules registered along with them, and merges their JavaScript parts in, see the `getEntityActions` resolver of `@wordpress/editor`. The actions moved here from `@wordpress/fields`.

## Script modules

The JavaScript parts of the actions live in folders of `src`, one script module per folder:

-   `post_type_supports`: the default actions of every post type (`delete-post`, `duplicate-post`, `move-to-trash`, `order-pages`, `permanently-delete`, `rename-post`, `reset-post`, `restore`, `view-post`, and `view-post-revisions`).
-   `wp_block`: the actions patterns have on top of the defaults (`duplicate-pattern` and `export-pattern`).
-   `wp_template_part`: the actions template parts have on top of the defaults (`duplicate-template-part`).

Each action has a folder named after its id, with its JavaScript parts in `action.tsx`: what PHP cannot serialize, such as `callback`, `RenderModal`, `isEligible`, `icon`, or a `label` that depends on the items. Its data (`label`, `isPrimary`, `supportsBulk`, `modalHeader`, …) is declared in `src/index.php`. The `index.ts` of each folder is its script module, whose default export maps the id of each action to its JavaScript parts.

`wp_register_core_actions()` decides which post type gets which action, in this order:

-   `view-post`, for the viewable post types.
-   `view-post-revisions`, for the post types supporting `revisions`.
-   `duplicate-post`, for the post types the user can create, except templates, template parts, and patterns. Only in the Gutenberg plugin: elsewhere, it applies to no post.
-   `duplicate-template-part`, for template parts, when the user can create them and the theme is a block theme.
-   `duplicate-pattern`, for patterns, when the user can create them.
-   `rename-post`, for the post types supporting `title`.
-   `order-pages`, for the post types supporting `page-attributes`.
-   `export-pattern`, for patterns.
-   `restore`, `reset-post`, `delete-post`, `move-to-trash`, and `permanently-delete`, for every post type. Each one checks which posts it applies to.

A plugin hooking `wp_entity_actions_api_init` at the default priority sees the core actions registered, and can unregister them with `wp_unregister_entity_actions()`.

## Prerequisites

The modules use the `wp.*` globals the `wp-editor` script loads, such as `wp.data` and `wp.components`, so they only run on pages that load the editor script. They are dynamic module dependencies of `wp-editor`, which adds them to the import map of every page loading it.

## Installation

Install the module:

```bash
npm install @wordpress/core-actions --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

The package provides the `@wordpress/core-actions/post_type_supports`, `@wordpress/core-actions/wp_block`, and `@wordpress/core-actions/wp_template_part` script modules. Their default export maps the id of each action to its JavaScript parts, which complete the action the `wp/v2/entity-actions` route returns:

```js
const { default: parts } = await import(
	'@wordpress/core-actions/post_type_supports'
);
const renamePost = { ...serverAction, ...parts[ 'rename-post' ] };
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
