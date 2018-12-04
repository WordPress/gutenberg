# Packages

Gutenberg exposes a list of JavaScript packages and tools for WordPress development.

## Using the packages via WordPress global

JavaScript packages are available as a registered script in WordPress and can be accessed using the `wp` global variable.

For example, to use the PlainText component from the editor module:

First, you need to specify `wp-editor` as a dependency when you enqueue your script
```
wp_enqueue_script(
	'my-custom-block',
	plugins_url( $block_path, __FILE__ ),
	array( 'wp-blocks', 'wp-editor', 'wp-element', 'wp-i18n' )
);
```

After the dependency is declared, you can access the module using the global `wp` like so:
```
const { PlainText } = wp.editor;

```

## Using the packages via npm

All the packages are also available on [npm](https://www.npmjs.com/org/wordpress) if you want to bundle them in your code.

Using the same PlainText example, you would install using:

```
npm install @wordpress/editor --save
```

Once installed, you can access the component in your code using:

```
import { PlainText }  from '@wordpress/editor';
```

