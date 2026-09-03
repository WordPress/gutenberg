# No Non-Module Stylesheet Imports (no-non-module-stylesheet-imports)

Non-module stylesheets imported from JavaScript are injected at runtime,
bypassing the package stylesheet bundle. This can duplicate styles, omit them
from the enqueued stylesheet, and skip build-time processing such as RTL
generation.

Use a package stylesheet entry point, such as `src/style.scss`, for non-module
stylesheets. CSS modules may still be imported from JavaScript.

## Rule details

Examples of **incorrect** code for this rule:

```js
import './style.scss';
```

```js
import styles from './style.css';
```

Examples of **correct** code for this rule:

```scss
@use './components/example/style.scss' as *;
```

```js
import styles from './style.module.css';
```

```js
import './style.module.css';
```
