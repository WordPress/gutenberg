# Reusable blocks

The reusable blocks module is deprecated. It remains available as a no-op compatibility package so existing imports, script handles, and `core/reusable-blocks` data-store access do not crash.

`ReusableBlocksMenuItems` renders nothing, and the store's selectors and actions (`__experimentalConvertBlockToStatic`, `__experimentalConvertBlocksToReusable`, `__experimentalDeleteReusableBlock`, `__experimentalSetEditingReusableBlock`, `__experimentalIsEditingReusableBlock`) are inert.

Reusable blocks (patterns) are `wp_block` entities, managed through `@wordpress/core-data`. That covers entity operations only; there is no public replacement for the conversion utilities or menu items.

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
