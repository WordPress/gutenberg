# Scripts

The editor provides several vendor and internal scripts to plugin developers. Script names, handles, and descriptions are documented in the table below.

## WP Scripts

The editor includes a number of packages to enable various pieces of functionality. Plugin developers can utilize them to create blocks, editor plugins, or generic plugins.

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [Blob](/packages/blob/README.md) | wp-blob | Blob utilities |
| [Block Library](/packages/block-library/README.md) | wp-block-library | Block library for the editor |
| [Blocks](/packages/blocks/README.md) | wp-blocks | Block creations |
| [Block Serialization Default Parser](/packages/block-serialization-default-parser/README.md) | wp-block-serialization-default-parser | Default block serialization parser implementations for WordPress documents |
| [Block Serialization Spec Parser](/packages/block-serialization-spec-parser/README.md) | wp-block-serialization-spec-parser | Grammar file (grammar.pegjs) for WordPress posts |
| [Components](/packages/components/README.md) | wp-components | Generic components to be used for creating common UI elements |
| [Compose](/packages/compose/README.md) | wp-compose | Collection of handy Higher Order Components (HOCs)  |
| [Core Data](/packages/core-data/README.md) | wp-core-data | Simplify access to and manipulation of core WordPress entities |
| [Data](/packages/data/README.md) | wp-data | Data module serves as a hub to manage application state for both plugins and WordPress itself |
| [Date](/packages/date/README.md) | wp-date | Date module for WordPress |
| [Deprecated](/packages/deprecated/README.md) | wp-deprecated | Utility to log a message to notify developers about a deprecated feature |
| [Dom](/packages/dom/README.md) | wp-dom | DOM utilities module for WordPress |
| [Dom Ready](/packages/dom-ready/README.md) | wp-dom-ready | Execute callback after the DOM is loaded |
| [Editor](/packages/editor/README.md) | wp-editor | Building blocks for WordPress editors |
| [Edit Post](/packages/edit-post/README.md) | wp-edit-post | Edit Post Module for WordPress |
| [Element](/packages/element/README.md) | wp-element |Element is, quite simply, an abstraction layer atop [React](https://reactjs.org/) |
| [Escape Html](/packages/escape-html/README.md) | wp-escape-html | Escape HTML utils |
| [Hooks](/packages/hooks/README.md) | wp-hooks | A lightweight and efficient EventManager for JavaScript |
| [Html Entities](/packages/html-entities/README.md) | wp-html-entities | HTML entity utilities for WordPress |
| [I18N](/packages/i18n/README.md) | wp-i18n | Internationalization utilities for client-side localization |
| [Is Shallow Equal](/packages/is-shallow-equal/README.md) | wp-is-shallow-equal | A function for performing a shallow comparison between two objects or arrays |
| [Keycodes](/packages/keycodes/README.md) | wp-keycodes | Keycodes utilities for WordPress, used to check the key pressed in events like `onKeyDown` |
| [List Reusable blocks](/packages/list-reusable-blocks/README.md) | wp-list-reusable-blocks | Package used to add import/export links to the listing page of the reusable blocks |
| [NUX](/packages/nux/README.md) | wp-nux | Components, and wp.data methods useful for onboarding a new user to the WordPress admin interface |
| [Plugins](/packages/plugins/README.md) | wp-plugins | Plugins module for WordPress |
| [Redux Routine](/packages/redux-routine/README.md) | wp-redux-routine | Redux middleware for generator coroutines |
| [Rich Text](/packages/rich-text/README.md) | wp-rich-text | Helper functions to convert HTML or a DOM tree into a rich text value and back |
| [Shortcode](/packages/shortcode/README.md) | wp-shortcode | Shortcode module for WordPress |
| [Token List](/packages/token-list/README.md) | wp-token-list | Constructable, plain JavaScript [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList) implementation, supporting non-browser runtimes |
| [URL](/packages/url/README.md) | wp-url | A collection of utilities to manipulate URLs |
| [Viewport](/packages/viewport/README.md) | wp-viewport | Module for responding to changes in the browser viewport size |
| [Wordcount](/packages/wordcount/README.md) | wp-wordcount | WordPress word count utility |

## Vendor Scripts

The editor also uses some popular third-party packages and scripts. Plugin developers can use these scripts as well without bundling them in their code (and increasing file sizes).

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [React](https://reactjs.org) | react  | React is a JavaScript library for building user interfaces |
| [React Dom](https://reactjs.org/docs/react-dom.html) | react-dom | Serves as the entry point to the DOM and server renderers for React, intended to be paired with React |
| [Moment](https://momentjs.com/) | moment| Parse, validate, manipulate, and display dates and times in JavaScript |
| [Lodash](https://lodash.com) | lodash| Lodash is a JavaScript library which provides utility functions for common programming tasks |

## Polyfill Scripts

The editor also provides polyfills for certain features that may not be available in all modern browsers.
It is recommended to use the main `wp-polyfill` script handle which takes care of loading all the below mentioned polyfills.

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [Babel Polyfill](https://babeljs.io/docs/en/babel-polyfill) | wp-polyfill | Emulate a full ES2015+ environment. Main script to load all the below mentioned additional polyfills |
| [Fetch Polyfill](https://www.npmjs.com/package/whatwg-fetch) | wp-polyfill-fetch | Polyfill that implements a subset of the standard Fetch specification |
| [Promise Polyfill](https://www.npmjs.com/package/promise-polyfill) | wp-polyfill-promise| Lightweight ES6 Promise polyfill for the browser and node |
| [Formdata Polyfill](https://www.npmjs.com/package/formdata-polyfill) | wp-polyfill-formdata| Polyfill conditionally replaces the native implementation |
| [Node Contains Polyfill](https://polyfill.io) | wp-polyfill-node-contains |Polyfill for Node.contains |
| [Element Closest Polyfill](https://www.npmjs.com/package/element-closest) | wp-polyfill-element-closest| Return the closest element matching a selector up the DOM tree |

## Bundling and code sharing

When using a JavaScript bundler like [webpack](https://webpack.js.org/), the scripts mentioned here
can be excluded from the bundle and provided by WordPress in the form of script dependencies [(see
`wp_enqueue_script`)][https://developer.wordpress.org/reference/functions/wp_enqueue_script/#default-scripts-included-and-registered-by-wordpress].

The
[`@wordpress/dependency-extraction-webpack-plugin`](https://github.com/WordPress/gutenberg/tree/master/packages/dependency-extraction-webpack-plugin)
provides a webpack plugin to help extract WordPress dependencies from bundles. `@wordpress/scripts`
[`build`](https://github.com/WordPress/gutenberg/tree/master/packages/scripts#build) script includes
the plugin by default.
