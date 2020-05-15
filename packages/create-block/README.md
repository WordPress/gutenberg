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
  $ npm init @wordpress/block todo-list
  $ cd todo-list
  $ npm start
  ```

_(requires `node` version `10.0.0` or above, and `npm` version `6.9.0` or above)_

You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on the code.

## Usage

The following command generates PHP, JS and CSS code for registering a block.

```bash
$ npm init @wordpress/block [options] [slug]
```

`[slug]` is optional. When provided it triggers the quick mode where it is used as the block slug used for its identification, the output location for scaffolded files, and the name of the WordPress plugin. The rest of the configuration is set to all default values unless overriden with some of the options listed below.

Options:
```
-V, --version                output the version number
-t, --template <name>        template name: "es5", "esnext" or the name of an external npm package  (default: "esnext")
--namespace <value>          internal namespace for the block name
--title <value>              display title for the block
--short-description <value>  short description for the block
--category <name>            category name for the block
-h, --help                   output usage information
```

_Please note that `--version` and `--help` options don't work with `npm init`. You have to use `npx` instead, as presented in the examples._

More examples:

1. Interactive mode - it gives a chance to customize a few most important options before the code gets generated.
  ```bash
  $ npm init @wordpress/block
  ```
2. ES5 template – it is also possible to pick ES5 template when you don't want to deal with a build step (`npm start`) which enables ESNext and JSX support.
  ```bash
  $ npm init @wordpress/block --template es5
  ```
3. Help – you need to use `npx` to output usage information.
  ```bash
  $ npx @wordpress/create-block --help
  ```

When you scaffold a block, you must provide at least a `slug` name, the `namespace` which usually corresponds to either the `theme` or `plugin` name, and the `category`. In most cases, we recommended pairing blocks with plugins rather than themes, because only using plugin ensures that all blocks still work when your theme changes.

## Available Commands [ESNext template]

When bootstraped with the `esnext` templateyou can run several commands inside the directory:

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
Since version 0.12.0 it is possible to use external templates hosted on NPM. These templates need to contain `.mustache` files that will be used in the scaffolding and one `template.json` for the metadata. 

### Available Variables: 
- `namespace`
- `slug`
- `title`
- `textdomain`
- `description`
- `category`
- `dashicon`
- `license`
- `licenseURI`
- `namespaceSnakeCase`
- `slugSnakeCase`

### `template.json`
```json
{
    "defaultValues": {
        "namespace": "create-block",
        "slug": "esnext-example",
        "title": "ESNext Example",
        "description":
            "Example block written with ESNext standard and JSX support – build step required.",
        "dashicon": "smiley",
        "category": "widgets",
        "author": "The WordPress Contributors",
        "license": "GPL-2.0-or-later",
        "licenseURI": "https://www.gnu.org/licenses/gpl-2.0.html",
        "version": "0.1.0"
    },
    "outputFiles": [
        ".editorconfig",
        ".gitignore",
        "editor.css",
        "src/edit.js",
        "src/index.js",
        "src/save.js",
        "$slug.php",
        "style.css",
        "readme.txt"
    ],
    "wpScriptsEnabled": true
}
```

## WP-CLI

Another way of making a developer’s life easier is to use [WP-CLI](https://wp-cli.org), which provides a command-line interface for many actions you might perform on the WordPress instance. One of the commands `wp scaffold block` was used as the baseline for this tool and ES5 template in particular.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
