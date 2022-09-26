# Experiments

Private `__experimental` APIs that are not [exposed publicly plugin authors](https://make.wordpress.org/core/2022/08/10/proposal-stop-merging-experimental-apis-from-gutenberg-to-wordpress-core/#respond).

This package acts as a "dealer" that only allows WordPress packages to use the experimental APIs.

Each package needs to start by registering itself:

```js
const { register } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'<CONSENT STRING>',  // See index.js, this may change without notice.
		'@wordpress/blocks'
	);
```

The function name communicates that plugins are not supposed to use it. To make double and triple sure, the first argument must be that exact consent string, and the second argument must be a known `@wordpress` package that hasn't opted in yet – otherwise an error is thrown.

Expose a new `__experimental` API as follows:

```js
export const __experiments = register( { __unstableGetInnerBlocksProps } )
```

Consume the registered `__experimental` APIs as follows:

```js
// In the @wordpress/block-editor package:
import { __experiments as blocksExperiments } from '@wordpress/blocks';
const { unlock } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'<CONSENT STRING>',  // See index.js
		'@wordpress/block-editor'
	);

const { __unstableGetInnerBlocksProps } = unlock( blocksExperiments );
```

All new experimental APIs should be shipped as **private** using this method.

The **public** experimental APIs that have already been shipped in a stable WordPress version should remain accessible via `window.wp`. Please do not create new ones.

A determined developer who would want to use the private experimental APIs at all costs would have to:

* Realize a private importing system exists
* Read the code where the risks would be spelled out in capital letters
* Explicitly type out he or she is aware of the consequences
* Pretend to register a `@wordpress` package (and trigger an error as soon as the real package is loaded)

Dangerously opting in to using these APIs by theme and plugin developers is not recommended. Furthermore, the WordPress Core philosophy to strive to maintain backward compatibility for third-party developers **does not apply** to experimental APIs registered via this package.

The consent string for opting in to these APIs may change at any time and without notice. This change will break existing third-party code. Such a change may occur in either a major or minor release.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
