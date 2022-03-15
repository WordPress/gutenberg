# Code Implementation

The basic block is in place, the next step is to add styles to the block. Feel free to style and adjust for your own preference, the main lesson is showing how to create and load external resources. For this example we're going to load the colorized gilbert font from [Type with Pride](https://www.typewithpride.com/).

Note: The color may not work with all browsers until they support the proper color font properly, but the font itself still loads and styles. See [colorfonts.wtf](https://www.colorfonts.wtf/) for browser support and details on color fonts.

## Load Font File

Download and extract the font from the Type with Pride site, and copy it in the `assets` directory of your plugin naming it `gilbert-color.otf`. To load the font file, we need to add CSS using standard WordPress enqueue, [see Including CSS & JavaScript documentation](https://developer.wordpress.org/themes/basics/including-css-javascript/).

In the `gutenpride.php` file, the enqueue process is already setup from the generated script, so `index.css` and `style-index.css` files are loaded using:

```php
function create_block_gutenpride_block_init() {
	register_block_type( __DIR__ );
}
add_action( 'init', 'create_block_gutenpride_block_init' );
```

This function checks the `block.json` file for js and css files, and will pass them on to [enqueue](https://developer.wordpress.org/themes/basics/including-css-javascript/) these files, so they are loaded on the appropriate pages.

The `build/index.css` is compiled from `src/editor.scss` and loads only within the editor, and after the `style-index.css`.
The `build/style-index.css` is compiled from `src/style.scss` and loads in both the editor and front-end — published post view.

## Add CSS Style for Block

We only need to add the style to `build/style-index.css` since it will show while editing and viewing the post. Edit the `src/style.scss` to add the following.

Note: the block classname is prefixed with `wp-block`. The `create-block/gutenpride` is converted to the classname `.wp-block-create-block-gutenpride`.

```scss
@font-face {
	font-family: Gilbert;
	src: url( ../assets/gilbert-color.otf );
	font-weight: 700;
}

.wp-block-create-block-gutenpride {
	font-family: Gilbert, sans-serif;
	font-size: 64px;
}
```

After updating, rebuild the block using `npm run build` then reload the post and refresh the browser. If you are using a browser that supports color fonts (Firefox) then you will see it styled.

Next Section: [Authoring Experience](/docs/getting-started/create-block/author-experience.md)
