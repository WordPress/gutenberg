# Workflow

Workflow palette for running abilities in WordPress. This package is private and should not be used directly.

## Installation

Install the module:

```bash
npm install @wordpress/workflow --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

The workflow palette provides a searchable interface for discovering and executing abilities registered with the `@wordpress/abilities` package.

### Opening the Palette

The workflow palette can be opened using the keyboard shortcut `Cmd+J` (or `Ctrl+J` on Windows/Linux).

### Features

- **Search and filter abilities** - Type to filter the list of available abilities
- **Execute abilities** - Select an ability to execute it
- **View output** - See the results of ability execution in a formatted view
- **Keyboard navigation** - Navigate with arrow keys, Enter to execute, ESC/Backspace/Delete to go back

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
