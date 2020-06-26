# Code Implementation

The basic block is in place, the next step is to add styles to the block. Feel free to style and adjust for your own preference, the main lesson is showing how to create and load external resources. For this example I'm going to load the colorized gilbert font from [Type with Pride](https://www.typewithpride.com/).

Note: The color may not work with all browsers until they support the proper color font properly, but the font itself still loads and styles. See [colorfonts.wtf](https://www.colorfonts.wtf/) for browser support and details on color fonts.

## Load Font File

Download and extract the font from the Type with Pride site, and copy it to your plugin directory naming it `gilbert-color.otf`. To load the font file, we need to add CSS using standard WordPress enqueue, [see Including CSS & JavaScript documentation](https://developer.wordpress.org/themes/basics/including-css-javascript/).

In the `gutenpride.php` file, the enqueue process is already setup from the generated script, so `editor.css` and `style.css` files are loaded using:

```php
register_block_type( 'create-block/gutenpride', array(
    'editor_script' => 'create-block-gutenpride-block-editor',
    'editor_style'  => 'create-block-gutenpride-block-editor',
    'style'         => 'create-block-gutenpride-block',
) );
```

The `editor_style` and `style` parameters refer to the files that match the handles in the `wp_register_style` functions.

Note: the `editor_style` loads only within the editor, and after the `style`. The `style` CSS loads in both the editor and front-end — published post view.

## Add CSS Style for Block

We only need to add the style to `style.css` since it will show while editing and viewing the post. Edit the style.css to add the following.

Note: the block classname is prefixed with `wp-block`. The `create-block/gutenpride` is converted to the classname `.wp-block-create-block-gutenpride`.

```css
@font-face {
	font-family: Gilbert;
	src: url( gilbert-color.otf );
	font-weight: bold;
}

.wp-block-create-block-gutenpride {
	font-family: Gilbert;
	font-size: 64px;
}
```

After updating, reload the post and refresh the brwoser. If you are using a browser that supports color fonts (Firefox) then you will see it styled.

## Use Sass for Style (optional)

The wp-scripts package provides support for using the Sass/Scss languages, to generate CSS, added in @wordpress/scripts v9.1.0. See the [Sass language site](https://sass-lang.com/) to learn more about Sass.

To use Sass, you need to import a `editor.scss` or `style.scss` in the `index.js` JavaScript file and it will build and output the generated file in the build directory. Note: You need to update the enqueing functions in PHP to load from the correct location.

Add the following imports to **index.js**:

```js
import '../editor.scss';

import Edit from './edit';
import save from './save';
```

Update **gutenpride.php** to enqueue from generated file location:

```php
$editor_css = "build/index.css";
```

Next Section: [Authoring Experience](author-experience.md)
