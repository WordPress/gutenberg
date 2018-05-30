# @wordpress/blob

Wrapper around `jQuery.ajax` to call WordPress REST APIs.

## Installation

Install the module

```bash
npm install @wordpress/api-request --save
```

## Usage

```js
import apiRequest from '@wordpress/api-request';

apiRequest( { path: '/wp/v2/posts' } ).then( posts => {
	console.log( posts );
} );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
