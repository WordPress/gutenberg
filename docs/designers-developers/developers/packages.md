# Packages

WordPress exposes a list of JavaScript packages and tools for WordPress development.

## Using the Packages via WordPress Global

JavaScript packages are available as a registered script in WordPress and can be accessed using the `wp` global variable.

If you wanted to use the `PlainText` component from the editor module, first you would specify `wp-editor` as a dependency when you enqueue your script:

```php
wp_enqueue_script(
	'my-custom-block',
	plugins_url( $block_path, __FILE__ ),
	array( 'wp-blocks', 'wp-editor', 'wp-element', 'wp-i18n' )
);
```

After the dependency is declared, you can access the module in your JavaScript code using the global `wp` like so:
```js
const { PlainText } = wp.editor;

```

## Using the Packages via npm

All the packages are also available on [npm](https://www.npmjs.com/org/wordpress) if you want to bundle them in your code.

Using the same `PlainText` example, you would install the block editor module with npm:

```bash
npm install @wordpress/block-editor --save
```

Once installed, you can access the component in your code using:

```js
import { PlainText }  from '@wordpress/block-editor';
```

