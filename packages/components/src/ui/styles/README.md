# styles

## The `ui` object

The primary API that `styles` exposes is the `ui` object. It contains the following properties:

- `get`: Retrieves a pre-defined set of CSS Custom Properties. See [Theme Configuration](#theme-configuration) below.
- `tokens`: A pre-defined set of theme variables, accessible via the frozen `tokens` object. See [Theme Tokens](#theme-tokens) below.
- Various mixins. See [Mixins](#mixins) below.

## Theme Configuration

Each of the configs declares overrides for the theme variables. The overall list of available theme variables is declared in [`styles/theme/config.js`](./theme/config.js). Individual overrides can be found in [`styles/theme/dark-mode-config.js`](./theme/dark-mode-config.js), [`styles/theme/high-contrast-mode-config.js`](./theme/high-contrast-mode-config.js), and [`styles/theme/dark-high-contrast-mode-config.js`](./theme/dark-high-contrast-mode-config.js).

Variables added to the overarching config should align with variables declared in the `base-styles` package.

These variables are accessed via the `ui.get` helper exported from `styles` and are exposed as CSS Custom Properties.

## Theme Tokens

Tokens are similar to variables except that they are not exposed as CSS Custom Properties. This is to avoid introducing too many new public APIs. Instead, we simply access them off of the `ui.tokens` object as you would any normal JavaScript object. `ui.tokens` is a _frozen_ object so runtime changes are no allowed to it, updates to it must be constant and done in the [`styles/tokens.js`](./tokens.js) module.

## Mixins

Mixins are helper functions for composing and building styles.

### `space`

`space` is the core of the style system's spacing system. It will automatically transform a given space value into the correct spacing for the theme based off the token `gridBase` value. It can accept any number value.

### `flow`

Combines CSS values. Useful for complex shorthand values,  functions (e.g. calc()), and mixed string/JS values.


```js
const boxShadow = flow(
	'0 1px',
	get( 'gray900' ),
	'2px',
	get('gray400')
)
```

#### Combining groups

Groups (`Array<string>`) can be passed into `flow()`, which re combined and comma separated. Useful for compounded CSS values (e.g. box-shadow`).

```js
const boxShadow = flow( [
	'0 1px',
	get( 'gray900' ),
	'2px',
	get( 'gray400' )
], [
	'0 10px',
	get( 'gray900' ),
	'20px',
	get( 'gray300' )
] );
```
