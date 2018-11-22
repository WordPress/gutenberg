# Scripts

The editor provides several vendor and internal scripts to plugin developers. Script names, handles, and descriptions are documented in the table below.

## WP Scripts

The editor includes a number of packages to enable various pieces of functionality. Plugin developers can utilize them to create blocks, editor plugins, or generic plugins.

| Script Name | Handle | Description |
|-------------|--------|-------------|
| [Blob](https://wordpress.org/gutenberg/handbook/packages/packages-blob/) | wp-blob | Blob utilities |
| [Block Library](https://wordpress.org/gutenberg/handbook/packages/packages-block-library/) | wp-block-library | Block library for the editor |
| [Blocks](https://wordpress.org/gutenberg/handbook/packages/packages-blocks/) | wp-blocks | Block creations |
| [Block Serialization Default Parser](https://wordpress.org/gutenberg/handbook/packages/packages-block-serialization-default-parser/) | wp-block-serialization-default-parser | Default block serialization parser implementations for WordPress documents |
| [Block Serialization Spec Parser](https://wordpress.org/gutenberg/handbook/packages/packages-block-serialization-spec-parser/) | wp-block-serialization-spec-parser | Grammar file (grammar.pegjs) for WordPress posts |
| [Components](https://wordpress.org/gutenberg/handbook/packages/packages-components/) | wp-components | Generic components to be used for creating common UI elements |
| [Compose](https://wordpress.org/gutenberg/handbook/packages/packages-compose/) | wp-compose | Collection of handy Higher Order Components (HOCs)  |
| [Core Data](https://wordpress.org/gutenberg/handbook/packages/packages-core-data/) | wp-core-data | Simplify access to and manipulation of core WordPress entities |
| [Data](https://wordpress.org/gutenberg/handbook/packages/packages-data/) | wp-data | Data module serves as a hub to manage application state for both plugins and WordPress itself |
| [Date](https://wordpress.org/gutenberg/handbook/packages/packages-date/) | wp-date | Date module for WordPress |
| [Deprecated](https://wordpress.org/gutenberg/handbook/packages/packages-deprecated/) | wp-deprecated | Utility to log a message to notify developers about a deprecated feature |
| [Dom](https://wordpress.org/gutenberg/handbook/packages/packages-dom/) | wp-dom | DOM utilities module for WordPress |
| [Dom Ready](https://wordpress.org/gutenberg/handbook/packages/packages-dom-ready/) | wp-dom-ready | Execute callback after the DOM is loaded |
| [Editor](https://wordpress.org/gutenberg/handbook/packages/packages-editor/) | wp-editor | Building blocks for WordPress editors |
| [Edit Post](https://wordpress.org/gutenberg/handbook/packages/packages-edit-post/) | wp-edit-post | Edit Post Module for WordPress |
| [Element](https://wordpress.org/gutenberg/handbook/packages/packages-element/) | wp-element |Element is, quite simply, an abstraction layer atop [React](https://reactjs.org/) |
| [Escape Html](https://wordpress.org/gutenberg/handbook/packages/packages-escape-html/) | wp-escape-html | Escape HTML utils |
| [Hooks](https://wordpress.org/gutenberg/handbook/packages/packages-hooks/) | wp-hooks | A lightweight and efficient EventManager for JavaScript |
| [Html Entities](https://wordpress.org/gutenberg/handbook/packages/packages-html-entities/) | wp-html-entities | HTML entity utilities for WordPress |
| [I18N](https://wordpress.org/gutenberg/handbook/packages/packages-i18n/) | wp-i18n | Internationalization utilities for client-side localization |
| [Is Shallow Equal](https://wordpress.org/gutenberg/handbook/packages/packages-is-shallow-equal/) | wp-is-shallow-equal | A function for performing a shallow comparison between two objects or arrays |
| [Keycodes](https://wordpress.org/gutenberg/handbook/packages/packages-keycodes/) | wp-keycodes | Keycodes utilities for WordPress, used to check the key pressed in events like `onKeyDown` |
| [List Reusable Bocks](https://wordpress.org/gutenberg/handbook/packages/packages-list-reusable-blocks/) | wp-list-reusable-blocks | Package used to add import/export links to the listing page of the reusable blocks |
| [NUX](https://wordpress.org/gutenberg/handbook/packages/packages-nux/) | wp-nux | Components, and wp.data methods useful for onboarding a new user to the WordPress admin interface |
| [Plugins](https://wordpress.org/gutenberg/handbook/packages/packages-plugins/) | wp-plugins | Plugins module for WordPress |
| [Redux Routine](https://wordpress.org/gutenberg/handbook/packages/packages-redux-routine/) | wp-redux-routine | Redux middleware for generator coroutines |
| [Rich Text](https://wordpress.org/gutenberg/handbook/packages/packages-rich-text/) | wp-rich-text | Helper functions to convert HTML or a DOM tree into a rich text value and back |
| [Shortcode](https://wordpress.org/gutenberg/handbook/packages/packages-shortcode/) | wp-shortcode | Shortcode module for WordPress |
| [Token List](https://wordpress.org/gutenberg/handbook/packages/packages-token-list/) | wp-token-list | Constructable, plain JavaScript [DOMTokenList](https://developer.mozilla.org/en-US/docs/Web/API/DOMTokenList) implementation, supporting non-browser runtimes |
| [URL](https://wordpress.org/gutenberg/handbook/packages/packages-url/) | wp-url | A collection of utilities to manipulate URLs |
| [Viewport](https://wordpress.org/gutenberg/handbook/packages/packages-viewport/) | wp-viewport | Module for responding to changes in the browser viewport size |
| [Wordcount](https://wordpress.org/gutenberg/handbook/packages/packages-wordcount/) | wp-wordcount | WordPress word count utility |

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
