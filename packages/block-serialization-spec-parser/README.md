# Block Serialization Spec Parser

This library contains the grammar file (`grammar.pegjs`) for WordPress posts which is a block serialization [_specification_](https://github.com/WordPress/gutenberg/tree/HEAD/docs/contributors/grammar.md) which is used to generate the actual _parser_ which is also bundled in this package.

PEG parser generators are available in many languages, though different libraries may require some translation of this grammar into their syntax. For more information see:

-   [PEG.js](https://pegjs.org)
-   [Parsing expression grammar](https://en.wikipedia.org/wiki/Parsing_expression_grammar)

## Installation

Install the module

```bash
npm install @wordpress/block-serialization-spec-parser --save
```

## Usage

```js
import { parse } from '@wordpress/block-serialization-spec-parser';

parse( '<!-- wp:core/more --><!--more--><!-- /wp:core/more -->' );
// [{"attrs": null, "blockName": "core/more", "innerBlocks": [], "innerHTML": "<!--more-->"}]
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
