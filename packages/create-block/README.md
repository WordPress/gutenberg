# Create Block

Create Block is an officially supported way to create blocks for registering a block for a WordPress plugin. It offers a modern build setup with no configuration. It generates PHP, JS, CSS code, and everything else you need to start the project.

It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community.

## Description

Blocks are the fundamental element of the WordPress block editor. They are the primary way in which plugins and themes can register their own functionality and extend the capabilities of the editor.

Visit the [Gutenberg handbook](https://developer.wordpress.org/block-editor/developers/block-api/block-registration/) to learn more about Block API.

## Quick start

You just need to provide the `slug` which is the target location for scaffolded files and the internal block name.
  ```bash
  $ npm init @wordpress/block todo-list
  $ cd todo-list
  $ npm start
  ```

  _(requires `node` version `10.0.0` or above, and `npm` version `6.1.0` or above)_

You don’t need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on the code.

## Usage

The following command generates PHP, JS and CSS code for registering a block.

```bash
$ npm init @wordpress/block [options] [slug]
```

`[slug]` is optional. When provided it triggers the quick mode where it is used as the block slug used for its identification, the output location for scaffolded files, and the name of the WordPress plugin. The rest of the configuration is set to all default values.

Options:
```bash
-t, --template <name>  template type name, allowed values: "es5", "esnext" (default: "esnext")
-V, --version          output the version number
-h, --help             output usage information
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

## Available Commands

Inside that bootstrapped directory _(it doesn't apply to `es5` template)_, you can run several commands:

```bash
$ npm start
```
Starts the build for development. [Learn more](/packages/scripts#start).

```bash
$ npm run build
```
Builds the code for production. [Learn more](/packages/scripts#build).

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

## WP-CLI

Another way of making a developer’s life easier is to use [WP-CLI](https://wp-cli.org), which provides a command-line interface for many actions you might perform on the WordPress instance. One of the commands `wp scaffold block` was used as the baseline for this tool and ES5 template in particular.

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
