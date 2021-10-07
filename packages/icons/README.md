# Icons

WordPress Icons Library.

## Installation

Install the module:

```bash
npm install @wordpress/icons --save
```

_This package assumes that your code will run in an **ES2015+** environment. If you're using an environment that has limited or no support for such language features and APIs, you should include [the polyfill shipped in `@wordpress/babel-preset-default`](https://github.com/WordPress/gutenberg/tree/HEAD/packages/babel-preset-default#polyfill) in your code._

## Usage

```js
import { Icon, check } from '@wordpress/icons';

<Icon icon={ check } />;
```

## Props

| Name   | Type      | Default | Description             |
| ------ | --------- | ------- | ----------------------- |
| `size` | `integer` | `24`    | Size of icon in pixels. |

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
