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
			<Button
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

A component's class name should **never** be used outside its own folder (with rare exceptions such as [`_z-index.scss`](https://github.com/WordPress/gutenberg/blob/master/packages/base-styles/_z-index.scss)). If you need to inherit styles of another component in your own components, you should render an instance of that other component. At worst, you should duplicate the styles within your own component's stylesheet. This is intended to improve maintainability by isolating shared components as a reusable interface, reducing the surface area of similar UI elements by adapting a limited set of common components to support a varied set of use-cases.

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

## JavaScript Documentation using JSDoc

Gutenberg follows the [WordPress JavaScript Documentation Standards](https://make.wordpress.org/core/handbook/best-practices/inline-documentation-standards/javascript/), with additional guidelines relevant for its distinct use of [import semantics](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/coding-guidelines.md#imports) in organizing files, the [use of TypeScript tooling](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/testing-overview.md#javascript-testing) for types validation, and automated documentation generation using [`@wordpress/docgen`](https://github.com/WordPress/gutenberg/tree/master/packages/docgen).

For additional guidance, consult the following resources:

- [JSDoc Official Documentation](https://jsdoc.app/index.html)
- [TypeScript Supported JSDoc](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html#supported-jsdoc)

### Custom Types

Define custom types using the [JSDoc `@typedef` tag](https://jsdoc.app/tags-typedef.html).

A custom type should include a description, and should always include its base type.

Custom types should be named as succinctly as possible, while still retaining clarity of meaning and avoiding conflict with other global or scoped types. A `WP` prefix should be applied to all custom types. Avoid superfluous or redundant prefixes and suffixes (for example, a `Type` suffix, or `Custom` prefix). Custom types are not global by default, so a custom type does not need to be excessively specific to a particular package. However, they should be named with enough specificity to avoid ambiguity or name collisions when brought into the same scope as another type.

```js
/**
 * A block selection object.
 *
 * @typedef {Object} WPBlockSelection
 *
 * @property {string} clientId     A block client ID.
 * @property {string} attributeKey A block attribute key.
 * @property {number} offset       An attribute value offset, based on the rich
 *                                 text value.
 */
```

Custom types can also be used to describe a set of predefined options. While the [type union](https://jsdoc.app/tags-type.html) can be used with literal values as an inline type, it can be difficult to align tags while still respecting a maximum line length of 80 characters. Using a custom type to define a union type can afford the opportunity to describe the purpose of these options, and helps to avoid these line length issues.

```js
/**
 * Named breakpoint sizes.
 * 
 * @typedef {'huge'|'wide'|'large'|'medium'|'small'|'mobile'} WPBreakpoint
 */
```

Note the use of quotes when defining a set of string literals. As in the [JavaScript Coding Standards](https://make.wordpress.org/core/handbook/best-practices/coding-standards/javascript/), single quotes should be used when assigning a string literal either as the type or as a [default function parameter](#nullable-undefined-and-void-types), or when [specifying the path](#importing-and-exporting-types) of an imported type.

### Importing and Exporting Types

Use the [TypeScript `import` function](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html#import-types) to import type declarations from other files or third-party dependencies.

Since an imported type declaration can occupy an excess of the available line length and become verbose when referenced multiple times, you are encouraged to create an alias of the external type using a `@typedef` declaration at the top of the file, immediately following [the `import` groupings](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/coding-guidelines.md#imports).

```js
/** @typedef {import('@wordpress/data').WPDataRegistry} WPDataRegistry */
```

Note that all custom types defined in another file can be imported.

When considering which types should be made available from a WordPress package, the `@typedef` statements in the package's entry point script should be treated as effectively the same as its public API. It is important to be aware of this, both to avoid unintentionally exposing internal types on the public interface, and as a way to expose the public types of a project.

```js
// packages/data/src/index.js

/** @typedef {import('./registry').WPDataRegistry} WPDataRegistry */
```

In this snippet, the `@typedef` will support the usage of the previous example's `import('@wordpress/data')`.

#### External Dependencies

Many third-party dependencies will distribute their own TypeScript typings. For these, the `import` semantics should "just work".

![Working Example: `import` type](https://user-images.githubusercontent.com/1779930/70167742-62198800-1695-11ea-9c21-82a91d4a60e2.png)

If you use a [TypeScript integration](https://github.com/Microsoft/TypeScript/wiki/TypeScript-Editor-Support) for your editor, you can typically see that this works if the type resolves to anything other than the fallback `any` type.

For packages which do not distribute their own TypeScript types, you are welcomed to install and use the [DefinitelyTyped](http://definitelytyped.org/) community-maintained types definitions, if one exists.

### Record Types

When documenting a generic type such as `Object`, `Function`, `Promise`, etc., always include details about the expected record types.

```js
// Incorrect:

/** @type {Object} */
/** @type {Function} */
/** @type {Promise} */

// Correct:

/** @type {Object<string,number>} */
/** @type {(key:string)=>boolean} */
/** @type {Promise<string>} */
```

The function expression here uses TypeScript's syntax for function types, which can be useful in providing more detailed information about the names and types of the expected parameters. For more information, consult the [TypeScript `@type` tag function recommendations](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html#type).

In more advanced cases, you may define your own custom types as a generic type using the [TypeScript `@template` tag](https://www.typescriptlang.org/docs/handbook/type-checking-javascript-files.html#template).

Similar to the "Custom Types" advice concerning type unions and with literal values, you can consider to create a custom type `@typedef` to better describe expected key values for object records, or to extract a complex function signature.

```js
/**
 * An apiFetch middleware handler. Passed the fetch options, the middleware is
 * expected to call the `next` middleware once it has completed its handling.
 *
 * @typedef {(options:WPAPIFetchOptions,next:WPAPIFetchMiddleware)=>void} WPAPIFetchMiddleware
 */
```

```js
/**
 * Named breakpoint sizes.
 * 
 * @typedef {"huge"|"wide"|"large"|"medium"|"small"|"mobile"} WPBreakpoint
 */

/**
 * Hash of breakpoint names with pixel width at which it becomes effective.
 * 
 * @type {Object<WPBreakpoint,number>}
 */
const BREAKPOINTS = { huge: 1440 /* , ... */ };
```

### Nullable, Undefined, and Void Types

You can express a nullable type using a leading `?`. Use the nullable form of a type only if you're describing either the type or an explicit `null` value. Do not use the nullable form as an indicator of an optional parameter.

```js
/**
 * Returns a configuration value for a given key, if exists. Returns null if
 * there is no configured value.
 * 
 * @param {string} key Configuration key to retrieve.
 * 
 * @return {?*} Configuration value, if exists.
 */
function getConfigurationValue( key ) {
	return config.hasOwnProperty( key ) ? config[ key ] : null;
}
```

Similarly, use the `undefined` type only if you're expecting an explicit value of `undefined`.

```js
/**
 * Returns true if the next HTML token closes the current token.
 *
 * @param {WPHTMLToken}           currentToken Current token to compare with.
 * @param {WPHTMLToken|undefined} nextToken    Next token to compare against.
 *
 * @return {boolean} True if `nextToken` closes `currentToken`, false otherwise.
 */
```

If a parameter is optional, use the [square-bracket notation](https://jsdoc.app/tags-param.html#optional-parameters-and-default-values). If an optional parameter has a default value which can be expressed as a [default parameter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Default_parameters) in the function expression, it is not necesssary to include the value in JSDoc. If the function parameter has an effective default value which requires complex logic and cannot be expressed using the default parameters syntax, you can choose to include the default value in the JSDoc.

```js
/**
 * Renders a toolbar.
 *
 * @param {Object} props             Component props.
 * @param {string} [props.className] Class to set on the container `<div />`.
 */
```

When a function does not include a `return` statement, it is said to have a `void` return value. It is not necessary to include a `@return` tag if the return type is `void`.

If a function has multiple code paths where some (but not all) conditions result in a `return` statement, you can document this as a union type including the `void` type.

```js
/**
 * Returns a configuration value for a given key, if exists.
 * 
 * @param {string} key Configuration key to retrieve.
 * 
 * @return {*|void} Configuration value, if exists.
 */
function getConfigurationValue( key ) {
	if ( config.hasOwnProperty( key ) ) {
		return config[ key ];
	}
}
```

When documenting a [function type](https://github.com/WordPress/gutenberg/blob/add/typescript-jsdoc-guidelines/docs/contributors/coding-guidelines.md#record-types), you must always include the `void` return value type, as otherwise the function is inferred to return a mixed ("any") value, not a void result.

```js
/**
 * An apiFetch middleware handler. Passed the fetch options, the middleware is
 * expected to call the `next` middleware once it has completed its handling.
 *
 * @typedef {(options:WPAPIFetchOptions,next:WPAPIFetchMiddleware)=>void} WPAPIFetchMiddleware
 */
```

### Documenting Examples

Because the documentation generated using the `@wordpress/docgen` tool will include `@example` tags if they are defined, it is considered a best practice to include usage examples for functions and components. This is especially important for documented members of a package's public API.

When documenting an example, use the markdown <code>\`\`\`</code> code block to demarcate the beginning and end of the code sample. An example can span multiple lines.

```js
/**
 * Given the name of a registered store, returns an object of the store's
 * selectors. The selector functions are been pre-bound to pass the current
 * state automatically. As a consumer, you need only pass arguments of the
 * selector, if applicable.
 *
 * @param {string} name Store name.
 *
 * @example
 * ```js
 * select( 'my-shop' ).getPrice( 'hammer' );
 * ```
 *
 * @return {Object<string,WPDataSelector>} Object containing the store's
 *                                         selectors.
 */
```

### Documenting `@wordpress/element` (React) Components

When possible, all components should be implemented as [function components](https://reactjs.org/docs/components-and-props.html#function-and-class-components), using [hooks](https://reactjs.org/docs/hooks-intro.html) for managing component lifecycle and state.

Documenting a function component should be treated the same as any other function. The primary caveat in documenting a component is being aware that the function typically accepts only a single argument (the "props"), which may include many property members. Use the [dot syntax for parameter properties](https://jsdoc.app/tags-param.html#parameters-with-properties) to document individual prop types.

```js
/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle name="my-plugin/my-block" />
 * ```
 *
 * @param {Object}  props      Component props.
 * @param {?string} props.name Block name.
 *
 * @return {?string} Block title.
 */
```

For class components, there is no recommendation for documenting the props of the component. Gutenberg does not use or endorse the [`propTypes` static class member](https://reactjs.org/docs/typechecking-with-proptypes.html).

## PHP

We use
[`phpcs` (PHP\_CodeSniffer)](https://github.com/squizlabs/PHP_CodeSniffer) with the [WordPress Coding Standards ruleset](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards) to run a lot of automated checks against all PHP code in this project.  This ensures that we are consistent with WordPress PHP coding standards.

The easiest way to use PHPCS is [local environment](/docs/contributors/getting-started.md#local-environment). Once that's installed, you can check your PHP by running `npm run lint-php`.

If you prefer to install PHPCS locally, you should use `composer`. [Install `composer`](https://getcomposer.org/download/) on your computer, then run `composer install`.  This will install `phpcs` and `WordPress-Coding-Standards` which you can then run via `composer lint`.
