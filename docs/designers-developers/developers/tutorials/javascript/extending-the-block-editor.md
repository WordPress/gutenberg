
## Extending the Block Editor

This puts all the initial pieces in place for you to start extending the Block Editor.

Let's look at using the [Block Style Variation example](../../../../../docs/designers-developers/developers/filters/block-filters/#block-style-variations).

Replace the existing `console.log()` code in your `myguten.js` file with:

```js
wp.blocks.registerBlockStyle( 'core/quote', {
    name: 'fancy-quote',
    label: 'Fancy Quote'
} );
```

After you add the `wp.blocks.registerBlockStyle` code, save the `myguten.js` file, and then create a new post in the Block Editor.

Add a quote block, and in the right sidebar under Styles, you will see your new Fancy Quote style listed. You can go back to the JavaScript and change the label to "Fancy Pants" and reload, and you will see the new label.

Previewing or Publishing the post, you will not see a visible change. However, if you look at the source, you will see `is-style-fancy-quote` class name attached to your quote.

Go ahead and create a `style.css` file with:

```css
.is-style-fancy-quote {
	font-size: 64px;
}

```

and enqueue the CSS by adding the following to your `myguten-plugin.php`:

```php
function myguten_stylesheet() {
	wp_enqueue_style( 'myguten-style', plugins_url( 'style.css', __FILE__ ) );
}
add_action( 'enqueue_block_assets', 'myguten_stylesheet' );
```

And then when you view the page, you will see it in a very large font.
