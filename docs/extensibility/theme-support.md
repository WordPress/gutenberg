# Theme Support

By default, blocks provide their styles to enable basic support for blocks in themes without any change. Themes can add/override these styles, or they can provide no styles at all, and rely fully on what the blocks provide.

Some advanced block features require opt-in support in the theme itself as it's difficult for the block to provide these styles, they may require some architecting of the theme itself, in order to work well.

To opt-in for one of these features, call `add_theme_support` in the `functions.php` file of the theme. For example:

```php
function mytheme_setup_theme_supported_features() {
	add_theme_support( 'editor-color-palette', array(
		array(
			'name' => __( 'strong magenta', 'themeLangDomain' ),
			'slug' => 'strong-magenta',
			'color' => '#a156b4',
		),
		array(
			'name' => __( 'light grayish magenta', 'themeLangDomain' ),
			'slug' => 'light-grayish-magenta',
			'color' => '#d0a5db',
		),
		array(
			'name' => __( 'very light gray', 'themeLangDomain' ),
			'slug' => 'very-light-gray',
			'color' => '#eee',
		),
		array(
			'name' => __( 'very dark gray', 'themeLangDomain' ),
			'slug' => 'very-dark-gray',
			'color' => '#444',
		),
	) );
}

add_action( 'after_setup_theme', 'mytheme_setup_theme_supported_features' );
```

## Opt-in features

### Wide Alignment:

Some blocks such as the image block have the possibility to define a "wide" or "full" alignment by adding the corresponding classname to the block's wrapper ( `alignwide` or `alignfull` ). A theme can opt-in for this feature by calling:

```php
add_theme_support( 'align-wide' );
```

### Wide Alignments and Floats

It can be difficult to create a responsive layout that accommodates wide images, a sidebar, a centered column, and floated elements that stay within that centered column.

Gutenberg adds additional markup to floated images to make styling them easier.

Here's the markup for an `Image` with a caption:

```html
<figure class="wp-block-image">
	<img src="..." alt="" width="200px">
	<figcaption>Short image caption.</figcaption>
</figure>
```

Here's the markup for a left-floated image:

```html
<div class="wp-block-image">
	<figure class="alignleft">
		<img src="..." alt="" width="200px">
		<figcaption>Short image caption.</figcaption>
	</figure>
</div>
```

Here's an example using the above markup to achieve a responsive layout that features a sidebar, wide images, and floated elements with bounded captions: https://codepen.io/joen/pen/zLWvrW.

### Block Color Palettes

Different blocks have the possibility of customizing colors. Gutenberg provides a default palette, but a theme can overwrite it and provide its own:

```php
add_theme_support( 'editor-color-palette', array(
	array(
		'name' => __( 'strong magenta', 'themeLangDomain' ),
		'slug' => 'strong-magenta',
		'color' => '#a156b4',
	),
	array(
		'name' => __( 'light grayish magenta', 'themeLangDomain' ),
		'slug' => 'light-grayish-magenta',
		'color' => '#d0a5db',
	),
	array(
		'name' => __( 'very light gray', 'themeLangDomain' ),
		'slug' => 'very-light-gray',
		'color' => '#eee',
	),
	array(
		'name' => __( 'very dark gray', 'themeLangDomain' ),
		'slug' => 'very-dark-gray',
		'color' => '#444',
	),
) );
```

The colors will be shown in order on the palette, and there's no limit to how many can be specified.

Themes are responsible for creating the classes that apply the colors in different contexts. Core blocks use "color" and "background-color" contexts. So to correctly apply "strong magenta" to all contexts of core blocks a theme should implement the following classes:

```css
.has-strong-magenta-background-color {
	background-color: #313131;
}

.has-strong-magenta-color {
	color: #f78da7;
}
```

The class name is built appending 'has-', followed by the class name *using* kebab case and ending with the context name.

### Block Font Sizes:

Blocks may allow the user to configure the font sizes they use, e.g., the paragraph block. Gutenberg provides a default set of font sizes, but a theme can overwrite it and provide its own:


