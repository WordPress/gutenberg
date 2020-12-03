# Code Implementation

The basic block is in place, the next step is to add styles to the block. Feel free to style and adjust for your own preference, the main lesson is showing how to create and load external resources. For this example we're going to load the colorized gilbert font from [Type with Pride](https://www.typewithpride.com/).

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

After updating, reload the post and refresh the browser. If you are using a browser that supports color fonts (Firefox) then you will see it styled.

## Use Sass for Style (optional)

The wp-scripts package provides support for using the Sass/Scss languages, to generate CSS, added in @wordpress/scripts v9.1.0. See the [Sass language site](https://sass-lang.com/) to learn more about Sass.

To use Sass, you need to import a `editor.scss` or `style.scss` in the `index.js` JavaScript file and it will build and output the generated file in the build directory. Note: You need to update the enqueing functions in PHP to load from the correct location.

If you're not already running `npm run start` in your terminal, it would be helpful to do so now so that your code will build as you're making changes to your `index.js` and `style.scss` files inside the `src` folder. 

Add the following imports to **index.js**:

```js
import './style.scss';
import './editor.scss';

import Edit from './edit';
import save from './save';
```

Like in the CSS file above, the same styles need to be added to the `style.scss` inside the `src` folder, changing the source of the font file as follows: 

```css
@font-face {
	font-family: Gilbert;
	src: url( ../gilbert-color.otf );
	font-weight: bold;
}

.wp-block-create-block-gutenpride {
	font-family: Gilbert;
	font-size: 64px;
}
```

Once your terminal attempts to compile the above code, you will get an error. 

```
ERROR in ./src/style.scss 1:0
Module parse failed: Unexpected character '@' (1:0)
You may need an appropriate loader to handle this file type, currently no loaders are configured to process this file. See https://webpack.js.org/concepts#loaders

```

This error is caused by the `otf` file which webpack is not set up to load. In order to do so we will need to install a loader from npm and create a [custom webpack configuration](https://developer.wordpress.org/block-editor/packages/packages-scripts/#provide-your-own-webpack-config) that will extend the webpack configuration built into @wordpress/scripts. 

In your terminal, install[`file-loader`](https://webpack.js.org/loaders/file-loader/). 

`npm install file-loader --save-dev`

Next, create a `webpack.config.js` file in the main folder of your plugin. 

Copy the following code to configure webpack for the otf font file. 

```JS
const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
	...defaultConfig,
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /\.(otf)$/,
				use: "file-loader"
			}
		],
	},
};
```

Now your `gilbert-color.otf` file should compile properly with no errors. 

If that's the case, update **gutenpride.php** to enqueue your styles from the generated file location by updating the value of the `$editor_css` and `$style_css` variables with the path to the newly built files in the build folder: 

```php
$editor_css = "build/index.css";
```
```php
$style_css = 'build/style-index.css';
```

Check to see if your CSS is loading correctly with your new .otf font in your WP installation. Remember to check a browser with [otf support](https://www.colorfonts.wtf/), such as Firefox, to see the colours.

Next Section: [Authoring Experience](/docs/designers-developers/developers/tutorials/create-block/author-experience.md)
