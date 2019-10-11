# Base styles

Base scss utilities and variables for WordPress.

## Installation

Install the module

```bash
npm install @wordpress/base-styles --save-dev
```

## Use

### Scss utilities and variables

In your application's scss file, include styles like so:

```scss
@import "~@wordpress/base-styles/colors";
@import "~@wordpress/base-styles/variables";
@import "~@wordpress/base-styles/mixins";
@import "~@wordpress/base-styles/breakpoints";
@import "~@wordpress/base-styles/animations";
@import "~@wordpress/base-styles/z-index";
```

### Post-CSS themes

To use themes with `@wordpress/postcss-themes`, import them like so:

```js
const themes = require( '@wordpress/base-styles/themes' );
const wpPostcss = require( '@wordpress/postcss-themes' )( themes )
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
