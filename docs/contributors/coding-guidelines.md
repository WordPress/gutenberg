# Coding Guidelines

This living document serves to prescribe coding guidelines specific to the Gutenberg project. Base coding guidelines follow the [WordPress Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/). The following sections outline additional patterns and conventions used in the Gutenberg project.

## CSS

### Naming

To avoid class name collisions, class names **must** adhere to the following guidelines, which are loosely inspired by the [BEM (Block, Element, Modifier) methodology](https://en.bem.info/methodology/).

All class names assigned to an element must be prefixed with the name of the package, followed by a dash and the name of the directory in which the component resides. Any descendent of the component's root element must append a dash-delimited descriptor, separated from the base by two consecutive underscores `__`.

* Root element: `package-directory`
* Child elements: `package-directory__descriptor-foo-bar`

The root element is considered to be the highest ancestor element returned by the default export in the `index.js`. Notably, if your folder contains multiple files, each with their own default exported component, only the element rendered by that of `index.js` can be considered the root. All others should be treated as descendents.

**Example:**

Consider the following component located at `packages/components/src/notice/index.js`:

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

Components may be assigned with class names that indicate states (for example, an "active" tab or an "opened" panel). These modifiers should be applied as a separate class name, prefixed as an adjective expression by `is-` (`is-active` or `is-opened`). In rare cases, you may encounter variations of the modifier prefix, usually to improve readability (`has-warning`). Because a modifier class name is not contextualized to a specific component, it should always be written in stylesheets as accompanying the component being modified (`.components-panel.is-opened`).

**Example:**

Consider again the Notices example. We may want to apply specific styling for dismissible notices. The [`classnames` package](https://www.npmjs.com/package/classnames) can be a helpful utility for conditionally applying modifier class names.

```jsx
import classnames from 'classnames';

export default function Notice( { children, onRemove, isDismissible } ) {
	const classes = classnames( 'components-notice', {
		'is-dismissible': isDismissible,
	} );

	return (
		<div className={ classes }>
			{ /* ... */ }
		</div>
	);
}
```

A component's class name should **never** be used outside its own folder (with rare exceptions such as [`_z-index.scss`](https://github.com/WordPress/gutenberg/blob/master/assets/stylesheets/_z-index.scss)). If you need to inherit styles of another component in your own components, you should render an instance of that other component. At worst, you should duplicate the styles within your own component's stylesheet. This is intended to improve maintainability by treating individual components as the isolated abstract interface.

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

### Experimental and Unstable APIs

Experimental and unstable APIs are temporary values exported from a module whose existence is either pending future revision or provides an immediate means to an end.

_To External Consumers:_

**There is no support commitment for experimental and unstable APIs.** They can and will be removed or changed without advance warning, including as part of a minor or patch release. As an external consumer, you should avoid these APIs.

_To Project Contributors:_

An experimental or unstable API is named as such to communicate instability of a function whose interface is not yet finalized. Aside from references within the code, these APIs should neither be documented nor mentioned in any CHANGELOG. They should effectively be considered to not exist from an external perspective. In most cases, they should only be exposed to satisfy requirements between packages maintained in this repository.

An experimental or unstable function or object should be prefixed respectively using `__experimental` or `__unstable`.

```js
export { __experimentalDoExcitingExperimentalAction } from './api';
export { __unstableDoTerribleAwfulAction } from './api';
```

- An **experimental API** is one which is planned for eventual public availability, but is subject to further experimentation, testing, and discussion.
- An **unstable API** is one which serves as a means to an end. It is not desired to ever be converted into a public API.

In both cases, the API should be made stable or removed at the earliest opportunity.

While an experimental API may often stabilize into a publicly-available API, there is no guarantee that it will. The conversion to a stable API will inherently be considered a breaking change by the mere fact that the function name must be changed to remove the `__experimental` prefix.

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

The easiest way to use PHPCS is [local environment](/docs/contributors/getting-started.md#local-environment). Once that's installed, you can check your PHP by running `npm run lint-php`.

If you prefer to install PHPCS locally, you should use `composer`. [Install `composer`](https://getcomposer.org/download/) on your computer, then run `composer install`.  This will install `phpcs` and `WordPress-Coding-Standards` which you can the run via `vendor/bin/phpcs`.
