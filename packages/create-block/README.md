# Create Block

Create Block is an officially supported tool for scaffolding WordPress plugins with blocks. It generates PHP, JS, CSS code, and everything you need to start the project. It integrates a modern build setup with no configuration.

It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community.

## Description

Blocks are the fundamental element of the WordPress block editor. They are the primary way in which plugins can register their functionality and extend the editor's capabilities.

Visit the [Gutenberg handbook](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) to learn more about Block API.

## Quick start

You only need to provide the `slug` – the target location for scaffolded plugin files and the internal block name.

```bash
$ npx @wordpress/create-block todo-list
$ cd todo-list
$ npm start
```

_(requires `node` version `14.0.0` or above, and `npm` version `6.14.4` or above)_

It creates a WordPress plugin that you need to [install manually](https://wordpress.org/support/article/managing-plugins/#manual-plugin-installation).

[Watch a video introduction to create-block on Learn.wordpress.org](https://learn.wordpress.org/tutorial/using-the-create-block-tool/)

## Usage

The following command generates a project with PHP, JS, and CSS code for registering a block with a WordPress plugin.

```bash
$ npx @wordpress/create-block [options] [slug]
```

![Demo](https://user-images.githubusercontent.com/699132/103872910-4de15f00-50cf-11eb-8c74-67ca91a8c1a4.gif)

`[slug]` is optional. When provided, it triggers the quick mode where it is used as the block slug used for its identification, the output location for scaffolded files, and the name of the WordPress plugin. The rest of the configuration is set to all default values unless overridden with some options listed below.

Options:

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

More examples:

1. Interactive mode - without giving a project name, the script will run in interactive mode giving a chance to customize the important options before generating the files.

```bash
$ npx @wordpress/create-block
```

2. External npm package – it is also possible to select an external npm package as a template.

```bash
$ npx @wordpress/create-block --template my-template-package
```

3. Local template directory – it is also possible to pick a local directory as a template.

```bash
$ npx @wordpress/create-block --template ./path/to/template-directory
```

4. Generating a dynamic block based on the built-in template.

```bash
$ npx @wordpress/create-block --variant dynamic
```

5. Help – you need to use `npx` to output usage information.

```bash
$ npx @wordpress/create-block --help
```

5. No plugin mode – it is also possible to scaffold only block files into the current directory.

```bash
$ npx @wordpress/create-block --no-plugin
```

When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name. In most cases, we recommended pairing blocks with WordPress plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.

## Available commands in the scaffolded project

The plugin folder created when executing this command, is a node package with a modern build setup that requires no configuration. A set of scripts are avalable from inside that folder (provided by the `scripts` package) to make your work easier. A full description of these commands is available [here](https://github.com/WordPress/gutenberg/tree/HEAD/packages/scripts#available-scripts)

_Note: You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on coding._

For example, running the `start` script from inside the generated folder (`npm start`) would automatically start the build for development.

## External Project Templates

[Click here](https://github.com/WordPress/gutenberg/tree/HEAD/packages/create-block/docs/external-template.md) for information on External Project Templates

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
