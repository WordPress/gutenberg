
# Code Implementation

The basic block is in place, the next step is to add some style to the block. Feel free to style and adjust for your own preference, the main lesson is showing how to create and load external resources. For this example I'm going to load the colorized gilbert font from [Type with Pride](https://www.typewithpride.com/).

Note: The color may not work with all browsers until they support the proper color font properly, but the font itself still loads and styles. See [colorfonts.wtf](https://www.colorfonts.wtf/) for browser support and details on color fonts.

## Load Font File

I downloaded and extracted the font from the Type with Pride site, and copied it to my plugin directory naming it `gilber-color.otf`. To load the font file, we need to add CSS using standard WordPress enqueue, [see Including CSS & JavaScript documentation](https://developer.wordpress.org/themes/basics/including-css-javascript/).

In the `gutenpride.php` file, the enqueue process is already setup from the generated script, so `editor.css` and `style.css` files are loaded using:

```php
register_block_type( 'create-block/gutenpride', array(
    'editor_script' => 'create-block-gutenpride-block-editor',
    'editor_style'  => 'create-block-gutenpride-block-editor',
    'style'         => 'create-block-gutenpride-block',
) );
```
The `editor_style` and `style` parameters refer to the handles in the `wp_register_style` functions that match the files to the handles.

Note: The `style` CSS will load on both the editor and front-end — published post view — the `editor_style` loads only within the editor, and after the style css.

## Add CSS Style for Block

The style.css will be loaded in both contexts, the editor and the front-end, so we only need to add the style in one spot and it will show while editing and viewing the post.

Edit the style.css to the following, note the classname given to a block is prefixed with `wp-block` and then adds the block name converting any `/` to `-` so in this case the block name `create-block/gutenpride` is converted to the classname `.wp-block-create-block-gutenpride`.

```css
@font-face {
    font-family: Gilbert;
    src: url(gilbert-color.otf);
    font-weight: bold;
}

.wp-block-create-block-gutenpride {
	font-family: Gilbert;
	font-size: 64px;
}
```

With that updated, you can reload the post, for CSS changes you don't need to rebuild, so refresh and if you are using a browser that supports color fonts (Firefox) then you will see it styled.