# Private APIs

`@wordpress/private-apis` enables sharing private `__experimental` APIs across `@wordpress` packages without
[publicly exposing them to WordPress extenders](https://make.wordpress.org/core/2022/08/10/proposal-stop-merging-experimental-apis-from-gutenberg-to-wordpress-core/#respond).

## Getting started

Every `@wordpress` package wanting to privately access or expose experimental APIs must opt-in to `@wordpress/private-apis`:

```js
// In packages/block-editor/private-apis.js:
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
export const { lock, unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.',
		'@wordpress/block-editor' // Name of the package calling __dangerousOptInToUnstableAPIsOnlyForCoreModules,
		// (not the name of the package whose APIs you want to access)
	);
```

Each package may only opt in once. The function name communicates that plugins are not supposed to use it.

The function will throw an error if the following conditions are not met:

1. The first argument must exactly match the required consent string: `'I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.'`.
2. The second argument must be a known `@wordpress` package that hasn't yet opted into `@wordpress/private-apis`

Once the opt-in is complete, the obtained `lock()` and `unlock()` utilities enable hiding `__experimental` APIs from the naked eye:

```js
// Say this object is exported from a package:
export const publicObject = {};

// However, this string is internal and should not be publicly available:
const __experimentalString = '__experimental information';

// Solution: lock the string "inside" of the object:
lock( publicObject, __experimentalString );

// The string is not nested in the object and cannot be extracted from it:
console.log( publicObject );
// {}

// The only way to access the string is by "unlocking" the object:
console.log( unlock( publicObject ) );
// "__experimental information"

// lock() accepts all data types, not just strings:
export const anotherObject = {};
lock( anotherObject, function __experimentalFn() {} );
console.log( unlock( anotherObject ) );
// function __experimentalFn() {}
```

Use `lock()` and `unlock()` to privately distribute the `__experimental` APIs across `@wordpress` packages:

```js
// In packages/package1/index.js:
import { lock } from './lock-unlock';

export const privateApis = {};
/* Attach private data to the exported object */
lock( privateApis, {
	__experimentalFunction: function () {},
} );

// In packages/package2/index.js:
import { privateApis } from '@wordpress/package1';
import { unlock } from './lock-unlock';

const { __experimentalFunction } = unlock( privateApis );
```

## Shipping experimental APIs

See the [Experimental and Unstable APIs chapter of Coding Guidelines](/docs/contributors/code/coding-guidelines.md) to learn how `lock()` and `unlock()` can help
you ship private experimental functions, arguments, components, properties, actions, selectors.

## Technical limitations

A determined developer who would want to use the private experimental APIs at all costs would have to:

-   Realize a private importing system exists
-   Read the code where the risks would be spelled out in capital letters
-   Explicitly type out he or she is aware of the consequences
-   Pretend to register a `@wordpress` package (and trigger an error as soon as the real package is loaded)

Dangerously opting in to using these APIs by theme and plugin developers is not recommended. Furthermore, the WordPress Core philosophy to strive to maintain backward compatibility for third-party developers **does not apply** to experimental APIs registered via this package.

The consent string for opting in to these APIs may change at any time and without notice. This change will break existing third-party code. Such a change may occur in either a major or minor release.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>

### Updating the consent string

The consent string for unlocking private APIs is intended to change on a regular basis. To update the consent string:

1. Come up with a new consent string, the string should mention that themes or plugins opting in to unstable and private features will break in future versions of WordPress.
2. Ensure the consent string has not being used previously.
3. Append the new string to the history list below.
4. Replace the consent string in the following locations:
   * twice in the documentation above
   * in the `src/implementation.js` file of this package
   * in the `src/lock-unlock.js` file located in packages consuming private APIs
   * search the full code base for any other occurrences

**Note**: The consent string is not used for user facing content and as such should _not_ be made translatable via the internationalization features of WordPress.

Updating the consent string is considered a task and can be done during the late stages of a WordPress release.

#### Consent string history

The final string in this list is the current version.

1. I know using unstable features means my plugin or theme will inevitably break on the next WordPress release.
2. I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.
