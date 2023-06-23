# Using the Style Engine to generate block supports styles

[Block supports](https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/) is the API that allows a block to declare support for certain features.

Where a block declares support for a specific style group or property, e.g., "spacing" or "spacing.padding", the block's attributes are extended to include a **style object**.

For example:

```json
{
    "attributes": {
        "style": {
            "spacing": {
                "margin": {
                    "top": "10px"
                },
                "padding": "1em"
            },
            "typography": {
                "fontSize": "2.2rem"
            }
        }
    }
}
```

Using this object, the Style Engine can generate the classes and CSS required to style the block element.

The global function `wp_style_engine_get_styles` accepts a style object as its first argument, and will output compiled CSS and an array of CSS declaration property/value pairs.

```php
$block_styles =  array(
     'spacing' => array( 'padding' => '10px', 'margin' => array( 'top' => '1em') ),
     'typography' => array( 'fontSize' => '2.2rem' ),
);
$styles = wp_style_engine_get_styles(
    $block_styles
);
print_r( $styles );

/*
array(
    'css'          => 'padding:10px;margin-top:1em;font-size:2.2rem',
    'declarations' => array( 'padding' => '10px', 'margin-top' => '1em', 'font-size' => '2.2rem' )
)
*/
```

## Use case
When [registering a block support](https://developer.wordpress.org/reference/classes/wp_block_supports/register/), it is possible to pass an 'apply' callback in the block support config array to add or extend block support attributes with "class" or "style" properties.

If a block has opted into the block support, the values of "class" and "style" will be applied to the block element's "class" and "style" attributes accordingly when rendered in the frontend HTML. Note, this applies only to server-side rendered blocks, for example, the [Site Title block](https://developer.wordpress.org/block-editor/reference-guides/core-blocks/#site-title).

The callback receives `$block_type` and `$block_attributes` as arguments. The `style` attribute within `$block_attributes` only contains the raw style object, if any styles have been set for the block, and not any CSS or classnames to be applied to the block's HTML elements. 

Here is where `wp_style_engine_get_styles` comes in handy: it will generate CSS and, if appropriate, classnames to be added to the "style" and "class" HTML attributes in the final rendered block markup.

Here is a _very_ simplified version of how the [color block support](https://github.com/WordPress/gutenberg/tree/HEAD/lib/block-supports/color.php) works:

```php
function gutenberg_apply_colors_support( $block_type, $block_attributes ) {
	// Get the color styles from the style object.
	$block_color_styles = isset( $block_attributes['style']['color'] ) ? $block_attributes['style']['color'] : null;

	// Since we only want the color styles, pass the color styles only to the Style Engine.
	$styles = wp_style_engine_get_styles( array( 'color' => $block_color_styles ) );

	// Return the generated styles to be applied to the block's HTML element.
	return array(
		'style' => $styles['css'],
		'class' => $styles['classnames']
	);
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'colors',
	array(
		'register_attribute' => 'gutenberg_register_colors_support',
		'apply'              => 'gutenberg_apply_colors_support',
	)
);
```

It's important to note that, for now, the Style Engine will only generate styles for the following, core block supports:

- border
- color
- spacing
- typography

In future releases, it will be possible to extend this list.

## Checking for block support and skip serialization

Before passing the block style object to the Style Engine, you'll need to take into account:

1. whether the theme has elected to support a particular block style, and
2. whether a block has elected to "skip serialization" of that particular block style, that is, opt-out of automatic application of styles to the block's element (usually in order to do it via the block's internals). See the [block API documentation](https://developer.wordpress.org/block-editor/explanations/architecture/styles/#block-supports-api) for further information.

If a block either:

- has no support for a style, or 
- skips serialization of that style

it's likely that you'll want to remove those style values from the style object before passing it to the Style Engine with help of two functions:

- wp_should_skip_block_supports_serialization()
- block_has_support()

We can now update the apply callback code above so that we'll only return "style" and "class", where a block has support and it doesn't skip serialization:

```php
function gutenberg_apply_colors_support( $block_type, $block_attributes ) {
	// The return value.
	$attributes = array();
    
	// Return early if the block skips all serialization for block supports.
	if ( gutenberg_should_skip_block_supports_serialization( $block_type, 'color' ) ) {
		return $attributes;
	}

	// Checks for support and skip serialization.
	$has_text_support                        = block_has_support( $block_type, array( 'color', 'text' ), false ); 
	$has_background_support                  = block_has_support( $block_type, array( 'color', 'background' ), false );
	$skips_serialization_of_color_text       = wp_should_skip_block_supports_serialization( $block_type, 'color', 'text' ); 
	$skips_serialization_of_color_background = wp_should_skip_block_supports_serialization( $block_type, 'color', 'background' ); 
    
	// Get the color styles from the style object.
	$block_color_styles = isset( $block_attributes['style']['color'] ) ? $block_attributes['style']['color'] : null;

	// The mutated styles object we're going to pass to wp_style_engine_get_styles().
	$color_block_styles = array();

	// Set the color style values according to whether the block has support and does not skip serialization.
	$spacing_block_styles['text']       = null;
	if ( $has_text_support && ! $skips_serialization_of_color_text ) {
		$spacing_block_styles['text'] = isset( $block_color_styles['text'] ) ? $block_color_styles['text'] : null;
	}
	$spacing_block_styles['background'] = null;
	if ( $has_background_support && ! $skips_serialization_of_color_background ) {
		$spacing_block_styles['background'] = isset( $block_color_styles['background'] )
			? $block_color_styles['background']
			: null;
	}

	// Pass the color styles, excluding those that have no support or skip serialization, to the Style Engine.
	$styles = wp_style_engine_get_styles( array( 'color' => $block_color_styles ) );

	// Return the generated styles to be applied to the block's HTML element.
	return array(
		'style' => $styles['css'],
		'class' => $styles['classnames']
	);
}
```

## Generating classnames and CSS custom selectors from presets

Many of theme.json's presets will generate both CSS custom properties and CSS rules (consisting of a selector and the CSS declarations) on the frontend.

Styling a block using these presets normally involves adding the selector to the "className" attribute of the block.

For styles that can have preset values, such as text color and font family, the Style Engine knows how to construct the classnames using the preset slug.

To discern CSS values from preset values however, the Style Engine expects a special format.

Preset values must follow the pattern `var:preset|<PRESET_TYPE>|<PRESET_SLUG>`.

When the Style Engine encounters these values, it will parse them and create a CSS value of `var(--wp--preset--font-size--small)` and/or generate a classname if required.

Example:

```php
// Let's say the block attributes styles contain a fontSize preset slug of "small".
$preset_font_size        = "var:preset|font-size|{$block_attributes['fontSize']}";
// Now let's say the block attributes styles contain a backgroundColor preset slug of "blue".
$preset_background_color = "var:preset|color|{$block_attributes['backgroundColor']}";

$block_styles =  array(
	'typography' => array( 'fontSize' => $preset_font_size ),
	'color'      => array( 'background' => $preset_background_color )
);

$styles = wp_style_engine_get_styles(
    $block_styles
);
print_r( $styles );

/*
array(
    'css'        => 'background-color:var(--wp--preset--color--blue);font-size:var(--wp--preset--font-size--small);',
    'classnames' => 'has-background-color has-blue-background-color has-small-font-size',
)
*/
```

If you don't want the Style Engine to output the CSS custom vars as well, which you might not if you're applying both the CSS and classnames to the block element, you can pass `'convert_vars_to_classnames' => true` in the options array.

```php
$options = array(
	// Whether to skip converting CSS var:? values to var( --wp--preset--* ) values. Default is `false`.
	'convert_vars_to_classnames' => 'true',
);
$styles = wp_style_engine_get_styles(
	$block_styles,
	$options
);
print_r( $styles );

/*
array(
    'css'        => 'letter-spacing:12px;', // non-preset-based CSS will still be compiled.
    'classnames' => 'has-background-color has-blue-background-color has-small-font-size',
)
*/
```

Read more about [global styles](https://developer.wordpress.org/block-editor/explanations/architecture/styles/#global-styles) and [preset CSS custom properties](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-json/#css-custom-properties-presets-custom) and [theme supports](https://developer.wordpress.org/block-editor/how-to-guides/themes/theme-support/).
