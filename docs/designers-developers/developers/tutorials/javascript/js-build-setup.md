# JavaScript Build Setup

This page covers how to setup your development environment to use the ESNext syntax. This documentation covers development for your plugin to work with Gutenberg, to setup a development environment to work directly on Gutenberg, see the [CONTRIBUTING.md](https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md) documentation.

For simpler code, you can write JavaScript using ESNext and JSX syntax. This requires a transformation step to convert that syntax which a web browser may not understand, to one that it will.  Webpack and babel are the tools that perform this transformation step.

[Webpack](https://webpack.js.org/) is a pluggable tool that processes JavaScript creating a compiled bundle that runs in a browser. [Babel](https://babeljs.io/) transforms JavaScript from one format to another. You use Babel as a plugin to Webpack to transform both ESNext and JSX to JavaScript.

## Quick Start

For a quick start, you can use one of the examples from the [Gutenberg Examples repository](https://github.com/wordpress/gutenberg-examples/). Each one of the `-esnext` directories contain the necessary files for working with ESNext and JSX.

## Setup

Both Webpack and Babel are tools written in JavaScript and run using [Node.js](https://nodejs.org/). Node.js is a runtime environment for JavaScript outside of a browser. Simply put, node allows you to run JavaScript code on the command-line.

First step is setting up node for your development environment. This is dependent on your operating system, there are node packages available for most package systems. If you are using one of the package systems, setup can be as straight-forward as:
```
macOS: brew install node
Windows: choco install node
Ubuntu: apt install node
```

Additionally, the [Node.js download page](https://nodejs.org/en/download/) includes installers and binaries.

**Note:** The build tools and process occur on the command-line, so some basic familiarity using a terminal application is required. Some text editors have a terminal built-in which is fine to use, Visual Studio Code editor is one popular example.

### Node Package Manager

The Node Package Manager (npm) is a tool included with node. NPM allows you to install and manage JavaScript packages using the package.json definition file.

First, create a directory to work in.
```
mkdir myguten-block
```

You create a new package.json using: `npm init`.  This will walk you through creating a file.

```
$ npm init

package name: (myguten-block) myguten-block
version: (1.0.0)
description: Test block
entry point: (index.js) block.js
test command:
git repository:
keywords:
author: mkaz
license: (ISC) GPL-2.0-only
About to write to /home/mkaz/src/wp/scratch/package.json:

{
  "name": "myguten-block",
  "version": "1.0.0",
  "description": "Test block",
  "main": "block.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "mkaz",
  "license": "GPL-2.0-only"
}


Is this OK? (yes) yes
```

## Webpack & Babel

The next step is to install webpack. You can install packages using the npm command: `npm install`. If you pass the `--save` parameter, npm will write the package as a dependency in package.json file.

Run: `npm install --save webpack`

After installing, a `node_modules` directory is created with the webpack module and its dependencies.

Also, if you look at package.json file it will include a new section:
```json
"dependencies": {
	"webpack": "^4.29.0"
}
```

Next, you configure webpack to process the `block.js` file and run babel to transform the JSX.

Create the file `webpack.config.js`

```js
// sets mode webpack runs under
const NODE_ENV = process.env.NODE_ENV || 'development';

module.exports = {
	mode: NODE_ENV,

	// entry is the source script
	entry: './block.js',

	// output is where to write the built file
	output: {
		path: __dirname,
		filename: 'block.build.js',
	},
	module: {
		// the list of rules used to process files
		// this looks for .js files, exclude files
		// in node_modules directory, and uses the
		// babel-loader to process
		rules: [
			{
				test: /.js$/,
				exclude: /node_modules/,
				loader: 'babel-loader',
			},
		],
	},
};
```

Next, you need to install babel, the webpack loader, and the JSX plugin using:
```
npm install --save babel-loader babel-core babel-plugin-transform-react-jsx
```

You configure babel by creating a `.babelrc` file:
```
{
	"plugins": [
		[ "transform-react-jsx", {
			"pragma": "wp.element.createElement"
		} ]
	]
}
```
The pragma setting replaces the function JSX uses for transformation, the `wp.element.createElement` is an equivalent wrapper of `React.createElement` which is the default function for JSX.

With both configs in place, you can now run webpack.

First you need a basic block.js to build. Create `block.js`

```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'myguten/test-block', {
	title: 'Basic Example',
	icon: 'smiley',
	category: 'layout',
	edit() {
		return <div>Hola mundo!</div>;
	},
	save() {
		return <div>Hola mundo!</div>;
	},
} );
```

To configure npm to run a script, you use the scripts section in `package.json` webpack:
```json
  "scripts": {
    "build": "webpack"
  },
```

You can then run the build using: `npm run build`

Afterwards, you will see the build file created at: `block.build.js`

## Finishing Touches

### Development Mode

The basics are in place to build. You might of noticed the webpack.config.js set a default mode to "development". Webpack has the ability to run in a "production" mode which shrinks the code down, but makes it difficult to read.

The mode is setup so it can be configured using environment variables, this is easiest to add in the scripts section of `package.json`.

Update scripts section to:

```json
  "scripts": {
    "dev": "webpack --watch",
    "build": "cross-env NODE_ENV=production webpack"
  },
```

This sets the environment variables, but different environment handle setting in different ways, so using the `cross-env` helper module handles this. Be sure to install using: `npm install --save cross-env`

Additionally, webpack has a `--watch` flag that will keep the process running, watching for any changes to the `block.js` file and update as changes occur. This is useful during development, you start the build running using `npm run dev` in a terminal. You can then edit away in your text editor and each save, webpack will automatically build. You can then use the familiar edit-save,-reload development process.

**Note:** keep an eye on your terminal for any errors. If you make a typo, or syntax error, the build will fail and the error will be in the terminal.

### Babel Browser TargetingT

Babel has the ability to build JavaScript using rules that target certain browsers and versions. By setting a reasonable set of modern browsers allows Babel to optimize the JavaScript it generates.

WordPress has a preset default you can use to target the minimum supported browsers by WordPress.

Install the module using: `npm install --save @wordpress/babel-preset-default`

You then update `.babelrc` adding a "presets" section:

```
{
	"presets": [ "@wordpress/babel-preset-default" ],
	"plugins": [
		[ "transform-react-jsx", {
			"pragma": "wp.element.createElement"
		} ]
	]
}
```

### Source Control

You should exclude `node_modules/` from your source control, the files can be recreated any time by running `npm install`.

Likewise, you do not need to include `node_modules` or any of the above configuration files in your plugin. **Be sure to enqueue the `block.build.js` file** in your plugin PHP. This is the only JavaScript file needed for your block to run.

## Summary

Yes, the initial setup is rather tedious, there are numerous different tools and configs. However, as the quick start alluded to, copying an existing config is the typical way most people start.

With a setup in place, the standard workflow is:

- Install dependencies: `npm install`
- Start development builds: `npm run dev`
- Develop. Test. Repeat.
- Create production build: `npm run build`


