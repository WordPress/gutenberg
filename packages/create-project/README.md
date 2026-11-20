# Create Project

Create Project is an **officially supported tool for scaffolding WordPress projects** including plugins, themes, and blocks. It generates PHP, JS, CSS code, and everything you need to start modern WordPress development with no configuration required.

_It is largely inspired by [create-react-app](https://create-react-app.dev/docs/getting-started) and extends the functionality of [@wordpress/create-block](https://github.com/WordPress/gutenberg/tree/HEAD/packages/create-block). Major kudos to [@gaearon](https://github.com/gaearon), the whole Facebook team, and the React community._

> **Create Project is the unified scaffolding tool for modern WordPress development**. Whether you're building a plugin, theme, or custom blocks, this tool provides everything you need with modern build tooling and best practices built-in.

> _Learn more about [WordPress development at the Developer Handbook](https://developer.wordpress.org/)._

## Quick start

```bash
# Create a plugin
$ npx @wordpress/create-project@latest my-plugin --type=plugin
$ cd my-plugin
$ npm start

# Create a theme
$ npx @wordpress/create-project@latest my-theme --type=theme
$ cd my-theme
$ npm start

# Create a standalone block
$ npx @wordpress/create-project@latest my-block --type=block
```

The `slug` provided defines the folder name for the scaffolded project and the internal identification. WordPress plugins and themes generated must be installed manually in your WordPress installation.

_(requires `node` version `20.10.0` or above, and `npm` version `10.2.3` or above)_

## Usage

The `create-project` command generates a project with PHP, JS, and CSS code for WordPress development.

```bash
$ npx @wordpress/create-project@latest [options] [slug]
```

### Interactive Mode

When no `slug` is provided, the script will run in interactive mode and will start prompting for the input required (project type, slug, title, namespace...) to scaffold the project.

### Project Types

Create Project supports three main project types:

#### Plugin (`--type=plugin`)
- Creates a complete WordPress plugin structure
- Includes modern build setup with `@wordpress/scripts`
- Optional block integration with `--with-blocks`
- Generates `plugin.php`, `readme.txt`, and all necessary files

#### Theme (`--type=theme`)
- Creates a complete WordPress theme structure
- Includes `style.css`, `functions.php`, `index.php` and theme templates
- Modern build setup for JavaScript and CSS
- Optional block integration with `--with-blocks`
- Full Gutenberg/block editor support

#### Block (`--type=block`)
- Creates a standalone block for integration into existing plugins or themes
- Generates `block.json`, JavaScript, and CSS files
- **Attributes configuration** - define block props with name, type, and default value
- **Interactive prompts** - easy setup for block data structure during creation
- Ready to be registered in any WordPress project

### Options

```bash
-V, --version                output the version number
-t, --template <name>        project template type name; allowed values: "standard" (default), "es5", the name of an external npm package, or the path to a local directory
--variant                    choose a variant as defined by the template
--type <type>                project type; allowed values: "plugin", "theme", "block" (default: "plugin")
--with-blocks                include block scaffolding for plugins/themes
--target-dir <directory>     the directory where the files will be scaffolded, defaults to the slug
--namespace <value>          internal namespace for the block name
--title <value>              display title for the project
--short-description <value>  short description for the project
--category <name>            category name for blocks
--wp-scripts                 enable integration with `@wordpress/scripts` package
--no-wp-scripts              disable integration with `@wordpress/scripts` package
--wp-env                     enable integration with `@wordpress/env` package
--textdomain <value>         text domain for internationalization
-h, --help                   output usage information
```

#### `--type`

Specify the type of WordPress project to create:

```bash
$ npx @wordpress/create-project@latest my-plugin --type=plugin
$ npx @wordpress/create-project@latest my-theme --type=theme
$ npx @wordpress/create-project@latest my-block --type=block
```

#### `--with-blocks`

Add custom block scaffolding to plugins or themes:

```bash
$ npx @wordpress/create-project@latest my-plugin --type=plugin --with-blocks
$ npx @wordpress/create-project@latest my-theme --type=theme --with-blocks
```

#### `--template`

This argument specifies an _external npm package_ as a template:

```bash
$ npx @wordpress/create-project@latest --template my-template-package
```

This argument also allows to pick a _local directory_ as a template:

```bash
$ npx @wordpress/create-project@latest --template ./path/to/template-directory
```

#### `--variant`

With this argument, `create-project` will generate a [dynamic block](https://developer.wordpress.org/block-editor/getting-started/glossary/#dynamic-block) based on the built-in template:

```bash
$ npx @wordpress/create-project@latest --variant dynamic
```

#### `--wp-env`

With this argument, the `create-project` package will add configuration for [`wp-env` package](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-env/) for local development:

```bash
$ npx @wordpress/create-project@latest --wp-env
```

## Project Structure Examples

### Plugin Structure
```
my-plugin/
├── plugin.php              # Main plugin file with registration
├── readme.txt              # Plugin readme for WordPress.org
├── src/
│   ├── index.js            # JavaScript entry point
│   └── index.scss          # Main stylesheet
├── blocks/                 # Custom blocks (if --with-blocks)
│   └── my-block/
│       ├── block.json
│       ├── edit.js
│       ├── save.js
│       └── style.scss
├── build/                  # Compiled assets
├── package.json
└── .gitignore
```

### Theme Structure
```
my-theme/
├── style.css              # Main theme stylesheet with header
├── functions.php          # Theme functions and setup
├── index.php              # Main template file
├── src/
│   ├── index.js          # JavaScript entry point
│   └── index.scss        # Theme styles
├── blocks/               # Custom blocks (if --with-blocks)
│   └── my-block/
│       ├── block.json
│       ├── edit.js
│       ├── save.js
│       └── style.scss
├── build/                # Compiled assets
├── package.json
└── .gitignore
```

### Block Structure
```
my-block/
├── block.json            # Block metadata
├── edit.js              # Block editor component
├── save.js              # Block save function
├── style.scss           # Block styles
├── editor.scss          # Editor-only styles
└── view.js              # Frontend JavaScript
```

## Available commands in the scaffolded project

The plugin/theme folder created when executing this command is a node package with a modern build setup that requires no configuration.

A set of scripts is available from inside that folder (provided by the `@wordpress/scripts` package):

_Note: You don't need to install or configure tools like [webpack](https://webpack.js.org), [Babel](https://babeljs.io) or [ESLint](https://eslint.org) yourself. They are preconfigured and hidden so that you can focus on coding._

### Development Scripts

```bash
$ npm start              # Starts the build for development
$ npm run build         # Builds the code for production
$ npm run format        # Formats files
$ npm run lint:css      # Lints CSS files
$ npm run lint:js       # Lints JavaScript files
$ npm run plugin-zip    # Creates a zip file (plugins)
$ npm run packages-update # Updates WordPress packages
```

### Local Development

If you used the `--wp-env` flag:

```bash
$ npx wp-env start      # Start local WordPress environment
$ npx wp-env stop       # Stop local WordPress environment
```

## Features

- **Multi-project support**: Create plugins, themes, or standalone blocks
- **Modern build setup**: Powered by `@wordpress/scripts` with webpack, Babel, and ESLint
- **Block integration**: Add custom blocks to any project type
- **Template system**: Support for variants and external templates
- **Local development**: Optional `@wordpress/env` integration
- **Best practices**: Follows WordPress coding standards and modern development practices
- **Fully customizable**: Extensive configuration options and template system

## External Project Templates

Create Project supports the same external template system as `@wordpress/create-block`. [Click here](https://developer.wordpress.org/block-editor/reference-guides/packages/packages-create-block/packages-create-block-external-template/) for information on External Project Templates.

Additionally, templates can now specify separate template paths for plugins, themes, and blocks:

```js
module.exports = {
	pluginTemplatesPath: join( __dirname, 'plugin-templates' ),
	themeTemplatesPath: join( __dirname, 'theme-templates' ),
	blockTemplatesPath: join( __dirname, 'block-templates' ),
	// ... other configuration
};
```

## Migration from @wordpress/create-block

Create Project is fully compatible with existing `@wordpress/create-block` usage. All existing commands and templates continue to work:

```bash
# These commands are equivalent:
$ npx @wordpress/create-block my-block
$ npx @wordpress/create-project my-block --type=plugin --with-blocks

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
