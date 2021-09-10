# Primitives

Primitives to be used cross-platform.

## Installation

Install the module

```bash
npm install @wordpress/primitives --save
```

## Usage

```js
import { SVG, Path } from '@wordpress/primitives';

const myElement = (
	<SVG
		width="18"
		height="18"
		viewBox="0 0 18 18"
		xmlns="http://www.w3.org/2000/svg"
	>
		<Path d="M4.5 9l5.6-5.7 1.4 1.5L7.3 9l4.2 4.2-1.4 1.5L4.5 9z" />
	</SVG>
);
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for ES2015+ such as IE browsers then using [core-js](https://github.com/zloirock/core-js) will add polyfills for these methods._

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
