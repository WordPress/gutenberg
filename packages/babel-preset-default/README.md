# Babel Preset Default

Default [Babel](https://babeljs.io/) preset for WordPress development.

The preset includes configuration which enable language features and syntax extensions targeted for support by WordPress. This includes [ECMAScript proposals](https://github.com/tc39/proposals) which have reached [Stage 4 ("Finished")](https://tc39.es/process-document/), as well as the [JSX syntax extension](https://reactjs.org/docs/introducing-jsx.html). For more information, refer to the [JavaScript Coding Guidelines](https://github.com/WordPress/gutenberg/blob/master/docs/contributors/coding-guidelines.md#javascript).

## Installation

Install the module

```bash
npm install @wordpress/babel-preset-default --save-dev
```

### Usage

#### Via .babelrc (Recommended)

```json
{
  "presets": [ "@wordpress/default" ]
}
```

#### Via CLI

```bash
babel script.js --presets @wordpress/default
```

#### Via Node API

```js
require( '@babel/core' ).transform( 'code', {
  presets: [ '@wordpress/default' ]
} );
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
