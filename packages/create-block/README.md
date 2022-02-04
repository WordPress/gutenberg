# Create Block

Create Block is an officially supported way to create blocks for registering a block for a WordPress plugin. It offers a modern build setup with no configuration. It generates PHP, JS, CSS code, and everything else you need to start the project.

It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community.

## Description

Blocks are the fundamental element of the WordPress block editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

Visit the [Gutenberg handbook](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) to learn more about Block API.

## Quick start

You just need to provide the `slug` which is the target location for scaffolded plugin files and the internal block name.

```bash
$ npx @wordpress/create-block todo-list
$ cd todo-list
$ npm start
```

_(requires `node` version `12.0.0` or above, and `npm` version `6.9.0` or above)_

It creates a WordPress plugin that you need to [install manually](https://wordpress.org/support/article/managing-plugins/#manual-plugin-installation).

## Usage

The following command generates PHP, JS and CSS code for registering a block.

```bash
$ npx @wordpress/create-block [options] [slug]
```

![Demo](https://user-images.githubusercontent.com/699132/103872910-4de15f00-50cf-11eb-8c74-67ca91a8c1a4.gif)

`[slug]` is optional. When provided it triggers the quick mode where it is used as the block slug used for its identification, the output location for scaffolded files, and the name of the WordPress plugin. The rest of the configuration is set to all default values unless overridden with some of the options listed below.

Options:

```bash
-V, --version                output the version number
-t, --template <name>        plugin template type name, allowed values: "es5", "esnext", the name of an external npm package (default: "esnext"), or the path to a local directory.
--namespace <value>          internal namespace for the block name
--title <value>              display title for the plugin/block
--short-description <value>  short description for the plugin/block
--category <name>            category name for the block
--wp-scripts                 enable integration with `@wordpress/scripts` package
--no-wp-scripts              disable integration with `@wordpress/scripts` package
--wp-env                     enable integration with `@wordpress/env` package
-h, --help                   output usage information
```

More examples:

1. Interactive mode - without giving a project name, the script will run in interactive mode giving a chance to customize the important options before generating the files.

```bash
$ npx @wordpress/create-block
```

2. ES5 template – it is also possible to pick ES5 template when you don't want to deal with a build step (`npm start`) which enables ESNext and JSX support.

```bash
$ npx @wordpress/create-block --template es5
```

3. Local template directory – it is also possible to pick a local directory as a template.

```bash
$ npx @wordpress/create-block --template ./path/to/template
```

4. Help – you need to use `npx` to output usage information.

```bash
$ npx @wordpress/create-block --help
```

When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name, and the `category`. In most cases, we recommended pairing blocks with plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.

## Available Commands

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
$ npm run format
```

Formats files. [Learn more](/packages/scripts#format).

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

_Note: You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on coding._

## External Templates

Since version `0.19.0` it is possible to use external templates hosted on npm. These packages need to contain `.mustache` files that will be used during the block scaffolding process.

### Template Configuration

It is mandatory to provide the main file (`index.js` by default) for the package that returns a configuration object. It must contain at least the `templatesPath` field.

#### `templatesPath`

A mandatory field with the path pointing to the location where plugin template files live (nested folders are also supported). All files without the `.mustache` extension will be ignored.

_Example:_

```js
const { join } = require( 'path' );

module.exports = {
	templatesPath: join( __dirname, 'plugin-templates' ),
};
```

#### `blockTemplatesPath`

An optional field with the path pointing to the location where template files for the individual block live (nested folders are also supported). All files without the `.mustache` extension will be ignored.

_Example:_

```js
const { join } = require( 'path' );

module.exports = {
	blockTemplatesPath: join( __dirname, 'block-templates' ),
};
```

#### `assetsPath`

This setting is useful when your template scaffolds a plugin that uses static assets like images or fonts, which should not be processed. It provides the path pointing to the location where assets are located. They will be copied to the `assets` subfolder in the generated plugin.

_Example:_

```js
const { join } = require( 'path' );

module.exports = {
	assetsPath: join( __dirname, 'plugin-assets' ),
};
```

#### `defaultValues`

It is possible to override the default template configuration using the `defaultValues` field.

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

-   `$schema` (default: `https://schemas.wp.org/trunk/block.json`)
-   `apiVersion` (default: `2`) - see https://make.wordpress.org/core/2020/11/18/block-api-version-2/.
-   `slug` (no default)
-   `namespace` (default: `'create-block'`)
-   `title` (no default) - a display title for your block.
-   `description` (no default) - a short description for your block.
-   `dashicon` (no default) - an icon property thats makes it easier to identify a block, see https://developer.wordpress.org/resource/dashicons/.
-   `category` (default: `'widgets'`) - blocks are grouped into categories to help users browse and discover them. The categories provided by core are `text`, `media`, `design`, `widgets`, `theme`, and `embed`.
-   `attributes` (no default) - see https://developer.wordpress.org/block-editor/developers/block-api/block-attributes/.
-   `supports` (no default) - optional block extended support features, see https://developer.wordpress.org/block-editor/developers/block-api/block-supports/.
-   `author` (default: `'The WordPress Contributors'`)
-   `license` (default: `'GPL-2.0-or-later'`)
-   `licenseURI` (default: `'https://www.gnu.org/licenses/gpl-2.0.html'`)
-   `version` (default: `'0.1.0'`)
-   `wpScripts` (default: `true`)
-   `wpEnv` (default: `false`) - enables integration with the `@wordpress/env` package and adds the `env` command to the package.json.
-   `npmDependencies` (default: `[]`) – the list of remote npm packages to be installed in the project with [`npm install`](https://docs.npmjs.com/cli/v8/commands/npm-install) when `wpScripts` is enabled.
-   `folderName` (default: `.`) – the location for the `block.json` file and other optional block files generated from block templates included in the folder set with the `blockTemplatesPath` setting.
-   `editorScript` (default: `'file:./build/index.js'`)
-   `editorStyle` (default: `'file:./build/index.css'`)
-   `style` (default: `'file:./build/style-index.css'`)

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