```php
add_theme_support( 'editor-font-sizes', array(
	array(
		'name' => __( 'small', 'themeLangDomain' ),
		'shortName' => __( 'S', 'themeLangDomain' ),
		'size' => 12,
		'slug' => 'small'
	),
	array(
		'name' => __( 'regular', 'themeLangDomain' ),
		'shortName' => __( 'M', 'themeLangDomain' ),
		'size' => 16,
		'slug' => 'regular'
	),
	array(
		'name' => __( 'large', 'themeLangDomain' ),
		'shortName' => __( 'L', 'themeLangDomain' ),
		'size' => 36,
		'slug' => 'large'
	),
	array(
		'name' => __( 'larger', 'themeLangDomain' ),
		'shortName' => __( 'XL', 'themeLangDomain' ),
		'size' => 50,
		'slug' => 'larger'
	)
) );
```

The font sizes are rendered on the font size picker in the order themes provide them.

Themes are responsible for creating the classes that apply the correct font size styles.
The class name is built appending 'has-', followed by the font size name *using* kebab case and ending with `-font-size`.

As an example for the regular font size, a theme may provide the following class.

```css
.has-regular-font-size {
    font-size: 16px;
}
```

### Disabling custom colors in block Color Palettes

By default, the color palette offered to blocks, allows the user to select a custom color different from the editor or theme default colors.
Themes can disable this feature using:
```php
add_theme_support( 'disable-custom-colors' );
```

This flag will make sure users are only able to choose colors from the `editor-color-palette` the theme provided or from the editor default colors if the theme did not provide one.

## Editor styles

Gutenberg supports the theme's [editor styles](https://codex.wordpress.org/Editor_Style). This support is opt-in because these styles are applied differently from the classic editor.

 - In the classic editor, the stylesheet is applied as is in the iframe of the post content editor.
 - Since Gutenberg doesn't make use of iFrames, this is not possible. Instead Gutenberg wrap all the provided styles with `.editor-block-list__block` to avoid leaking styles outside the editor's content area.

This technique should allow the editor styles to work properly in both editors in most cases.

Enabling editor styles support is done using:

```php
add_theme_support( 'editor-styles' );
```

Alternatively, a theme can provide a stylesheet that will change the editor's appearance entirely. You can use this to change colors, fonts, and any other visual aspect of the editor.

### Add the stylesheet

The first thing to do is to create a new stylesheet file in your theme directory. We'll assume the file is named `style-editor.css`.

Next, load your newly-created editor stylesheet in your theme:

```php
/**
 * Enqueue block editor style
 */
function mytheme_block_editor_styles() {
	wp_enqueue_style( 'mytheme-block-editor-styles', get_theme_file_uri( '/style-editor.css' ), false, '1.0', 'all' );
}

add_action( 'enqueue_block_editor_assets', 'mytheme_block_editor_styles' );
```

If your editor style relies on a dark background, you can add the following to adjust the color of the UI to work on dark backgrounds:

```php
add_theme_support( 'editor-styles' );
add_theme_support( 'dark-editor-style' );
```

Note you don't need to add `add_theme_support( 'editor-styles' );` twice, but that rule does need to be present for the `dark-editor-style` rule to work.

### Basic colors

You can style the editor like any other webpage. Here's how to change the background color and the font color to blue:

```css
/* Add this to your `style-editor.css` file */
body.gutenberg-editor-page {
	background-color: #d3ebf3;
	color: #00005d;
}
```

### Changing the width of the editor

To change the main column width of the editor, add the following CSS to `style-editor.css`:

```css
/* Main column width */
body.gutenberg-editor-page .editor-post-title__block,
body.gutenberg-editor-page .editor-default-block-appender,
body.gutenberg-editor-page .editor-block-list__block {
	max-width: 720px;
}

/* Width of "wide" blocks */
body.gutenberg-editor-page .editor-block-list__block[data-align="wide"] {
	max-width: 1080px;
}

/* Width of "full-wide" blocks */
body.gutenberg-editor-page .editor-block-list__block[data-align="full"] {
	max-width: none;
}
```

You can use those editor widths to match those in your theme. You can use any CSS width unit, including `%` or `px`.

Further reading: [Applying Styles with Stylesheets](https://wordpress.org/gutenberg/handbook/blocks/applying-styles-with-stylesheets/).

## Default block styles

Core blocks include default styles. The styles are enqueued for editing but are not enqueued for viewing unless the theme opts-in to the core styles. If you'd like to use default styles in your theme, add theme support for `wp-block-styles`:

```php
add_theme_support( 'wp-block-styles' );
```
