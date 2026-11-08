# Disallow translation functions in block save methods (no-i18n-in-save)

Translation functions should never be used in block `save` functions or `save.js` files.

## Rule details

This rule aims to prevent the use of i18n translation functions (`__`, `_x`, `_n`, `_nx`) in block save methods.

### Why?

When translation functions are used in save methods:

1. Translation is saved to the database: The translated text is stored at the time of saving, not when the content is displayed
2. No dynamic updates: If the site language changes, previously saved content will not update
3. Block validation errors: Switching languages causes validation errors because the saved HTML no longer matches what the save function generates
4. Content locked to language: Content becomes permanently associated with the language active at save time

### What to do instead

- For static text: Use plain English text that PHP can replace during rendering
- For dynamic labels: Use block attributes and let PHP handle translation during rendering
- For user content: Store as attributes and render/translate in PHP

## Examples

### Incorrect

```js
// ❌ Translation in save function
function save() {
	return (
		<button>
			<span>{ __( 'Click me', 'my-plugin' ) }</span>
		</button>
	);
}
```

```js
// ❌ Translation in arrow function save
const save = () => {
	return __( 'Hello World' );
};
```

```js
// ❌ Translation in object method
const settings = {
	save() {
		return _x( 'Label', 'context' );
	},
};
```

### Correct

```js
// ✅ No translation in save, handled by PHP
function save() {
	return (
		<button>
			<span>Click me</span>
		</button>
	);
}
```

```js
// ✅ Translation in edit function
function edit() {
	return (
		<button>
			<span>{ __( 'Click me', 'my-plugin' ) }</span>
		</button>
	);
}
```

```js
// ✅ Use attributes and let PHP translate
function save( { attributes } ) {
	return (
		<button>
			<span>{ attributes.label }</span>
		</button>
	);
}
```

## When not to use

Consider carefully before disabling this rule. In most cases, the better fix is to refactor the block to avoid translation in save altogether. If you have a genuine edge case (e.g. a migration block that must preserve previously saved translated strings), prefer one of these alternatives instead:

1. Using a render callback in PHP to handle translation
2. Storing translatable content in block attributes
3. Using static text that PHP replaces during rendering

## Further Reading

- [Block API Reference](https://developer.wordpress.org/block-editor/reference-guides/block-api/)
- [Internationalization in WordPress](https://developer.wordpress.org/apis/internationalization/)
