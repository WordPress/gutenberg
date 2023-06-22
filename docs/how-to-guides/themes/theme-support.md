# Theme Support

The new Blocks include baseline support in all themes, enhancements to opt-in to and the ability to extend and customize.

There are a few new concepts to consider when building themes:

-   **Editor Color Palette** - A default set of colors is provided, but themes can register their own and optionally lock users into picking from the defined palette.
-   **Editor Text Size Palette** - A default set of sizes is provided, but themes can register their own and optionally lock users into picking from preselected sizes.
-   **Responsive Embeds** - Themes must opt-in to responsive embeds.
-   **Frontend & Editor Styles** - To get the most out of blocks, theme authors will want to make sure Core styles look good and opt-in, or write their own styles to best fit their theme.
-   **Block Tools** - Themes can opt-in to several block tools like line height, custom units.
-   **Core Block Patterns** - Themes can opt-out of the default block patterns.

By default, blocks provide their styles to enable basic support for blocks in themes without any change. They also [provide opt-in opinionated styles](#default-block-styles). Themes can add/override these styles, or they can provide no styles at all, and rely fully on what the blocks provide.

Some advanced block features require opt-in support in the theme itself as it's difficult for the block to provide these styles, they may require some architecting of the theme itself, in order to work well.

To opt-in for one of these features, call `add_theme_support` in the `functions.php` file of the theme. For example:

```php
function mytheme_setup_theme_supported_features() {
	add_theme_support( 'editor-color-palette', array(
		array(
			'name'  => esc_attr__( 'strong magenta', 'themeLangDomain' ),
			'slug'  => 'strong-magenta',
			'color' => '#a156b4',
		),
		array(
			'name'  => esc_attr__( 'light grayish magenta', 'themeLangDomain' ),
			'slug'  => 'light-grayish-magenta',
			'color' => '#d0a5db',
		),
		array(
			'name'  => esc_attr__( 'very light gray', 'themeLangDomain' ),
			'slug'  => 'very-light-gray',
			'color' => '#eee',
		),
		array(
			'name'  => esc_attr__( 'very dark gray', 'themeLangDomain' ),
			'slug'  => 'very-dark-gray',
			'color' => '#444',
		),
	) );
}

add_action( 'after_setup_theme', 'mytheme_setup_theme_supported_features' );
```

## Opt-in features

## Default block styles

Core blocks include default structural styles. These are loaded in both the editor and the front end by default. An example of these styles is the CSS that powers the columns block. Without these rules, the block would result in a broken layout containing no columns at all.

The block editor allows themes to opt-in to slightly more opinionated styles for the front end. An example of these styles is the default color bar to the left of blockquotes. If you'd like to use these opinionated styles in your theme, add theme support for `wp-block-styles`:

```php
add_theme_support( 'wp-block-styles' );
```

You can see the CSS that will be included in the [block library theme file](https://github.com/WordPress/gutenberg/blob/trunk/packages/block-library/src/theme.scss).

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

Here's an example [codepen](https://codepen.io/joen/pen/zLWvrW) using the above markup to achieve a responsive layout that features a sidebar, wide images, and floated elements with bounded captions.

### Block Color Palettes

Different blocks have the possibility of customizing colors. The block editor provides a default palette, but a theme can overwrite it and provide its own:

```php
add_theme_support( 'editor-color-palette', array(
	array(
		'name'  => esc_attr__( 'strong magenta', 'themeLangDomain' ),
		'slug'  => 'strong-magenta',
		'color' => '#a156b4',
	),
	array(
		'name'  => esc_attr__( 'light grayish magenta', 'themeLangDomain' ),
		'slug'  => 'light-grayish-magenta',
		'color' => '#d0a5db',
	),
	array(
		'name'  => esc_attr__( 'very light gray', 'themeLangDomain' ),
		'slug'  => 'very-light-gray',
		'color' => '#eee',
	),
	array(
		'name'  => esc_attr__( 'very dark gray', 'themeLangDomain' ),
		'slug'  => 'very-dark-gray',
		'color' => '#444',
	),
) );
```

`name` is a human-readable label (demonstrated above) that appears in the tooltip and provides a meaningful description of the color to users. It is especially important for those who rely on screen readers or would otherwise have difficulty perceiving the color. `slug` is a unique identifier for the color and is used to generate the CSS classes used by the block editor color palette. `color` is the hexadecimal code to specify the color.

Some colors change dynamically — such as "Primary" and "Secondary" color — such as in the Twenty Nineteen theme and cannot be described programmatically. In spite of that, it is still advisable to provide meaningful `name`s for at least the default values when applicable.

The colors will be shown in order on the palette, and there's no limit to how many can be specified.

Themes are responsible for creating the classes that apply the colors in different contexts. Core blocks use "color", "background-color", and "border-color" contexts. So to correctly apply "strong magenta" to all contexts of core blocks a theme should implement the classes itself. The class name is built appending 'has-', followed by the class name _using_ kebab case and ending with the context name.

```css
.has-strong-magenta-color {
	color: #a156b4;
}

.has-strong-magenta-background-color {
	background-color: #a156b4;
}

.has-strong-magenta-border-color {
	border-color: #a156b4;
}
```

Starting in WordPress 5.9, to override color values defined by core, themes without a `theme.json` have to set their values via CSS Custom Properties instead of providing the classes. The CSS Custom Properties use the following naming `--wp--preset--color--<slug>`. See more info in [this devnote](https://make.wordpress.org/core/2022/01/08/updates-for-settings-styles-and-theme-json/). For example:

```css
:root {
	--wp--preset--color--cyan-bluish-gray: <new_value>;
	--wp--preset--color--pale-pink: <new_value>;
}
```

### Block Gradient Presets

Different blocks have the possibility of selecting from a list of predefined gradients. The block editor provides a default gradient presets, but a theme can overwrite them and provide its own:

```php
add_theme_support(
	'editor-gradient-presets',
	array(
		array(
			'name'     => esc_attr__( 'Vivid cyan blue to vivid purple', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(6,147,227,1) 0%,rgb(155,81,224) 100%)',
			'slug'     => 'vivid-cyan-blue-to-vivid-purple'
		),
		array(
			'name'     => esc_attr__( 'Vivid green cyan to vivid cyan blue', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(0,208,132,1) 0%,rgba(6,147,227,1) 100%)',
			'slug'     =>  'vivid-green-cyan-to-vivid-cyan-blue',
		),
		array(
			'name'     => esc_attr__( 'Light green cyan to vivid green cyan', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgb(122,220,180) 0%,rgb(0,208,130) 100%)',
			'slug'     => 'light-green-cyan-to-vivid-green-cyan',
		),
		array(
			'name'     => esc_attr__( 'Luminous vivid amber to luminous vivid orange', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(252,185,0,1) 0%,rgba(255,105,0,1) 100%)',
			'slug'     => 'luminous-vivid-amber-to-luminous-vivid-orange',
		),
		array(
			'name'     => esc_attr__( 'Luminous vivid orange to vivid red', 'themeLangDomain' ),
			'gradient' => 'linear-gradient(135deg,rgba(255,105,0,1) 0%,rgb(207,46,46) 100%)',
			'slug'     => 'luminous-vivid-orange-to-vivid-red',
		),
	)
);
```

`name` is a human-readable label (demonstrated above) that appears in the tooltip and provides a meaningful description of the gradient to users. It is especially important for those who rely on screen readers or would otherwise have difficulty perceiving the color. `gradient` is a CSS value of a gradient applied to a background-image of the block. Details of valid gradient types can be found in the [mozilla documentation](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Images/Using_CSS_gradients). `slug` is a unique identifier for the gradient and is used to generate the CSS classes used by the block editor.

Themes are responsible for creating the classes that apply the gradients. So to correctly apply "Vivid cyan blue to vivid purple" a theme should implement the following class:

```css
.has-vivid-cyan-blue-to-vivid-purple-gradient-background {
	background: linear-gradient(
		135deg,
		rgba( 6, 147, 227, 1 ) 0%,
		rgb( 155, 81, 224 ) 100%
	);
}
```

Starting in WordPress 5.9, to override gradient values defined by core, themes without a `theme.json` have to set their values via CSS Custom Properties instead of providing the classes. The CSS Custom Properties use the following naming `--wp--preset--gradient--<slug>`. See more info in [this devnote](https://make.wordpress.org/core/2022/01/08/updates-for-settings-styles-and-theme-json/). For example:

```css
:root {
	--wp--preset--gradient--vivid-cyan-blue-to-vivid-purple: <new_value>;
	--wp--preset--gradient--light-green-cyan-to-vivid-green-cyan: <new_value>;
}
```

### Block Font Sizes

Blocks may allow the user to configure the font sizes they use, e.g., the paragraph block. The block provides a default set of font sizes, but a theme can overwrite it and provide its own:

```php
add_theme_support( 'editor-font-sizes', array(
	array(
		'name' => esc_attr__( 'Small', 'themeLangDomain' ),
		'size' => 12,
		'slug' => 'small'
	),
	array(
		'name' => esc_attr__( 'Regular', 'themeLangDomain' ),
		'size' => 16,
		'slug' => 'regular'
	),
	array(
		'name' => esc_attr__( 'Large', 'themeLangDomain' ),
		'size' => 36,
		'slug' => 'large'
	),
	array(
		'name' => esc_attr__( 'Huge', 'themeLangDomain' ),
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

<div class="callout callout-info">
<strong>Note:</strong> The slugs `default` and `custom` are reserved and cannot be used by themes.
</div>

Starting in WordPress 5.9, to override font size values defined by core, themes without a `theme.json` have to set their values via CSS Custom Properties instead of providing the classes. The CSS Custom Properties use the following naming `--wp--preset--font-size--<slug>`. See more info in [this devnote](https://make.wordpress.org/core/2022/01/08/updates-for-settings-styles-and-theme-json/). For example:

```css
:root {
	--wp--preset--font-size--small: <new_value>;
	--wp--preset--font-size--large: <new_value>;
}
```

### Disabling custom font sizes

Themes can disable the ability to set custom font sizes with the following code:

```php
add_theme_support( 'disable-custom-font-sizes' );
```

When set, users will be restricted to the default sizes provided in the block editor or the sizes provided via the `editor-font-sizes` theme support setting.

### Disabling custom colors in block Color Palettes

By default, the color palette offered to blocks allows the user to select a custom color different from the editor or theme default colors.

Themes can disable this feature using:

```php
add_theme_support( 'disable-custom-colors' );
```

This flag will make sure users are only able to choose colors from the `editor-color-palette` the theme provided or from the editor default colors if the theme did not provide one.

### Disabling custom gradients

Themes can disable the ability to set a custom gradient with the following code:

```php
add_theme_support( 'disable-custom-gradients' );
```

When set, users will be restricted to the default gradients provided in the block editor or the gradients provided via the `editor-gradient-presets` theme support setting.

### Disabling base layout styles

_**Note:** Since WordPress 6.1._

Themes can opt out of generated block layout styles that provide default structural styles for core blocks including Group, Columns, Buttons, and Social Icons. By using the following code, these themes commit to providing their own structural styling, as using this feature will result in core blocks displaying incorrectly in both the editor and site frontend:

```php
add_theme_support( 'disable-layout-styles' );
```

For themes looking to customize `blockGap` styles or block spacing, see [the developer docs on Global Settings & Styles](/docs/how-to-guides/themes/theme-json/#what-is-blockgap-and-how-can-i-use-it).

### Supporting custom line heights

Some blocks like paragraph and headings support customizing the line height. Themes can enable support for this feature with the following code:

```php
add_theme_support( 'custom-line-height' );
```

### Support custom units

In addition to pixels, users can use other units to define sizes, paddings... The available units are: px, em, rem, vh, vw. Themes can disable support for this feature with the following code:

```php
add_theme_support( 'custom-units', array() );
```

Themes can also filter the available custom units.

```php
add_theme_support( 'custom-units', 'rem', 'em' );
```

### Disabling the default block patterns.

WordPress comes with a number of block patterns built-in, themes can opt-out of the bundled patterns and provide their own set using the following code:

```php
remove_theme_support( 'core-block-patterns' );
```

## Editor styles

The block editor supports the theme's [editor styles](https://codex.wordpress.org/Editor_Style), however it works a little differently than in the classic editor.

In the classic editor, the editor stylesheet is loaded directly into the iframe of the WYSIWYG editor, with no changes. The block editor, however, doesn't use iframes. To make sure your styles are applied only to the content of the editor, we automatically transform your editor styles by selectively rewriting or adjusting certain CSS selectors. This also allows the block editor to leverage your editor style in block variation previews.

For example, if you write `body { ... }` in your editor style, this is rewritten to `.editor-styles-wrapper { ... }`. This also means that you should _not_ target any of the editor class names directly.

Because it works a little differently, you need to opt-in to this by adding an extra snippet to your theme, in addition to the add_editor_style function:

```php
add_theme_support( 'editor-styles' );
```

You shouldn't need to change your editor styles too much; most themes can add the snippet above and get similar results in the classic editor and inside the block editor.

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
.wp-block[data-align='wide'] {
	max-width: 1080px;
}

/* Width of "full-wide" blocks */
.wp-block[data-align='full'] {
	max-width: none;
}
```

You can use those editor widths to match those in your theme. You can use any CSS width unit, including `%` or `px`.

Further reading: [Applying Styles with Stylesheets](/docs/how-to-guides/block-tutorial/applying-styles-with-stylesheets.md).

## Responsive embedded content

The embed blocks automatically apply styles to embedded content to reflect the aspect ratio of content that is embedded in an iFrame. A block styled with the aspect ratio responsive styles would look like:

```html
<figure class="wp-embed-aspect-16-9 wp-has-aspect-ratio">...</figure>
```

To make the content resize and keep its aspect ratio, the `<body>` element needs the `wp-embed-responsive` class. This is not set by default, and requires the theme to opt in to the `responsive-embeds` feature:

```php
add_theme_support( 'responsive-embeds' );
```

## Spacing control

Some blocks can have padding controls. This is off by default, and requires the theme to opt in by declaring support:

```php
add_theme_support( 'custom-spacing' );
```

## Link color control

Link support has been made stable as part of WordPress 5.8. It's `false` by default and themes can enable it via the [theme.json file](./theme-json.md):

```json
{
	"version": 1,
	"settings": {
		"color": {
			"link": true
		}
	}
}
```

> Alternatively, with the Gutenberg plugin active, the old legacy support `add_theme_support( 'experimental-link-color' )` would also work. This fallback would be removed when the Gutenberg plugin requires WordPress 5.9 as the minimum version.

When the user sets the link color of a block, a new style will be added in the form of:

```css
.wp-elements-<uuid> a {
	color: <link-color> !important;
}
```

where

- `<uuid>` is a random number
- `<link-color>` is either `var(--wp--preset--color--slug)` (if the user selected a preset value) or a raw color value (if the user selected a custom value)

The block will get attached the class `.wp-elements-<uuid>`.

## Appearance Tools

Use this setting to enable the following Global Styles settings:

- border: color, radius, style, width
- color: link
- spacing: blockGap, margin, padding
- typography: lineHeight

```php
add_theme_support( 'appearance-tools' );
```

## Border

Use this to enable all border settings:

```php
add_theme_support( 'border' );
```

## Link color

Use this to enable the link color setting:

```php
add_theme_support( 'link-color' );
```

## Block Based Template Parts

Block Based Template parts allow administrators to edit parts of the site using blocks. This is off by default, and requires the theme to opt in by declaring support:

```php
add_theme_support( 'block-template-parts' );
```

This feature is only relevant for non block based themes, as block based themes already support block based template parts as part of the site editor.

The standalone template part editor does not allow editors to create new, or delete existing template parts. This is because the theme manually needs to include the template part in the PHP template.

You can find out more about block based template parts in the [themes handbook block template and template parts section](https://developer.wordpress.org/themes/block-themes/templates-and-template-parts/#block-c5fa39a2-a27d-4bd2-98d0-dc6249a0801a).
