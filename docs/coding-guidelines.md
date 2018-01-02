# Coding Guidelines

This living document serves to prescribe coding guidelines specific to the Gutenberg editor project. Base coding guidelines follow the [WordPress Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/). The following sections outline additional patterns and conventions used in the Gutenberg project.

## CSS

### Naming

To avoid class name collisions between elements of the editor and to the enclosing WordPress dashboard, class names **must** adhere to the following guidelines:

Any default export of a folder's `index.js` **must** be prefixed with `editor-` followed by the directory name in which it resides:

>.editor-_[ directory name ]_

(Example: `.editor-inserter` from `inserter/index.js`)

For any descendant of the top-level (`index.js`) element, prefix using the top-level element's class name separated by two underscores:

>.editor-_[ directory name ]_\_\__[ descendant description ]_

(Example: `.editor-inserter__button-toggle` from `inserter/button.js`)

For optional variations of an element or its descendants, you may use a modifier class, but you **must not** apply styles to the modifier class directly; only as an additional selector to the element to which the modifier applies:

>.editor-_[ directory name ]_.is-_[ modifier description ]_
>.editor-_[ directory name ]_\_\__[ descendant description ]_.is-_[ modifier description ]_

(Example: `.editor-inserter__button-toggle.is-active` )

In all of the above cases, except in separating the top-level element from its descendants, you **must** use dash delimiters when expressing multiple terms of a name.

You may observe that these conventions adhere closely to the [BEM (Blocks, Elements, Modifiers)](http://getbem.com/introduction/) CSS methodology, with minor adjustments to the application of modifiers.

#### SCSS File Naming Conventions for Blocks

The build process will split SCSS from within the blocks library directory into two separate CSS files when Webpack runs.

Styles placed in a `style.scss` file will be built into `blocks/build/style.css`, to load on the front end theme as well as in the editor. If you need additional styles specific to the block's display in the editor, add them to an `editor.scss`.

Examples of styles that appear in both the theme and the editor include gallery columns and drop caps.

## JavaScript

### Imports

In the Gutenberg project, we use [the ES2015 import syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) to enable us to create modular code with clear separations between code of a specific feature, code shared across distinct WordPress features, and third-party dependencies.

These separations are identified by multi-line comments at the top of a file which imports code from another file or source.

#### External Dependencies

An external dependency is third-party code that is not maintained by WordPress contributors, but instead [included in WordPress as a default script](https://developer.wordpress.org/reference/functions/wp_enqueue_script/#default-scripts-included-and-registered-by-wordpress) or referenced from an outside package manager like [npm](https://www.npmjs.com/).

Example:

```js
/**
 * External dependencies
 */
import TinyMCE from 'tinymce';
```

#### WordPress Dependencies

To encourage reusability between features, our JavaScript is split into domain-specific modules which [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) one or more functions or objects. In the Gutenberg project, we've distinguished these modules under top-level directories `blocks`, `components`, `editor`, `element`, `data` and `i18n`. These each serve an independent purpose, and often code is shared between them. For example, in order to localize its text, editor code will need to include functions from the `i18n` module.

Example:

```js
/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
```

#### Internal Dependencies

Within a specific feature, code is organized into separate files and folders. As is the case with external and WordPress dependencies, you can bring this code into scope by using the `import` keyword. The main distinction here is that when importing internal files, you should use relative paths specific to top-level directory you're working in.

Example:

```js
/**
 * Internal dependencies
 */
import VisualEditor from '../visual-editor';
```

## PHP

We use
[`phpcs` (PHP\_CodeSniffer)](https://github.com/squizlabs/PHP_CodeSniffer) with the [WordPress Coding Standards ruleset](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards) to run a lot of automated checks against all PHP code in this project.  This ensures that we are consistent with WordPress PHP coding standards.

When making any changes to the PHP code in this project, it's recommended to install and run `phpcs` on your computer.  This is a step in our Travis CI build as well, but it is better to catch errors locally.

The easiest way to do this is using `composer`. [Install `composer`](https://getcomposer.org/download/) on your computer, then run `composer install`.  This will install `phpcs` and `WordPress-Coding-Standards` which you can the run via `vendor/bin/phpcs`.
