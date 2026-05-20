# Rich Text Control

A standalone rich text form control built on top of [`@wordpress/rich-text`](https://www.npmjs.com/package/@wordpress/rich-text).

Unlike the in-canvas `RichText` component from `@wordpress/block-editor`, `RichTextControl` is intended for standalone form fields (DataForms, sidebar inputs, etc.). It exposes a straightforward `value` / `onChange` interface and skips block-editor selection coupling, while still wiring registered format types so familiar keyboard shortcuts (Cmd+B, Cmd+I, Cmd+K) keep working.

## Installation

Install the module

```bash
npm install @wordpress/rich-text-control --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

`RichTextControl` is currently exposed as a private API. Opt in from a package on the [private-apis allowlist](https://github.com/WordPress/gutenberg/blob/HEAD/packages/private-apis/src/implementation.ts):

```js
import { __dangerousOptInToUnstableAPIsOnlyForCoreModules } from '@wordpress/private-apis';
import { privateApis } from '@wordpress/rich-text-control';

const { unlock } = __dangerousOptInToUnstableAPIsOnlyForCoreModules(
	'I acknowledge private features are not for use in themes or plugins and doing so will break in the next version of WordPress.',
	'@wordpress/your-package'
);

const { RichTextControl } = unlock( privateApis );
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
