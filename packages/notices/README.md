# Notices

State management for notices.

## Installation

Install the module

```bash
npm install @wordpress/notices
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

When imported, the notices module registers a data store on the `core/notices` namespace. In WordPress, this is accessed from `wp.data.dispatch( 'core/notices' )`.

For more information about consuming from a data store, refer to [the `@wordpress/data` documentation on _Data Access and Manipulation_](/packages/data/README.md#data-access-and-manipulation).

For a full list of actions and selectors available in the `core/notices` namespace, refer to the [_Notices Data_ Handbook page](/docs/reference-guides/data/data-core-notices.md).

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
