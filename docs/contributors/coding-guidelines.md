# Coding Guidelines

This living document serves to prescribe coding guidelines specific to the Gutenberg editor project. Base coding guidelines follow the [WordPress Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/). The following sections outline additional patterns and conventions used in the Gutenberg project.

## CSS

### Naming

To avoid class name collisions, class names **must** adhere to the following guidelines, which are loosely inspired by the [BEM (Block, Element, Modifier) methodology](https://en.bem.info/methodology/):

All class names assigned to an element must be prefixed with the name of the package, followed by the name of the directory in which the component resides. Any descendent of the component's root element must append a dash-delimited descriptor, separated from the base by two consecutive underscores `__`.

Components may be assigned with class names that indicate states (for example, an "active" tab or an "opened" panel). These modifiers should be applied as a separate class name, prefixed as an adjective expression by `is-` (`is-active` or `is-opened`). In rare cases, you may encounter variations of the modifier prefix, usually to improve readability (`has-warning`). Because a modifier class name is not contextualized to a specific component, it should always be written in stylesheets as accompanying the component being modified (`.components-panel.is-opened`).

A component's class name should **never** be used outside its own folder (with rare exceptions such as [`_z-index.scss`](https://github.com/WordPress/gutenberg/blob/master/assets/stylesheets/_z-index.scss)). If, in your own components, you seek to inherit styles of another component, you should render an instance of that other component. At worst, you should duplicate the styles within your own component's stylesheet. This is intended to improve maintainability by treating individual components as the isolated abstract interface.

**Example:**

Consider the following component residing at `packages/components/src/notice/index.js`:

```jsx
export default function Notice( { children, onRemove } ) {
	return (
		<div className="components-notice">
			<div className="components-notice__content">
				{ children }
			</div>
			<IconButton
				className="components-notice__dismiss"
				icon="no"
				label={ __( 'Dismiss this notice' ) }
				onClick={ onRemove }
			/>
		</div>
	);
}
```

This component is defined within the `components` package, and is contained within the `notice` directory. Thus, its root element is assigned the class name `components-notice`.

Its descendent elements inherit this base class name, appending descriptors `content` and `dismiss` separated by `__`.

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
import moment from 'moment';
```

#### WordPress Dependencies

To encourage reusability between features, our JavaScript is split into domain-specific modules which [`export`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/export) one or more functions or objects. In the Gutenberg project, we've distinguished these modules under top-level directories. Each module serve an independent purpose, and often code is shared between them. For example, in order to localize its text, editor code will need to include functions from the `i18n` module.

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

### Experimental APIs

Exposed APIs that are still being tested, discussed and are subject to change should be prefixed with `__experimental`, until they are finalized. This is meant to discourage developers from relying on the API, because it might be removed or changed in the (near) future.

Example:

```js
export { __experimentalDoAction } from './api';
```

If an API must be exposed but is clearly not intended to be supported into the future, you may also use `__unstable` as a prefix to differentiate it from an experimental API. Unstable APIs should serve an immediate and temporary purpose. They should _never_ be used by plugin developers as they can be removed at any point without notice, and thus should be omitted from public-facing documentation. The inline code documentation should clearly caution their use.

```js
export { __unstableDoAction } from './api';
```

### Objects

When possible, use [shorthand notation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Object_initializer#New_notations_in_ECMAScript_2015) when defining object property values:

```js
const a = 10;

// Bad:
const object = {
	a: a,
	performAction: function() {
		// ...
	},
};

// Good:
const object = {
	a,
	performAction() {
		// ...
	},
};
```

### Strings

String literals should be declared with single-quotes *unless* the string itself contains a single-quote that would need to be escaped–in that case: use a double-quote. If the string contains a single-quote *and* a double-quote, you can use ES6 template strings to avoid escaping the quotes.

**Note:** The single-quote character (`'`) should never be used in place of an apostrophe (`’`) for words like `it’s` or `haven’t` in user-facing strings. For test code it's still encouraged to use a real apostrophe.

In general, avoid backslash-escaping quotes:

```js
// Bad:
const name = "Matt";
// Good:
const name = 'Matt';

// Bad:
const pet = 'Matt\'s dog';
// Also bad (not using an apostrophe):
const pet = "Matt's dog";
// Good:
const pet = 'Matt’s dog';
// Also good:
const oddString = "She said 'This is odd.'";
```

You should use ES6 Template Strings over string concatenation whenever possible:

```js
const name = 'Stacey';

// Bad:
alert( 'My name is ' + name + '.' );
// Good:
alert( `My name is ${ name }.` );
```

## PHP

We use
[`phpcs` (PHP\_CodeSniffer)](https://github.com/squizlabs/PHP_CodeSniffer) with the [WordPress Coding Standards ruleset](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards) to run a lot of automated checks against all PHP code in this project.  This ensures that we are consistent with WordPress PHP coding standards.

The easiest way to use PHPCS is [local environment](https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md#local-environment). Once that's installed, you can check your PHP by running `npm run lint-php`.

If you prefer to install PHPCS locally, you should use `composer`. [Install `composer`](https://getcomposer.org/download/) on your computer, then run `composer install`.  This will install `phpcs` and `WordPress-Coding-Standards` which you can the run via `vendor/bin/phpcs`.
