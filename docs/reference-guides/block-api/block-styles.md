# Styles

Block Styles allow alternative styles to be applied to existing blocks. They work by adding a className to the block's wrapper. This className can be used to provide an alternative styling for the block if the block style is selected. See the [Getting Started with JavaScript tutorial](/docs/how-to-guides/javascript/) for a full example.

_Example:_

```js
wp.blocks.registerBlockStyle( 'core/quote', {
	name: 'fancy-quote',
	label: 'Fancy Quote',
} );
```

The example above registers a block style named `fancy-quote` to the `core/quote` block. When the user selects this block style from the styles selector, an `is-style-fancy-quote` className will be added to the block's wrapper.

By adding `isDefault: true` you can mark the registered block style as the one that is recognized as active when no custom class name is provided. It also means that there will be no custom class name added to the HTML output for the style that is marked as default.

To remove a block style use `wp.blocks.unregisterBlockStyle()`.

_Example:_

```js
wp.blocks.unregisterBlockStyle( 'core/quote', 'large' );
```

The above removes the block style named `large` from the `core/quote` block.

**Important:** When unregistering a block style, there can be a [race condition](https://en.wikipedia.org/wiki/Race_condition) on which code runs first: registering the style, or unregistering the style. You want your unregister code to run last. The way to do that is specify the component that is registering the style as a dependency, in this case `wp-edit-post`. Additionally, using `wp.domReady()` ensures the unregister code runs once the dom is loaded.

Enqueue your JavaScript with the following PHP code:

```php
function myguten_enqueue() {
	wp_enqueue_script(
		'myguten-script',
		plugins_url( 'myguten.js', __FILE__ ),
		array( 'wp-blocks', 'wp-dom-ready', 'wp-edit-post' ),
		filemtime( plugin_dir_path( __FILE__ ) . '/myguten.js' )
	);
}
add_action( 'enqueue_block_editor_assets', 'myguten_enqueue' );
```

The JavaScript code in `myguten.js`:

```js
wp.domReady( function () {
	wp.blocks.unregisterBlockStyle( 'core/quote', 'large' );
} );
```

## Server-side registration helper

While the samples provided do allow full control of block styles, they do require a considerable amount of code.

To simplify the process of registering and unregistering block styles, two server-side functions are also available: `register_block_style`, and `unregister_block_style`.

### register_block_style

The `register_block_style` function receives the name of the block as the first argument and an array describing properties of the style as the second argument.

The properties of the style array must include `name` and `label`:

-   `name`: The identifier of the style used to compute a CSS class.
-   `label`: A human-readable label for the style.

Besides the two mandatory properties, the styles properties array should also include an `inline_style` or a `style_handle` property:

-   `inline_style`: Contains inline CSS code that registers the CSS class required for the style.
-   `style_handle`: Contains the handle to an already registered style that should be enqueued in places where block styles are needed.

It is also possible to set the `is_default` property to `true` to mark one of the block styles as the default one.

The following code sample registers a style for the quote block named "Blue Quote", and provides an inline style that makes quote blocks with the "Blue Quote" style have blue color:

```php
register_block_style(
    'core/quote',
    array(
        'name'         => 'blue-quote',
        'label'        => __( 'Blue Quote', 'textdomain' ),
        'inline_style' => '.wp-block-quote.is-style-blue-quote { color: blue; }',
    )
);
```

Alternatively, if a stylesheet was already registered which contains the CSS for the block style, it is possible to just pass the stylesheet's handle so `register_block_style` function will make sure it is enqueue.

The following code sample provides an example of this use case:

```php
wp_register_style( 'myguten-style', get_template_directory_uri() . '/custom-style.css' );

// ...

register_block_style(
    'core/quote',
    array(
        'name'         => 'fancy-quote',
        'label'        => __( 'Fancy Quote', 'textdomain' )
        'style_handle' => 'myguten-style',
    )
);
```

### unregister_block_style

`unregister_block_style` allows unregistering a block style previously registered on the server using `register_block_style`.

The function's first argument is the registered name of the block, and the name of the style as the second argument.

The following code sample unregisters the style named 'fancy-quote' from the quote block:

```php
unregister_block_style( 'core/quote', 'fancy-quote' );
```

**Important:** The function `unregister_block_style` only unregisters styles that were registered on the server using `register_block_style`. The function does not unregister a style registered using client-side code.
