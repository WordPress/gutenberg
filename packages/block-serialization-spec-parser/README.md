# Block Serialization Spec Parser

This library contains the grammar file (`grammar.pegjs`) for WordPress posts which is a block serialization _specification_ which is used to generate the actual _parser_ which is also bundled in this package.

PEG parser generators are available in many languages, though different libraries may require some translation of this grammar into their syntax. For more information see:
* https://pegjs.org
* https://en.wikipedia.org/wiki/Parsing_expression_grammar

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

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
