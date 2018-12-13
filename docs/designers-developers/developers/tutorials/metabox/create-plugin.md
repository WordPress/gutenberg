
### Create Plugin

To extend the editor, you first need to create a plugin to hold your code. Go ahead and create a new directory in `wp-content/plugins/` called `myguten-meta-block`. Inside the directory create the file `myguten-meta-block.php` with the contents:

```php
<?php
/*
Plugin Name: Meta Block Plugin
*/

function myguten_enqueue() {
	wp_enqueue_script( 'myguten-script',
		plugins_url( 'meta-block.js', __FILE__ )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

This will load the `meta-block.js` file when the editor loads.
You can stub out the file by creating `meta-block.js` and simply include a debug line.

```js
console.log( "I'm loaded!" );
```

Load your `wp-admin/plugins.php` page and activate your new plugin.

Create a new post in the block editor and you will see the log message in your browser's console log.

