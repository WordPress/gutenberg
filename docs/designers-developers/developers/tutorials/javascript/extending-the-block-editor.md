
## Extending the Block Editor

This puts all the initial pieces in place for you to start extending the Block Editor.

Let's look at using the [Block Style Variation example](../../../../../docs/designers-developers/developers/filters/block-filters.md#block-style-variations).

Replace the existing `console.log()` code in your `myguten.js` file with:

```js
wp.blocks.registerBlockStyle( 'core/quote', {
    name: 'fancy-quote',
    label: 'Fancy Quote'
} );
```

**Important:** Notice that you are using a function from `wp.blocks` package. This means you must specify it as a dependency when you enqueue the script. Update the `myguten-plugin.php` file to:

```php
<?php
/*
Plugin Name: Fancy Quote
*/

function myguten_enqueue() {
	wp_enqueue_script( 'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks')
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

The last argument in the `wp_enqueue_script()` function is an array of dependencies. WordPress makes available its  packages under the wp namespace. In the example, you use `wp.blocks` to access the items the blocks package exports, in this case the `registerBlockStyle()` function.

See [Packages](../../../../../docs/designers-developers/developers/packages.md) for list of available packages and what objects they export.

After you have updated both JavaScript and PHP file, go to the Block Editor and create a new post.

Add a quote block, and in the right sidebar under Styles, you will see your new Fancy Quote style listed. You can go back to the JavaScript and change the label to "Fancy Pants" and reload, and you will see the new label. Click to select and apply that style to your quote block.


![Fancy Quote Style in Inspector](../../../../../docs/designers-developers/developers/tutorials/javascript/fancy-quote-in-inspector.png)


If you Preview or Publish the post, you will not see a visible change. However, if you look at the source, you will see the `is-style-fancy-quote` class name attached to your quote.

Let's add some style. Go ahead and create a `style.css` file with:

```css
.is-style-fancy-quote {
	color: tomato;
}

```

You enqueue the CSS by adding the following to your `myguten-plugin.php`:

```php
function myguten_stylesheet() {
	wp_enqueue_style( 'myguten-style', plugins_url( 'style.css', __FILE__ ) );
}
add_action( 'enqueue_block_assets', 'myguten_stylesheet' );
```

Now a quote block with your fancy quote style applied, when you viewed in the editor and published, you will see it in a beautiful tomato color.

![Fancy Quote with Style](../../../../../docs/designers-developers/developers/tutorials/javascript/fancy-quote-with-style.png)
