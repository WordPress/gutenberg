# No Non-Module Stylesheet Imports (no-non-module-stylesheet-imports)

A non-module stylesheet imported from a Storybook file is injected into the preview document and stays there after you leave the story.

Story-only styles should be a CSS module. Package styles load through a matcher in `storybook/package-styles/config.js`. Imports that use `?raw`, `?inline`, or `?url` do not inject a stylesheet, so they are allowed.

## Rule details

Examples of **incorrect** code for this rule:

```js
import './style.css';
```

```js
import styles from './style.scss';
```

```js
import '../style.scss';
```

```js
import '@wordpress/dataviews/build-style/style.css';
```

```js
import styles from '@wordpress/components/build-style/style.css';
```

```js
import( '@wordpress/dataviews/build-style/style.css' );
```

```js
export * from '@wordpress/dataviews/build-style/style.css';
```

Examples of **correct** code for this rule:

```js
import styles from './style.module.css';
```

```js
import './style.module.css';
```

```js
import sheet from '@wordpress/block-library/build-style/style.css?raw';
```

```js
import '@wordpress/components/build-style/style.css?inline';
```

```js
import sheetUrl from '@wordpress/components/build-style/style.css?url';
```

```js
import local from './style.lazy.scss?inline';
```
