# Scripts

The editor provides several vendor and internal scripts to plugin developers. Script names, handles, and descriptions are documented in the table below.

## WP Scripts

The editor includes a number of packages to enable various pieces of functionality. Plugin developers can utilize them to create blocks, editor plugins, or generic plugins.

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [Blob](/packages/blob/src/README.md) | wp-blob | Blob utilities |
| [Block Library](/packages/block-library/src/README.md) | wp-block-library | Block library for the editor |
| [Blocks](/packages/blocks/src/README.md) | wp-blocks | Block creations |
| [Block Serialization Default Parser](/packages/block-serialization-default-parser/src/README.md) | wp-block-serialization-default-parser | Default block serialization parser implementations for WordPress documents |
| [Block Serialization Spec Parser](/packages/block-serialization-spec-parser/src/README.md) | wp-block-serialization-spec-parser | Grammar file (grammar.pegjs) for WordPress posts |
| [Components](/packages/components/src/README.md) | wp-components | Generic components to be used for creating common UI elements |
| [Compose](/packages/compose/src/README.md) | wp-compose | Collection of handy Higher Order Components (HOCs)  |
| [Core Data](/packages/core-data/src/README.md) | wp-core-data | Simplify access to and manipulation of core WordPress entities |
| [Data](/packages/data/src/README.md) | wp-data | Data module serves as a hub to manage application state for both plugins and WordPress itself |
| [Date](/packages/date/src/README.md) | wp-date | Date module for WordPress |
| [Deprecated](/packages/deprecated/src/README.md) | wp-deprecated | Utility to log a message to notify developers about a deprecated feature |
| [Dom](/packages/dom/src/README.md) | wp-dom | DOM utilities module for WordPress |
| [Dom Ready](/packages/dom-ready/src/README.md) | wp-dom-ready | Execute callback after the DOM is loaded |
| [Editor](/packages/editor/src/README.md) | wp-editor | Building blocks for WordPress editors |
| [Edit Post](/packages/edit-post/src/README.md) | wp-edit-post | Edit Post Module for WordPress |
| [Element](/packages/element/src/README.md) | wp-element |Element is, quite simply, an abstraction layer atop [React](https://reactjs.org/src/README.md) |
| [Escape Html](/packages/escape-html/src/README.md) | wp-escape-html | Escape HTML utils |
| [Hooks](/packages/hooks/src/README.md) | wp-hooks | A lightweight and efficient EventManager for JavaScript |
| [Html Entities](/packages/html-entities/src/README.md) | wp-html-entities | HTML entity utilities for WordPress |
| [I18N](/packages/i18n/src/README.md) | wp-i18n | Internationalization utilities for client-side localization |
| [Is Shallow Equal](/packages/is-shallow-equal/src/README.md) | wp-is-shallow-equal | A function for performing a shallow comparison between two objects or arrays |
| [Keycodes](/packages/keycodes/src/README.md) | wp-keycodes | Keycodes utilities for WordPress, used to check the key pressed in events like `onKeyDown` |
| [List Reusable Bocks](/packages/list-reusable-blocks/src/README.md) | wp-list-reusable-blocks | Package used to add import/export links to the listing page of the reusable blocks |
| [NUX](/packages/nux/src/README.md) | wp-nux | Components, and wp.data methods useful for onboarding a new user to the WordPress admin interface |
| [Plugins](/packages/plugins/src/README.md) | wp-plugins | Plugins module for WordPress |
| [Redux Routine](/packages/redux-routine/src/README.md) | wp-redux-routine | Redux middleware for generator coroutines |
| [Rich Text](/packages/rich-text/src/README.md) | wp-rich-text | Helper functions to convert HTML or a DOM tree into a rich text value and back |
| [Shortcode](/packages/shortcode/src/README.md) | wp-shortcode | Shortcode module for WordPress |
| [Token List](/packages/token-list/src/README.md) | wp-token-list | Constructable, plain JavaScript [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList) implementation, supporting non-browser runtimes |
| [URL](/packages/url/src/README.md) | wp-url | A collection of utilities to manipulate URLs |
| [Viewport](/packages/viewport/src/README.md) | wp-viewport | Module for responding to changes in the browser viewport size |
| [Wordcount](/packages/wordcount/src/README.md) | wp-wordcount | WordPress word count utility |

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
It is recommened to use the main `wp-polyfill` script handle which takes care of loading all the below mentioned polyfills.

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [Babel Polyfill](https://babeljs.io/docs/en/babel-polyfill) | wp-polyfill | Emulate a full ES2015+ environment. Main script to load all the below mentioned additional polyfills |
| [Fetch Polyfill](https://www.npmjs.com/package/whatwg-fetch) | wp-polyfill-fetch | Polyfill that implements a subset of the standard Fetch specification |
| [Promise Polyfill](https://www.npmjs.com/package/promise-polyfill) | wp-polyfill-promise| Lightweight ES6 Promise polyfill for the browser and node |
| [Formdata Polyfill](https://www.npmjs.com/package/formdata-polyfill) | wp-polyfill-formdata| Polyfill conditionally replaces the native implementation |
| [Node Contains Polyfill](https://polyfill.io) | wp-polyfill-node-contains |Polyfill for Node.contains |
| [Element Closest Polyfill](https://www.npmjs.com/package/element-closest) | wp-polyfill-element-closest| Return the closest element matching a selector up the DOM tree |
