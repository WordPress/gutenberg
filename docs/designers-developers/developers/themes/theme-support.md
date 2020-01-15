# Theme Support

The new Blocks include baseline support in all themes, enhancements to opt-in to and the ability to extend and customize.

There are a few new concepts to consider when building themes:

- **Editor Color Palette** - A default set of colors is provided, but themes can register their own and optionally lock users into picking from the defined palette.
- **Editor Text Size Palette** - A default set of sizes is provided, but themes can register their own and optionally lock users into picking from preselected sizes.
- **Responsive Embeds** - Themes must opt-in to responsive embeds.
- **Frontend & Editor Styles** - To get the most out of blocks, theme authors will want to make sure Core styles look good and opt-in, or write their own styles to best fit their theme.
- **Dark Mode** - If a Theme is a Dark Theme with a dark background containing light text, the theme author can opt-in to the Dark Mode.

By default, blocks provide their styles to enable basic support for blocks in themes without any change. They also [provide opt-in opinonated styles](#default-block-styles). Themes can add/override these styles, or they can provide no styles at all, and rely fully on what the blocks provide.

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

## Default block styles

Core blocks include default styles. The styles are enqueued for editing but are not enqueued for viewing unless the theme opts-in to the core styles. If you'd like to use default styles in your theme, add theme support for `wp-block-styles`:

```php
add_theme_support( 'wp-block-styles' );
```

### Wide Alignment:

Some blocks such as the image block have the possibility to define a "wide" or "full" alignment by adding the corresponding classname to the block's wrapper ( `alignwide` or `alignfull` ). A theme can opt-in for this feature by calling:

```php
add_theme_support( 'align-wide' );
```

For more information about this function, see [the developer docs on `add_theme_support()`](https://developer.wordpress.org/reference/functions/add_theme_support/).

### Wide Alignments and Floats

It can be difficult to create a responsive layout that accommodates wide images, a sidebar, a centered column, and floated elements that stay within that centered column.

The block editor adds additional markup to floated images to make styling them easier.

Here's the markup for an `Image` with a caption:

```html
<figure class="wp-block-image">
	<img src="..." alt="" width="200px" />
	<figcaption>Short image caption.</figcaption>
</figure>
```

Here's the markup for a left-floated image:

```html
<div class="wp-block-image">
	<figure class="alignleft">
		<img src="..." alt="" width="200px" />
		<figcaption>Short image caption.</figcaption>
	</figure>
</div>
```

Here's an example using the above markup to achieve a responsive layout that features a sidebar, wide images, and floated elements with bounded captions: https://codepen.io/joen/pen/zLWvrW.

### Block Color Palettes

Different blocks have the possibility of customizing colors. The block editor provides a default palette, but a theme can overwrite it and provide its own:

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

`name` is a human-readable label (demonstrated above) that appears in the tooltip and provides a meaningful description of the color to users. It is especially important for those who rely on screen readers or would otherwise have difficulty perceiving the color. `slug` is a unique identifier for the color and is used to generate the CSS classes used by the block editor color palette. `color` is the hexadecimal code to specify the color.

Some colors change dynamically — such as "Primary" and "Secondary" color — such as in the Twenty Nineteen theme and cannot be described programmatically. In spite of that, it is still advisable to provide meaningful `name`s for at least the default values when applicable.

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

The class name is built appending 'has-', followed by the class name _using_ kebab case and ending with the context name.

### Block Gradient Presets

Different blocks have the possibility of selecting from a list of predefined gradients. The block editor provides a default gradient presets, but a theme can overwrite them and provide its own:

```php
add_theme_support(
	'__experimental-editor-gradient-presets',
	array(
		array(
			'name'     => __( 'Vivid cyan blue to vivid purple', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
			'slug'     => 'vivid-cyan-blue-to-vivid-purple'
		),
		array(
			'name'     => __( 'Vivid green cyan to vivid cyan blue', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(0,208,132,1) 0%,rgba(6,147,227,1) 100%)',
			'slug'     =>  'vivid-green-cyan-to-vivid-cyan-blue',
		),
		array(
			'name'     => __( 'Light green cyan to vivid green cyan', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
			'slug'     => 'light-green-cyan-to-vivid-green-cyan',
		),
		array(
			'name'     => __( 'Luminous vivid amber to luminous vivid orange', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
			'slug'     => 'luminous-vivid-amber-to-luminous-vivid-orange',
		),
		array(
			'name'     => __( 'Luminous vivid orange to vivid red', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
			'slug'     => 'luminous-vivid-orange-to-vivid-red',
		),
	)
);
```

`name` is a human-readable label (demonstrated above) that appears in the tooltip and provides a meaningful description of the gradient to users. It is especially important for those who rely on screen readers or would otherwise have difficulty perceiving the color. `gradient` is a CSS value of a gradient applied to a background-image of the block. Details of valid gradient types can be found in the [mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Images/Using_CSS_gradients). `slug` is a unique identifier for the gradient and is used to generate the CSS classes used by the block editor.


### Block Font Sizes:

Blocks may allow the user to configure the font sizes they use, e.g., the paragraph block. The block provides a default set of font sizes, but a theme can overwrite it and provide its own:

```php
add_theme_support( 'editor-font-sizes', array(
	array(
		'name' => __( 'Small', 'themeLangDomain' ),
		'size' => 12,
		'slug' => 'small'
	),
	array(
		'name' => __( 'Regular', 'themeLangDomain' ),
		'size' => 16,
		'slug' => 'regular'
	),
	array(
		'name' => __( 'Large', 'themeLangDomain' ),
		'size' => 36,
		'slug' => 'large'
	),
	array(
		'name' => __( 'Huge', 'themeLangDomain' ),
		'size' => 50,
		'slug' => 'huge'
	)
) );
```

The font sizes are rendered on the font size picker in the order themes provide them.

Themes are responsible for creating the classes that apply the correct font size styles.
The class name is built appending 'has-', followed by the font size name _using_ kebab case and ending with `-font-size`.

As an example for the regular font size, a theme may provide the following class.

```css
.has-regular-font-size {
	font-size: 16px;
}
```

**Note:** The slugs `default` and `custom` are reserved and cannot be used by themes.

### Disabling custom font sizes

Themes can disable the ability to set custom font sizes with the following code:

```php
add_theme_support('disable-custom-font-sizes');
```

When set, users will be restricted to the default sizes provided in the block editor or the sizes provided via the `editor-font-sizes` theme support setting.

### Disabling custom colors in block Color Palettes

By default, the color palette offered to blocks allows the user to select a custom color different from the editor or theme default colors.

Themes can disable this feature using:

```php
add_theme_support( 'disable-custom-colors' );
```

This flag will make sure users are only able to choose colors from the `editor-color-palette` the theme provided or from the editor default colors if the theme did not provide one.

## Editor styles

The block editor supports the theme's [editor styles](https://codex.wordpress.org/Editor_Style), however it works a little differently than in the classic editor.

In the classic editor, the editor stylesheet is loaded directly into the iframe of the WYSIWYG editor, with no changes. The block editor, however, doesn't use iframes. To make sure your styles are applied only to the content of the editor, we automatically transform your editor styles by selectively rewriting or adjusting certain CSS selectors. This also allows the block editor to leverage your editor style in block variation previews.

For example, if you write `body { ... }` in your editor style, this is rewritten to `.editor-styles-wrapper { ... }`.  This also means that you should _not_ target any of the editor class names directly.

Because it works a little differently, you need to opt-in to this by adding an extra snippet to your theme, in addition to the add_editor_style function:

```php
add_theme_support('editor-styles');
```

You shouldn't need to change your editor styles too much; most themes can add the snippet above and get similar results in the classic editor and inside the block editor.

### Dark backgrounds

If your editor style relies on a dark background, you can add the following to adjust the color of the UI to work on dark backgrounds:

```php
add_theme_support( 'editor-styles' );
add_theme_support( 'dark-editor-style' );
```

Note you don't need to add `add_theme_support( 'editor-styles' );` twice, but that rule does need to be present for the `dark-editor-style` rule to work.

### Enqueuing the editor style

Use the `add_editor_style` function to enqueue and load CSS on the editor screen. For the classic editor, this was the only function needed to add style to the editor. For the new block editor, you first need to `add_theme_support( 'editor-styles');` mentioned above.

```php
add_editor_style( 'style-editor.css' );
```

Adding that to your `functions.php` file will add the stylesheet `style-editor.css` to the queue of stylesheets to be loaded in the editor.

### Basic colors

You can style the editor like any other webpage. Here's how to change the background color and the font color to blue:

```css
/* Add this to your `style-editor.css` file */
body {
	background-color: #d3ebf3;
	color: #00005d;
}
```

### Changing the width of the editor

To change the main column width of the editor, add the following CSS to `style-editor.css`:

```css
/* Main column width */
.wp-block {
	max-width: 720px;
}

/* Width of "wide" blocks */
.wp-block[data-align="wide"] {
	max-width: 1080px;
}

/* Width of "full-wide" blocks */
.wp-block[data-align="full"] {
	max-width: none;
}
```

You can use those editor widths to match those in your theme. You can use any CSS width unit, including `%` or `px`.

Further reading: [Applying Styles with Stylesheets](/docs/designers-developers/developers/tutorials/block-tutorial/applying-styles-with-stylesheets.md).

## Responsive embedded content

The embed blocks automatically apply styles to embedded content to reflect the aspect ratio of content that is embedded in an iFrame. A block styled with the aspect ratio responsive styles would look like:

```html
<figure class="wp-embed-aspect-16-9 wp-has-aspect-ratio">...</figure>
```

To make the content resize and keep its aspect ratio, the `<body>` element needs the `wp-embed-responsive` class. This is not set by default, and requires the theme to opt in to the `responsive-embeds` feature:

```php
add_theme_support( 'responsive-embeds' );
```
