# Disallow private ThemeProvider access (no-private-theme-provider)

Disallows accessing `ThemeProvider` through `@wordpress/theme` private APIs.
`ThemeProvider` is available as a public export and should be imported directly.

The rule only flags `ThemeProvider`. Other private `@wordpress/theme` APIs are
not affected.

## Rule details

Examples of **incorrect** code for this rule:

```js
import { privateApis as themePrivateApis } from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const { ThemeProvider } = unlock( themePrivateApis );
```

```js
import { privateApis as themePrivateApis } from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const ThemeProvider = unlock( themePrivateApis ).ThemeProvider;
```

Examples of **correct** code for this rule:

```js
import { ThemeProvider } from '@wordpress/theme';
```

```js
import { privateApis as themePrivateApis } from '@wordpress/theme';
import { unlock } from '../../lock-unlock';

const { useThemeProviderStyles } = unlock( themePrivateApis );
```
