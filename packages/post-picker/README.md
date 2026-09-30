# Post Picker

A modal for searching and selecting posts, pages, and other post types.

The picker is opened through a data store action and returns the selection as a promise. It renders itself into the page the first time it is opened, so callers don't need to render a component or provider.

## Installation

Install the module

```bash
npm install @wordpress/post-picker --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

In WordPress, add `wp-post-picker` as a dependency of your script, and enqueue the `wp-post-picker` style.

## Prerequisites

The picker reads posts through the REST API using `@wordpress/core-data`, so the current user needs to be able to list the requested post types in the `edit` context.

The modal is built with `DataViewsPicker` from `@wordpress/dataviews`. The page needs to load the DataViews styles, which are included in the editor's styles.

## Usage

```js
import { dispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { store as postPickerStore } from '@wordpress/post-picker';

const posts = await dispatch( postPickerStore ).pickPosts( {
	postType: 'page',
	title: __( 'Choose parent page' ),
	selectLabel: __( 'Set parent' ),
	query: { exclude: [ currentPageId ] },
} );

if ( posts ) {
	// `posts` is an array of post records from the REST API.
}
```

`pickPosts` resolves with an array of the selected post records, or with `null` if the picker is dismissed. Opening the picker while it is already open resolves the earlier request with `null`.

### Options

-   `postType` (`string | string[]`): The post type to pick from. With more than one post type, the modal shows a control for switching between them.
-   `multiple` (`boolean`): Whether more than one post can be selected. Defaults to `false`.
-   `value` (`number[]`): IDs of posts to show as selected when the modal opens.
-   `query` (`Object`): Extra REST query arguments, such as `exclude`, `parent_exclude` or `status`.
-   `title` (`string`): The modal title.
-   `selectLabel` (`string`): The label of the button that confirms the selection.

### Store

The store is registered as `core/post-picker`.

Actions:

-   `pickPosts( options )`: Opens the picker. Returns a promise, as described above.
-   `closePostPicker()`: Closes the picker. The open request resolves with `null`.

Selectors:

-   `isPostPickerOpen()`: Whether the picker is open.
-   `getPostPickerRequest()`: The options of the open request, and its ID.

### `PostPickerModal`

The modal component used by `pickPosts`. It can be rendered directly when a caller needs to control where the modal is rendered. It takes the same options as `pickPosts`, plus `onSelect( posts )` and `onClose()` callbacks.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
