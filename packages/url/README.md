# URL

A collection of utilities to manipulate URLs.

## Installation

Install the module

```bash
npm install @wordpress/url --save
```

## Usage

```JS
import { isURL, addQueryArgs, prependHTTP } from '@wordpress/url';

// Checks if the argument looks like a URL
const isURL = isURL( 'https://wordpress.org' ); // true

// Appends arguments to the query string of a given url
const newURL = addQueryArgs( 'https://google.com', { q: 'test' } ); // https://google.com/?q=test

// Prepends 'http://' to URLs that are probably mean to have them
const actualURL = prependHTTP( 'wordpress.org' ); // http://wordpress.org
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
