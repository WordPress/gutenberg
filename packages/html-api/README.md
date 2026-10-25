# HTML API

Reads and edits HTML one token at a time. Anything it is not asked to change stays exactly as it was written. This is a JavaScript port of the [WordPress HTML API](https://developer.wordpress.org/reference/classes/wp_html_tag_processor/), so the editor and the server read HTML the same way.

Offsets count UTF-16 code units, where the PHP version counts bytes.

## Installation

Install the module

```bash
npm install @wordpress/html-api
```

## Usage

```js
import { TagProcessor } from '@wordpress/html-api';

const processor = new TagProcessor( '<p class="intro" data-x>Hello</p>' );
if ( processor.nextTag( 'p' ) ) {
	processor.addClass( 'has-text-align-center' );
}

processor.getUpdatedHtml();
// <p class="intro has-text-align-center" data-x>Hello</p>
```

## Contributing to this package

This is an individual package that's part of the Gutenberg project. The project is organized as a monorepo. It's made up of multiple self-contained software packages, each with a specific purpose. The packages in this monorepo are published to [npm](https://www.npmjs.com/) and used by [WordPress](https://make.wordpress.org/core/) as well as other software projects.

To find out more about contributing to this package or Gutenberg as a whole, please read the project's main [contributor guide](https://github.com/WordPress/gutenberg/tree/HEAD/CONTRIBUTING.md).

<br /><br /><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
