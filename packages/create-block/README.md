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

_(requires `node` version `12.0.0` or above, and `npm` version `6.9.0` or above)_

It creates a WordPress plugin that you need to [install manually](https://wordpress.org/support/article/managing-plugins/#manual-plugin-installation).

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
--namespace <value>          internal namespace for the block name
--title <value>              display title for the block and the WordPress plugin
--short-description <value>  short description for the block and the WordPress plugin
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

2. External npm package – it is also possible to select an external npm package as a template.

```bash
$ npx @wordpress/create-block --template my-template-package
```

3. Local template directory – it is also possible to pick a local directory as a template.

```bash
$ npx @wordpress/create-block --template ./path/to/template-directory
```

4. Help – you need to use `npx` to output usage information.

```bash
$ npx @wordpress/create-block --help
```

When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name. In most cases, we recommended pairing blocks with WordPress plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.

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

Are you looking for a way to share your project configuration? Creating an external project template hosted on npm or located in a local directory is possible. These npm packages can provide custom `.mustache` files that replace default files included in the tool for the WordPress plugin or/and the block. It's also possible to override default configuration values used during the scaffolding process.

### Project Template Configuration

Providing the main file (`index.js` by default) for the package that returns a configuration object is mandatory. Several options allow customizing the scaffolding process.

#### `pluginTemplatesPath`

This optional field allows overriding file templates related to **the WordPress plugin shell**. The path points to a location with template files ending with the `.mustache` extension (nested folders are also supported). When not set, the tool uses its own set of templates.

_Example:_

```js
const { join } = require( 'path' );

module.exports = {
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
};
```

#### `blockTemplatesPath`

This optional field allows overriding file templates related to **the individual block**. The path points to a location with template files ending with the `.mustache` extension (nested folders are also supported). When not set, the tool uses its own set of templates.

_Example:_

```js
const { join } = require( 'path' );

module.exports = {
	blockTemplatesPath: join( __dirname, 'block-templates' ),
};
```

#### `assetsPath`

This setting is useful when your template scaffolds a WordPress plugin that uses static assets like images or fonts, which should not be processed. It provides the path pointing to the location where assets are located. They will be copied to the `assets` subfolder in the generated plugin.

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
};
```

The following configurable variables are used with the template files. Template authors can change default values to use when users don't provide their data.

**Project**:

-   `wpScripts` (default: `true`) – enables integration with the `@wordpress/scripts` package and adds common scripts to the `package.json`.
-   `wpEnv` (default: `false`) – enables integration with the `@wordpress/env` package and adds the `env` script to the `package.json`.
-   `customScripts` (default: {}) – the list of custom scripts to add to `package.json` . It also allows overriding default scripts.
-   `npmDependencies` (default: `[]`) – the list of remote npm packages to be installed in the project with [`npm install`](https://docs.npmjs.com/cli/v8/commands/npm-install) when `wpScripts` is enabled.

**Plugin header fields** ([learn more](https://developer.wordpress.org/plugins/plugin-basics/header-requirements/)):

-   `pluginURI` (no default) – the home page of the plugin.
-   `version` (default: `'0.1.0'`) – the current version number of the plugin.
-   `author` (default: `'The WordPress Contributors'`) – the name of the plugin author(s).
-   `license` (default: `'GPL-2.0-or-later'`) – the short name of the plugin’s license.
-   `licenseURI` (default: `'https://www.gnu.org/licenses/gpl-2.0.html'`) – a link to the full text of the license.
-   `domainPath` (no default) – a custom domain path for the translations ([more info](https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/#domain-path)).
-   `updateURI:` (no default) – a custom update URI for the plugin ([related dev note](https://make.wordpress.org/core/2021/06/29/introducing-update-uri-plugin-header-in-wordpress-5-8/)).

**Block metadata** ([learn more](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-metadata/)):

-   `folderName` (default: `.`) – the location for the `block.json` file and other optional block files generated from block templates included in the folder set with the `blockTemplatesPath` setting.
-   `$schema` (default: `https://schemas.wp.org/trunk/block.json`) – the schema URL used for block validation.
-   `apiVersion` (default: `2`) – the block API version ([related dev note](https://make.wordpress.org/core/2020/11/18/block-api-version-2/)).
-   `slug` (no default) – the block slug used for identification in the block name.
-   `namespace` (default: `'create-block'`) – the internal namespace for the block name.
-   `title` (no default) – a display title for your block.
-   `description` (no default) – a short description for your block.
-   `dashicon` (no default) – an icon property thats makes it easier to identify a block ([available values](https://developer.wordpress.org/resource/dashicons/)).
-   `category` (default: `'widgets'`) – blocks are grouped into categories to help users browse and discover them. The categories provided by core are `text`, `media`, `design`, `widgets`, `theme`, and `embed`.
-   `attributes` (no default) – block attributes ([more details](https://developer.wordpress.org/block-editor/developers/block-api/block-attributes/)).
-   `supports` (no default) – optional block extended support features ([more details](https://developer.wordpress.org/block-editor/developers/block-api/block-supports/).
-   `editorScript` (default: `'file:./index.js'`) – an editor script definition.
-   `editorStyle` (default: `'file:./index.css'`) – an editor style definition.
-   `style` (default: `'file:./style-index.css'`) – a frontend and editor style definition.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
