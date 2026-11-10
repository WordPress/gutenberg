# Template Inheritance

The parts of the templates inside templates experiment that the editor loads as a script module: the field naming the template a template is rendered inside. This package is private and should not be used directly.

## Usage

The fields of the experiment are registered in PHP, by `lib/experimental/block-template-parent.php`, with the Entity fields API. That registration names this package's script module, `@wordpress/template-inheritance`, for the parts of the fields that cannot be serialized: their `Edit` and `render` components and their `getValue` and `setValue` callbacks. The editor imports the module when it needs the fields, and merges each entry of its default export into the field with the same id.

The package exists apart from `@wordpress/core-fields`, which holds the fields core registers, so that nothing of the experiment ships with core.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
