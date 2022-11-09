# Create Block

Create Block is an **officially supported tool for scaffolding a WordPress plugin that registers a block**. It generates PHP, JS, CSS code, and everything you need to start the project. It also integrates a modern build setup with no configuration.

_It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community._

> Blocks are the fundamental element of the WordPress block editor. They are the primary way in which plugins can register their functionality and extend the editor's capabilities. _Visit the [Gutenberg handbook](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) to learn more about Block API._

## Table of Contents 

- [Quick start](#quick-start)
- [Usage](#usage)
    - [`slug`](#slug)
    - [Interactive Mode](#interactive-mode)
    - [`options`](#options)
- [Available Commands](#available-commands)
- [External Project Templates](#external-project-templates)
- [Contributing to this package](#contributing-to-this-package)


## Quick start

```bash
$ npx @wordpress/create-block todo-list
$ cd todo-list
$ npm start
```

The `slug` provided (`todo-list` in the example) defines the folder name for the scaffolded plugin and the internal block name. The WordPress plugin generated need to [be installed manually](https://wordpress.org/support/article/managing-plugins/#manual-plugin-installation).


_(requires `node` version `14.0.0` or above, and `npm` version `6.14.4` or above)_


> [Watch a video introduction to create-block on Learn.wordpress.org](https://learn.wordpress.org/tutorial/using-the-create-block-tool/)

## Usage

The `create-block` command generates a project with PHP, JS, and CSS code for registering a block with a WordPress plugin.

```bash
$ npx @wordpress/create-block [options] [slug]
```

![Demo](https://user-images.githubusercontent.com/699132/103872910-4de15f00-50cf-11eb-8c74-67ca91a8c1a4.gif)

> When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name. In most cases, we recommended pairing blocks with WordPress plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.


### `slug`

The use of `[slug]` is optional. 

When provided, it triggers the _quick mode_ where it is used:
- as the block slug (required for its identification)
- as the output location (folder name) for scaffolded files
- as the name of the WordPress plugin. 

The rest of the configuration is set to all default values unless overridden with some options listed below.

### Interactive Mode

When no `[slug]` or `[options]` are provided, the script will run in interactive mode giving a chance to customize the important options before generating the files.

### `options`


```bash
-V, --version                output the version number
-t, --template <name>        project template type name; allowed values: "static" (default), "es5", the name of an external npm package, or the path to a local directory
--no-plugin                  scaffold block files only
--namespace <value>          internal namespace for the block name
--title <value>              display title for the block and the WordPress plugin
--short-description <value>  short description for the block and the WordPress plugin
--category <name>            category name for the block
--wp-scripts                 enable integration with `@wordpress/scripts` package
--no-wp-scripts              disable integration with `@wordpress/scripts` package
--wp-env                     enable integration with `@wordpress/env` package
-h, --help                   output usage information
--variant                    choose a block variant as defined by the template
```

#### `--template`

This argument specifies an _external npm package_ as a template.

```bash
$ npx @wordpress/create-block --template my-template-package
```

This argument also allows to pick a _local directory_ as a template.

```bash
$ npx @wordpress/create-block --template ./path/to/template-directory
```

#### `--variant`

With this argument, `create-block` will generate a dynamic block based on the built-in template.

```bash
$ npx @wordpress/create-block --variant dynamic
```

#### `--help`

With this argument, the `create-block` package outputs usage information.

```bash
$ npx @wordpress/create-block --help
```

#### `--no-plugin`

With this argument, the `create-block` package runs in _No plugin mode_ which only scaffolds block files into the current directory.

```bash
$ npx @wordpress/create-block --no-plugin
```
#### `--wp-env`

With this argument, the `create-block` package will add to the generated plugin the configuration and the script to run [`wp-env` package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) within the plugin. This will allow you to easily set up a local WordPress environment for building and testing the generated plugin. 

```bash
$ npx @wordpress/create-block --wp-env
```

## Available Commands

When bootstrapped with the `static` template (or any other project template with `wpScripts` flag enabled), you can run several commands inside the directory:

```bash
$ npm start
```

Starts the build for development. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#start).

```bash
$ npm run build
```

Builds the code for production. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#build).

```bash
$ npm run format
```

Formats files. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#format).

```bash
$ npm run lint:css
```

Lints CSS files. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#lint-style).

```bash
$ npm run lint:js
```

Lints JavaScript files. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#lint-js).

```bash
$ npm run plugin-zip
```

Creates a zip file for a WordPress plugin. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#plugin-zip).

```bash
$ npm run packages-update
```

Updates WordPress packages to the latest version. [Learn more](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#packages-update).

_Note: You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on coding._

## External Project Templates

[Click here](https://github.com/WordPress/gutenberg/tree/HEAD/packages/create-block/docs/external-template.md) for information on External Project Templates

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
