# Core Actions

The actions WordPress core registers for its entities, such as "Rename", "Duplicate" or "Move to trash". They are shown in the DataViews lists of the site editor and in the inspector of the editor.

Each collection of actions is a script module, which `registerPostTypeSchema()` of `@wordpress/editor` imports on demand to register the actions of a post type. The actions are copies of the ones `@wordpress/fields` exports, which keeps exporting them until it is deprecated.

## Collections

The actions of this package live in folders of `src`, one per collection:

-   `post_type_supports`: the default actions of every post type (`delete-post`, `duplicate-post`, `move-to-trash`, `order-pages`, `permanently-delete`, `rename-post`, `reset-post`, `restore`, `view-post`, and `view-post-revisions`).
-   `wp_block`: the actions patterns have on top of the defaults (`duplicate-pattern` and `export-pattern`).
-   `wp_template_part`: the actions template parts have on top of the defaults (`duplicate-template-part`).

Each action has a folder named after its id, with the action in `action.tsx`. The `index.ts` of each collection is its script module, whose default export maps the id of each action to the action.

`registerPostTypeSchema()` decides which post type gets which action:

-   `view-post`, for the viewable post types.
-   `view-post-revisions`, for the post types supporting `revisions`.
-   `duplicate-post`, for the post types the user can create, except templates, template parts, and patterns. Only in the Gutenberg plugin.
-   `duplicate-template-part`, for template parts, when the user can create them and the theme is a block theme.
-   `duplicate-pattern`, for patterns, when the user can create them.
-   `rename-post`, for the post types supporting `title`.
-   `order-pages`, for the post types supporting `page-attributes`.
-   `export-pattern`, for patterns.
-   `restore`, `reset-post`, `delete-post`, `move-to-trash`, and `permanently-delete`, for every post type. Each one checks which posts it applies to.

## Prerequisites

The modules use the `wp.*` globals the `wp-editor` script loads, such as `wp.data` and `wp.components`, so they only run on pages that load the editor script. They are dynamic module dependencies of `wp-editor`, which adds them to the import map of every page loading it.

## Installation

Install the module:

```bash
npm install @wordpress/core-actions --save
```

_This package assumes that your code will run in an ES2015+ environment. If you're using an environment that has limited or no support for such language features and/or APIs, you should include the polyfill shipped in `@wordpress/babel-preset-default` in your code._

## Usage

The package provides the `@wordpress/core-actions/post_type_supports`, `@wordpress/core-actions/wp_block`, and `@wordpress/core-actions/wp_template_part` script modules. Their default export maps the id of each action to a DataViews action:

```js
const { default: actions } = await import(
	'@wordpress/core-actions/post_type_supports'
);
const renamePost = actions[ 'rename-post' ];
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
