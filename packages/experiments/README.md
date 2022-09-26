# Experiments

Private `__experimental` APIs that are not [exposed publicly plugin authors](https://make.wordpress.org/core/2022/08/10/proposal-stop-merging-experimental-apis-from-gutenberg-to-wordpress-core/#respond).

This package acts as a "dealer" that only allows WordPress packages to use the experimental APIs.

Each package needs to start by registering itself:

```js
const { register } =
	__dangerousOptInToUnstableAPIsOnlyForCoreModules(
		'<CONSENT STRING>',  // See index.js
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
