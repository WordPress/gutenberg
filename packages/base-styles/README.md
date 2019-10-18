# Base Styles

Base SCSS utilities and variables for WordPress.

## Installation

Install the module

```bash
npm install @wordpress/base-styles --save-dev
```

## Use

### SCSS utilities and variables

In your application's SCSS file, include styles like so:

```scss
@import "~@wordpress/base-styles/colors";
@import "~@wordpress/base-styles/variables";
@import "~@wordpress/base-styles/mixins";
@import "~@wordpress/base-styles/breakpoints";
@import "~@wordpress/base-styles/animations";
@import "~@wordpress/base-styles/z-index";
```

### PostCSS themes

To use themes with `@wordpress/postcss-themes`, import them like so:

```js
const { adminColorSchemes } = require( '@wordpress/base-styles' );
const wpPostcss = require( '@wordpress/postcss-themes' )( adminColorSchemes )
```

<br/><br/><p align="center"><img src="https://s.w.org/style/images/codeispoetry.png?1" alt="Code is Poetry." /></p>
