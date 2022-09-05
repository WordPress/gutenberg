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

## Checking for block support and skip serialization

Before passing the block style object to the Style Engine, it's important to take into account:

1. whether the theme has elected to support a particular block style, and
2. whether a block has elected to "skip serialization" of that particular block style, that is, opt-out of automatic application of styles to the block's element (usually in order to do it via the block's internals). See the [block API documentation](https://developer.wordpress.org/block-editor/explanations/architecture/styles/#block-supports-api) for further information.

If a block either:

- has no support for a specific style, or 
- skips serialization of that style

it's likely that you'll want to remove those style values from the style object.

For example:

```php
// Check if a block has support using block_has_support (https://developer.wordpress.org/reference/functions/block_has_support/)
$has_padding_support = block_has_support( $block_type, array( 'spacing', 'padding' ), false ); // Returns true.
$has_margin_support  = block_has_support( $block_type, array( 'spacing', 'margin' ), false ); // Returns false.

// Check skipping of serialization.
$should_skip_padding = wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'padding' ); // Returns true.
$should_skip_margin  = wp_should_skip_block_supports_serialization( $block_type, 'spacing', 'margin' ); // Returns false.

// Now build the styles object.
$spacing_block_styles            = array();
$spacing_block_styles['padding'] = $has_padding_support && ! $skip_padding ? _wp_array_get( $block_attributes['style'], array( 'spacing', 'padding' ), null ) : null;
$spacing_block_styles['margin']  = $has_margin_support && ! $skip_margin ? _wp_array_get( $block_attributes['style'], array( 'spacing', 'margin' ), null ) : null;

// Now get the styles.
$styles = wp_style_engine_get_styles( array( 'spacing' => $spacing_block_styles ) );

print_r( $styles );

/*
// Nothing, because there's no support for margin and the block skip's serialization for padding.
array()
*/
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
