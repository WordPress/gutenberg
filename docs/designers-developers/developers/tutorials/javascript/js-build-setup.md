# JavaScript Build Setup

This page covers how to set up your development environment to use the ESNext and [JSX](https://reactjs.org/docs/introducing-jsx.html) syntaxes. ESNext is JavaScript code written using features that are only available in a specification greater than ECMAScript 5 (ES5 for short). JSX is a custom syntax extension to JavaScript which helps you to describe what the UI should look like.

This documentation covers development for your plugin to work with Gutenberg. If you want to setup a development environment for developing Gutenberg itself, see the [CONTRIBUTING.md](https://github.com/WordPress/gutenberg/blob/master/CONTRIBUTING.md) documentation.

Most browsers can not interpret or run ESNext and JSX syntaxes, so we use a transformation step to convert these syntaxes to code that browsers can understand.

There are a few reasons to use ESNext and the extra step. First, it makes for simpler code that is easier to read and write. Using a transformation step allows for tools to optimize the code to work on the widest variety of browsers. Also, by using a build step you can organize your code into smaller modules and files that can be bundled together into a single download.

There are different tools that can perform this transformation or build step, but WordPress uses webpack and Babel.

[webpack](https://webpack.js.org/) is a pluggable tool that processes JavaScript, creating a compiled bundle that runs in a browser. [Babel](https://babeljs.io/) transforms JavaScript from one format to another. You use Babel as a plugin to webpack to transform both ESNext and JSX to JavaScript.

The [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts) package abstracts these libraries away to standardize and simplify development, so you won't need to handle the details for configuring those libraries.

## Quick Start

For a quick start, you can use one of the examples from the [Gutenberg Examples repository](https://github.com/wordpress/gutenberg-examples/). Each one of the `-esnext` directories contain the necessary files for working with ESNext and JSX.

## Setup

Both webpack and Babel are tools written in JavaScript and run using [Node.js](https://nodejs.org/) (node). Node.js is a runtime environment for JavaScript outside of a browser. Simply put, node allows you to run JavaScript code on the command-line.

First, you need to set up node for your development environment. The steps required change depending on your operating system, but if you have a package manager installed, setup can be as straightforward as:

- Ubuntu: `apt install node`
- macOS: `brew install node`
- Windows: `choco install node`

Additionally, the [Node.js download page](https://nodejs.org/en/download/) includes installers and binaries.

**Note:** The build tools and process occur on the command-line, so some basic familiarity using a terminal application is required. Some text editors have a terminal built-in which is fine to use; Visual Studio Code and PhpStorm are two popular options.

### Node Package Manager (npm)

The Node Package Manager (npm) is a tool included with node. npm allows you to install and manage JavaScript packages. npm can also generate and process a special file called `package.json`, which contains some information about your project and the packages your project uses.

To start a new node project, first create a directory to work in.

```
mkdir myguten-block
cd myguten-block
```

You create a new package.json running `npm init` in your terminal.  This will walk you through creating your package.json file:

```
npm init

package name: (myguten-block) myguten-block
version: (1.0.0)
description: Test block
entry point: (index.js) build/index.js
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

### Using npm to install packages

The next step is to install the packages required. You can install packages using the npm command `npm install`. If you pass the `--save-dev` parameter, npm will write the package as a dev dependency in the package.json file. The `--save-exact` parameter instructs npm to save an exact version of a dependency, not a range of valid versions. See [npm install documentation](https://docs.npmjs.com/cli/install) for more details.

Run `npm install --save-dev --save-exact @wordpress/scripts`

After installing, a `node_modules` directory is created with the modules and their dependencies.

Also, if you look at package.json file it will include a new section:

```json
"devDependencies": {
	"@wordpress/scripts": "3.1.0"
}
```

## Webpack & Babel

The `@wordpress/scripts` package handles the dependencies and default configuration for webpack and Babel. The scripts package expects the source file to compile to be found at `src/index.js`, and will save the compiled output to `build/index.js`.

With that in mind, let's set up a basic block. Create a file at `src/index.js` with the following content:

```js
const { registerBlockType } = wp.blocks;

registerBlockType( 'myguten/test-block', {
	title: 'Basic Example',
	icon: 'smiley',
	category: 'layout',
	edit: () => <div>Hola, mundo!</div>,
	save: () => <div>Hola, mundo!</div>,
} );
```

To configure npm to run a script, you use the scripts section in `package.json` webpack:

```json
  "scripts": {
    "build": "wp-scripts build"
  },
```

You can then run the build using: `npm run build`.

After the build finishes, you will see the built file created at `build/index.js`.

## Finishing Touches

### Development Mode

The **build** command in `@wordpress/scripts` runs in a "production" mode. This shrinks the code down so it downloads faster, but makes it difficult to read in the process. You can use the **start** command which runs a development mode that does not shrink the code, and additionally continues a running process to watch the source file for more changes and rebuild as you develop.

The start command can be added to the same scripts section of `package.json`:

```json
  "scripts": {
    "start": "wp-scripts start",
    "build": "wp-scripts build"
  },
```

Now, when you run `npm start` a watcher will run in the terminal. You can then edit away in your text editor; after each save, it will automatically build. You can then use the familiar edit/save/reload development process.

**Note:** keep an eye on your terminal for any errors. If you make a typo or syntax error, the build will fail and the error will be in the terminal.


### Source Control

Because a typical `node_modules` folder will contain thousands of files that change with every software update, you should exclude `node_modules/` from your source control. If you ever start from a fresh clone, simply run `npm install` in the same folder your `package.json` is located to pull your required packages.

Likewise, you do not need to include `node_modules` or any of the above configuration files in your plugin because they will be bundled inside the file that webpack builds. **Be sure to enqueue the `build/index.js` file** in your plugin PHP. This is the only JavaScript file needed for your block to run.

## Summary

Yes, the initial setup is a bit more involved, but the additional features and benefits are usually worth the trade off in setup time.

With a setup in place, the standard workflow is:

- Install dependencies: `npm install`
- Start development builds: `npm start`
- Develop. Test. Repeat.
- Create production build: `npm run build`
