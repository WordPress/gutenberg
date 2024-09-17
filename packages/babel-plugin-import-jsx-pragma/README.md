# Babel Plugin Import JSX Pragma

Babel transform plugin for automatically injecting an import to be used as the pragma for the [React JSX Transform plugin](http://babeljs.io/docs/en/babel-plugin-transform-react-jsx).

[JSX](https://reactjs.org/docs/jsx-in-depth.html) is merely a syntactic sugar for a function call, typically to `React.createElement` when used with [React](https://reactjs.org/). As such, it requires that the function referenced by this transform be within the scope of the file where the JSX occurs. In a typical React project, this means React must be imported in any file where JSX exists.

**Babel Plugin Import JSX Pragma** automates this process by introducing the necessary import automatically wherever JSX exists, allowing you to use JSX in your code without thinking to ensure the transformed function is within scope. It respects existing import statements, as well as scope variable declarations.

## Installation

Install the module to your project using [npm](https://www.npmjs.com/).

```bash
npm install @wordpress/babel-plugin-import-jsx-pragma
```

**Note**: This package requires Node.js version with long-term support status (check [Active LTS or Maintenance LTS releases](https://nodejs.org/en/about/previous-releases)). It is not compatible with older versions.

## Usage

Refer to the [Babel Plugins documentation](http://babeljs.io/docs/en/plugins) if you don't yet have experience working with Babel plugins.

Include `@wordpress/babel-plugin-import-jsx-pragma` (and [@babel/plugin-transform-react-jsx](https://babeljs.io/docs/en/babel-plugin-transform-react-jsx/)) as plugins in your Babel configuration. If you don't include both you will receive errors when encountering JSX tokens.

```js
// .babelrc.js
module.exports = {
	plugins: [
		'@wordpress/babel-plugin-import-jsx-pragma',
		'@babel/plugin-transform-react-jsx',
	],
};
```

_Note:_ `@wordpress/babel-plugin-import-jsx-pragma` is included in `@wordpress/babel-preset-default` (default preset for WordPress development) starting from `v4.0.0`. If you are using this preset, you shouldn't include this plugin in your Babel config.

## Options

As the `@babel/plugin-transform-react-jsx` plugin offers options to customize the `pragma` to which the transform references, there are equivalent options to assign for customizing the imports generated.

For example, if you are using the `react` package, you may want to use the following configuration:

```js
// .babelrc.js
module.exports = {
	plugins: [
		[
			'@wordpress/babel-plugin-import-jsx-pragma',
			{
				scopeVariable: 'createElement',
				scopeVariableFrag: 'Fragment',
				source: 'react',
				isDefault: false,
			},
		],
		[
			'@babel/plugin-transform-react-jsx',
			{
				pragma: 'createElement',
				pragmaFrag: 'Fragment',
			},
		],
	],
};
```

### `scopeVariable`

_Type:_ String

Name of variable required to be in scope for use by the JSX pragma. For the default pragma of React.createElement, the React variable must be within scope.

### `scopeVariableFrag`

_Type:_ String

Name of variable required to be in scope for `<></>` `Fragment` JSX. Named `<Fragment />` elements
expect Fragment to be in scope and will not add the import.

### `source`

_Type:_ String

The module from which the scope variable is to be imported when missing.

### `isDefault`

_Type:_ Boolean

Whether the scopeVariable is the default import of the source module. Note that this has no impact
on `scopeVariableFrag`.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
