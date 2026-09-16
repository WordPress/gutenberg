# No Storybook Build Style Imports (no-storybook-build-style-imports)

Package `build-style` stylesheets imported from Storybook stories as a Vite
side effect are injected into the preview document. Add a matcher in
`storybook/package-styles/config.js` (and a `*.lazy.scss` wrapper if the
package is missing), then drop this import.

## Rule details

Examples of **incorrect** code for this rule:

```js
import '@wordpress/dataviews/build-style/style.css';
```

```js
import styles from '@wordpress/components/build-style/style.css';
```

```js
import( '@wordpress/dataviews/build-style/style.css' );
```

Examples of **correct** code for this rule:

```js
{
	componentIdMatcher: /^widget-dashboard-/,
	ltr: [ componentsLtr, dataviewsLtr, commandsLtr ],
	rtl: [ componentsRtl, dataviewsRtl, commandsRtl ],
}
```

```js
import sheet from '@wordpress/block-library/build-style/style.css?raw';
```

```js
import '@wordpress/components/build-style/style.css?inline';
```

```js
import styles from './style.module.css';
```

```js
import './style.css';
```
