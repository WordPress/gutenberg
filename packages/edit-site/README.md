# Edit Site

Edit Site Page Module for WordPress.

> This package is meant to be used only with WordPress core. Feel free to use it in your own project but please keep in mind that it might never get fully documented.

## Installation

```bash
npm install @wordpress/edit-site
```

## Usage

```js
/**
 * WordPress dependencies
 */
import { initialize } from '@wordpress/edit-site';

/**
 * Internal dependencies
 */
import blockEditorSettings from './block-editor-settings';

initialize( '#editor-root', blockEditorSettings );
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as IE browsers then using [core-js](https://github.com/zloirock/core-js) will add polyfills for these methods._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
