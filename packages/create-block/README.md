# Create Block

Create Block is an officially supported way to create blocks for registering a block for a WordPress plugin. It offers a modern build setup with no configuration. It generates PHP, JS, CSS code, and everything else you need to start the project.

It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community.

## Description

Blocks are the fundamental element of the WordPress block editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

Visit the [Gutenberg handbook](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) to learn more about Block API.

## Quick start

![Demo](https://make.wordpress.org/core/files/2020/02/74508276-f0648280-4efe-11ea-9cc0-a607b43d1bcf.gif)

You just need to provide the `slug` which is the target location for scaffolded files and the internal block name.

```bash
$ npx @wordpress/create-block todo-list
$ cd todo-list
$ npm start
```

_(requires `node` version `10.0.0` or above, and `npm` version `6.9.0` or above)_

You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on the code.

## Usage

The following command generates PHP, JS and CSS code for registering a block.

```bash
$ npx @wordpress/create-block [options] [slug]
```

`[slug]` is optional. When provided it triggers the quick mode where it is used as the block slug used for its identification, the output location for scaffolded files, and the name of the WordPress plugin. The rest of the configuration is set to all default values unless overridden with some of the options listed below.

Options:

```bash
-V, --version                output the version number
-t, --template <name>        block template type name, allowed values: "es5", "esnext", or the name of an external npm package (default: "esnext")
--namespace <value>          internal namespace for the block name
--title <value>              display title for the block
--short-description <value>  short description for the block
--category <name>            category name for the block
--wp-scripts                 enable integration with `@wordpress/scripts` package
--no-wp-scripts              disable integration with `@wordpress/scripts` package
-h, --help                   output usage information
```

_Please note that `--version` and `--help` options don't work with `npm init`. You have to use `npx` instead, as presented in the examples._

More examples:

1. Interactive mode - without giving a project name, the script will run in interactive mode giving a chance to customize the important options before generating the files.

```bash
$ npx @wordpress/create-block
```

2. ES5 template – it is also possible to pick ES5 template when you don't want to deal with a build step (`npm start`) which enables ESNext and JSX support.

```bash
$ npx @wordpress/create-block --template es5
```

3. Help – you need to use `npx` to output usage information.

```bash
$ npx @wordpress/create-block --help
```

When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name, and the `category`. In most cases, we recommended pairing blocks with plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.

## Available Commands [ESNext template]

When bootstrapped with the `esnext` template (or any external template with `wpScripts` flag enabled), you can run several commands inside the directory:

```bash
$ npm start
```

Starts the build for development. [Learn more](/packages/scripts#start).

```bash
$ npm run build
```

Builds the code for production. [Learn more](/packages/scripts#build).

```bash
$ npm run format:js
```

Formats JavaScript files. [Learn more](/packages/scripts#format-js).

```bash
$ npm run lint:css
```

Lints CSS files. [Learn more](/packages/scripts#lint-style).

```bash
$ npm run lint:js
```

Lints JavaScript files. [Learn more](/packages/scripts#lint-js).

```bash
$ npm run packages-update
```

Updates WordPress packages to the latest version. [Learn more](/packages/scripts#packages-update).

## External Templates

Since version `0.19.0` it is possible to use external templates hosted on npm. These packages need to contain `.mustache` files that will be used during the block scaffolding process.

### Template Configuration

It is mandatory to provide the main file for the package that returns a configuration object. It must containing at least `templatesPath` field with the path pointing to the location where template files live (nested folders are also supported).

_Example:_

```js
module.exports = {
	templatesPath: __dirname,
};
```

It is also possible to override the default template configuration using the `defaultValues` field.

_Example:_

```js
module.exports = {
	defaultValues: {
		slug: 'my-fantastic-block',
		title: 'My fantastic block',
		dashicon: 'palmtree',
		version: '1.2.3',
	},
	templatesPath: __dirname,
};
```

The following configurable variables are used with the template files. Template authors can change default values to use when users don't provide their data:

-   `slug` (no default)
-   `namespace` (default: `create-block`)
-   `title` (no default)
-   `description` (no default)
-   `dashicon` (no default)
-   `category` (default: `widgets`)
-   `author` (default: `The WordPress Contributors`)
-   `license` (default: `GPL-2.0-or-later`)
-   `licenseURI` (default: `https://www.gnu.org/licenses/gpl-2.0.html`)
-   `version` (default: `0.1.0`)
-   `wpScripts` (default: `true`)
-   `editorScript` (default: `file:./build/index.js`)
-   `editorStyle` (default: `file:./build/index.css`)
-   `style` (default: `file:./build/style-index.css`)

## WP-CLI

Another way of making a developer’s life easier is to use [WP-CLI](https://wp-cli.org), which provides a command-line interface for many actions you might perform on the WordPress instance. One of the commands `wp scaffold block` was used as the baseline for this tool and ES5 template in particular.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
