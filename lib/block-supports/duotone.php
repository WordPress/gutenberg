<?php
/**
 * Duotone block support flag.
 *
 * @package gutenberg
 */

/**
 * Direct port of tinycolor's bound01 function, lightly simplified to maintain
 * consistency with tinycolor.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @param  mixed $n   Number of unknown type.
 * @param  int   $max Upper value of the range to bound to.
 * @return float      Value in the range [0,1].
 */
function gutenberg_tinycolor_bound01( $n, $max ) {
	if ( 'string' === gettype( $n ) && str_contains( $n, '.' ) && 1 === (float) $n ) {
		$n = '100%';
	}

	$n = min( $max, max( 0, (float) $n ) );

	// Automatically convert percentage into number.
	if ( 'string' === gettype( $n ) && str_contains( $n, '%' ) ) {
		$n = (int) ( $n * $max ) / 100;
	}

	// Handle floating point rounding errors.
	if ( ( abs( $n - $max ) < 0.000001 ) ) {
		return 1.0;
	}

	// Convert into [0, 1] range if it isn't already.
	return ( $n % $max ) / (float) $max;
}

/**
 * Direct port of tinycolor's boundAlpha function to maintain consistency with
 * how tinycolor works.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @param  mixed $n   Number of unknown type.
 * @return float      Value in the range [0,1].
 */
function gutenberg_tinycolor_bound_alpha( $n ) {
	if ( is_numeric( $n ) ) {
		$n = (float) $n;
		if ( $n >= 0 && $n <= 1 ) {
			return $n;
		}
	}
	return 1;
}

/**
 * Round and convert values of an RGB object.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @param  array $rgb_color RGB object.
 * @return array            Rounded and converted RGB object.
 */
function gutenberg_tinycolor_rgb_to_rgb( $rgb_color ) {
	return array(
		'r' => gutenberg_tinycolor_bound01( $rgb_color['r'], 255 ) * 255,
		'g' => gutenberg_tinycolor_bound01( $rgb_color['g'], 255 ) * 255,
		'b' => gutenberg_tinycolor_bound01( $rgb_color['b'], 255 ) * 255,
	);
}

/**
 * Helper function for hsl to rgb conversion.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @param  float $p first component.
 * @param  float $q second component.
 * @param  float $t third component.
 * @return float    R, G, or B component.
 */
function gutenberg_tinycolor_hue_to_rgb( $p, $q, $t ) {
	if ( $t < 0 ) {
		++$t;
	}
	if ( $t > 1 ) {
		--$t;
	}
	if ( $t < 1 / 6 ) {
		return $p + ( $q - $p ) * 6 * $t;
	}
	if ( $t < 1 / 2 ) {
		return $q;
	}
	if ( $t < 2 / 3 ) {
		return $p + ( $q - $p ) * ( 2 / 3 - $t ) * 6;
	}
	return $p;
}

/**
 * Convert an HSL object to an RGB object with converted and rounded values.
 *
 * @see https://github.com/bgrins/TinyColor
 *
 * @param  array $hsl_color HSL object.
 * @return array            Rounded and converted RGB object.
 */
function gutenberg_tinycolor_hsl_to_rgb( $hsl_color ) {
	$h = gutenberg_tinycolor_bound01( $hsl_color['h'], 360 );
	$s = gutenberg_tinycolor_bound01( $hsl_color['s'], 100 );
	$l = gutenberg_tinycolor_bound01( $hsl_color['l'], 100 );

	if ( 0 === $s ) {
		// Achromatic.
		$r = $l;
		$g = $l;
		$b = $l;
	} else {
		$q = $l < 0.5 ? $l * ( 1 + $s ) : $l + $s - $l * $s;
		$p = 2 * $l - $q;
		$r = gutenberg_tinycolor_hue_to_rgb( $p, $q, $h + 1 / 3 );
		$g = gutenberg_tinycolor_hue_to_rgb( $p, $q, $h );
		$b = gutenberg_tinycolor_hue_to_rgb( $p, $q, $h - 1 / 3 );
	}

	return array(
		'r' => $r * 255,
		'g' => $g * 255,
		'b' => $b * 255,
	);
}

/**
 * Parses hex, hsl, and rgb CSS strings using the same regex as tinycolor v1.4.2
 * used in the JavaScript. Only colors output from react-color are implemented.
 *
 * @see https://github.com/bgrins/TinyColor
 * @see https://github.com/casesandberg/react-color/
 *
 * @param  string $color_str CSS color string.
 * @return array             RGB object.
 */
function gutenberg_tinycolor_string_to_rgb( $color_str ) {
	$color_str = strtolower( trim( $color_str ) );

	$css_integer = '[-\\+]?\\d+%?';
	$css_number  = '[-\\+]?\\d*\\.\\d+%?';

	$css_unit = '(?:' . $css_number . ')|(?:' . $css_integer . ')';

	$permissive_match3 = '[\\s|\\(]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')\\s*\\)?';
	$permissive_match4 = '[\\s|\\(]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')[,|\\s]+(' . $css_unit . ')\\s*\\)?';

	$rgb_regexp = '/^rgb' . $permissive_match3 . '$/';
	if ( preg_match( $rgb_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => $match[1],
				'g' => $match[2],
				'b' => $match[3],
			)
		);

		$rgb['a'] = 1;

		return $rgb;
	}

	$rgba_regexp = '/^rgba' . $permissive_match4 . '$/';
	if ( preg_match( $rgba_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => $match[1],
				'g' => $match[2],
				'b' => $match[3],
			)
		);

		$rgb['a'] = gutenberg_tinycolor_bound_alpha( $match[4] );

		return $rgb;
	}

	$hsl_regexp = '/^hsl' . $permissive_match3 . '$/';
	if ( preg_match( $hsl_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_hsl_to_rgb(
			array(
				'h' => $match[1],
				's' => $match[2],
				'l' => $match[3],
			)
		);

		$rgb['a'] = 1;

		return $rgb;
	}

	$hsla_regexp = '/^hsla' . $permissive_match4 . '$/';
	if ( preg_match( $hsla_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_hsl_to_rgb(
			array(
				'h' => $match[1],
				's' => $match[2],
				'l' => $match[3],
			)
		);

		$rgb['a'] = gutenberg_tinycolor_bound_alpha( $match[4] );

		return $rgb;
	}

	$hex8_regexp = '/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/';
	if ( preg_match( $hex8_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => base_convert( $match[1], 16, 10 ),
				'g' => base_convert( $match[2], 16, 10 ),
				'b' => base_convert( $match[3], 16, 10 ),
			)
		);

		$rgb['a'] = gutenberg_tinycolor_bound_alpha(
			base_convert( $match[4], 16, 10 ) / 255
		);

		return $rgb;
	}

	$hex6_regexp = '/^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/';
	if ( preg_match( $hex6_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => base_convert( $match[1], 16, 10 ),
				'g' => base_convert( $match[2], 16, 10 ),
				'b' => base_convert( $match[3], 16, 10 ),
			)
		);

		$rgb['a'] = 1;

		return $rgb;
	}

	$hex4_regexp = '/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/';
	if ( preg_match( $hex4_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => base_convert( $match[1] . $match[1], 16, 10 ),
				'g' => base_convert( $match[2] . $match[2], 16, 10 ),
				'b' => base_convert( $match[3] . $match[3], 16, 10 ),
			)
		);

		$rgb['a'] = gutenberg_tinycolor_bound_alpha(
			base_convert( $match[4] . $match[4], 16, 10 ) / 255
		);

		return $rgb;
	}

	$hex3_regexp = '/^#?([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/';
	if ( preg_match( $hex3_regexp, $color_str, $match ) ) {
		$rgb = gutenberg_tinycolor_rgb_to_rgb(
			array(
				'r' => base_convert( $match[1] . $match[1], 16, 10 ),
				'g' => base_convert( $match[2] . $match[2], 16, 10 ),
				'b' => base_convert( $match[3] . $match[3], 16, 10 ),
			)
		);

		$rgb['a'] = 1;

		return $rgb;
	}

	// The JS color picker considers the string "transparent" to be a hex value,
	// so we need to handle it here as a special case.
	if ( 'transparent' === $color_str ) {
		return array(
			'r' => 0,
			'g' => 0,
			'b' => 0,
			'a' => 0,
		);
	}
}

/**
 * Returns the prefixed id for the duotone filter for use as a CSS id.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone filter CSS id.
 */
function gutenberg_get_duotone_filter_id( $preset ) {
	if ( ! isset( $preset['slug'] ) ) {
		return '';
	}

	return 'wp-duotone-' . $preset['slug'];
}

/**
 * Returns the CSS filter property url to reference the rendered SVG.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone CSS filter property url value.
 */
function gutenberg_get_duotone_filter_property( $preset ) {
	if ( isset( $preset['colors'] ) && is_string( $preset['colors'] ) ) {
		return $preset['colors'];
	}
	$filter_id = gutenberg_get_duotone_filter_id( $preset );
	return "url('#" . $filter_id . "')";
}

/**
 * Returns the duotone filter SVG string for the preset.
 *
 * @param  array $preset Duotone preset value as seen in theme.json.
 * @return string        Duotone SVG filter.
 */
function gutenberg_get_duotone_filter_svg( $preset ) {
	$filter_id = gutenberg_get_duotone_filter_id( $preset );

	$duotone_values = array(
		'r' => array(),
		'g' => array(),
		'b' => array(),
		'a' => array(),
	);

	if ( ! isset( $preset['colors'] ) || ! is_array( $preset['colors'] ) ) {
		$preset['colors'] = array();
	}

	foreach ( $preset['colors'] as $color_str ) {
		$color = gutenberg_tinycolor_string_to_rgb( $color_str );

		$duotone_values['r'][] = $color['r'] / 255;
		$duotone_values['g'][] = $color['g'] / 255;
		$duotone_values['b'][] = $color['b'] / 255;
		$duotone_values['a'][] = $color['a'];
	}

	ob_start();

	?>

	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 0 0"
		width="0"
		height="0"
		focusable="false"
		role="none"
		style="visibility: hidden; position: absolute; left: -9999px; overflow: hidden;"
	>
		<defs>
			<filter id="<?php echo esc_attr( $filter_id ); ?>">
				<feColorMatrix
					color-interpolation-filters="sRGB"
					type="matrix"
					values="
						.299 .587 .114 0 0
						.299 .587 .114 0 0
						.299 .587 .114 0 0
						.299 .587 .114 0 0
					"
				/>
				<feComponentTransfer color-interpolation-filters="sRGB" >
					<feFuncR type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['r'] ) ); ?>" />
					<feFuncG type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['g'] ) ); ?>" />
					<feFuncB type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['b'] ) ); ?>" />
					<feFuncA type="table" tableValues="<?php echo esc_attr( implode( ' ', $duotone_values['a'] ) ); ?>" />
				</feComponentTransfer>
				<feComposite in2="SourceGraphic" operator="in" />
			</filter>
		</defs>
	</svg>

	<?php

	$svg = ob_get_clean();

	if ( ! SCRIPT_DEBUG ) {
		// Clean up the whitespace.
		$svg = preg_replace( "/[\r\n\t ]+/", ' ', $svg );
		$svg = str_replace( '> <', '><', $svg );
		$svg = trim( $svg );
	}

	return $svg;
}

/**
 * Registers the style and colors block attributes for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_duotone_support( $block_type ) {
	$has_duotone_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$has_duotone_support = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
	}

	if ( $has_duotone_support ) {
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}

		if ( ! array_key_exists( 'style', $block_type->attributes ) ) {
			$block_type->attributes['style'] = array(
				'type' => 'object',
			);
		}
	}
}

/**
 * Render out the duotone stylesheet and SVG.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_duotone_support( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

	$duotone_support = false;
	if ( $block_type && property_exists( $block_type, 'supports' ) ) {
		$duotone_support = _wp_array_get( $block_type->supports, array( 'color', '__experimentalDuotone' ), false );
	}

	// The block should have a duotone attribute or have duotone defined in its theme.json to be processed.
	$has_duotone_attribute = isset( $block['attrs']['style']['color']['duotone'] );
	$has_global_styles_duotone = array_key_exists( $block['blockName'], WP_Duotone::$global_styles_block_names );
	
	if (
		! $duotone_support ||
		( ! $has_duotone_attribute && ! $has_global_styles_duotone )
	) {
		return $block_content;
	}

	// Possible values for duotone attribute:
	// 1. Array of colors - e.g. array('#000000', '#ffffff').
	// 2. Variable for an existing Duotone preset - e.g. 'var:preset|duotone|green-blue'.
	// 3. A CSS string - e.g. 'unset' to remove globally applied duotone.
	$duotone_attr = $block['attrs']['style']['color']['duotone'];

	$is_preset = is_string( $duotone_attr ) && WP_Duotone::is_preset( $duotone_attr );
	$is_css    = is_string( $duotone_attr ) && ! $is_preset;
	$is_custom = is_array( $duotone_attr );

	// Generate the pieces needed for rendering a duotone to the page.
	if ( $has_global_styles_duotone ) {
		$slug = WP_Duotone::$global_styles_block_names[ $block['blockName'] ];

		// Utilize existing preset CSS custom property.
		$filter_property = "var(--wp--preset--duotone--$slug)";
		WP_Duotone::$output[ $slug ] = WP_Duotone::$global_styles_presets[ $slug ];
	} elseif ( $is_preset ) {

		// TODO: Extract to set_output_preset( $filter_data );
		// Extract the slug from the preset variable string.
		$slug = WP_Duotone::gutenberg_get_slug_from_attr( $duotone_attr );

		// Utilize existing preset CSS custom property.
		$filter_property = "var(--wp--preset--duotone--$slug)";

		WP_Duotone::$output[ $slug ] = WP_Duotone::$global_styles_presets[ $slug ];

	} elseif ( $is_css ) {
		// Build a unique slug for the filter based on the CSS value.
		$slug = wp_unique_id( sanitize_key( $duotone_attr . '-' ) );

		// Pass through the CSS value.
		$filter_property = $duotone_attr;
	} elseif ( $is_custom ) {
		// Build a unique slug for the filter based on the array of colors.
		$slug = wp_unique_id( sanitize_key( implode( '-', $duotone_attr ) . '-' ) );

		$filter_data = array(
			'slug'   => $slug,
			'colors' => $duotone_attr,
		);
		// Build a customized CSS filter property for unique slug.
		$filter_property = gutenberg_get_duotone_filter_property( $filter_data );

		WP_Duotone::$output[ $slug ] = $filter_data;
	}

	// - Applied as a class attribute to the block wrapper.
	// - Used as a selector to apply the filter to the block.
	$filter_id = gutenberg_get_duotone_filter_id( array( 'slug' => $slug ) );

	// Build the CSS selectors to which the filter will be applied.
	$selector = WP_Theme_JSON_Gutenberg::scope_selector( '.' . $filter_id, $duotone_support );

	// We only want to add the selector if we have it in the output already, essentially skipping 'unset'.
	// TODO: Extract to set_output_preset( $filter_data );
	if( array_key_exists( $slug, WP_Duotone::$output ) ) {
		WP_Duotone::$output[ $slug ][ 'selector' ] = $selector;
	}
	
	// Calling gutenberg_style_engine_get_stylesheet_from_css_rules ensures that
	// the styles are rendered in an inline for block supports because we're
	// using the `context` option to instruct it so.
	gutenberg_style_engine_get_stylesheet_from_css_rules(
		array(
			array(
				'selector'     => $selector,
				'declarations' => array(
					// !important is needed because these styles
					// render before global styles,
					// and they should be overriding the duotone
					// filters set by global styles.
					'filter' => $filter_property . ' !important',
				),
			),
		),
		array(
			'context' => 'block-supports',
		)
	);
			

	// Like the layout hook, this assumes the hook only applies to blocks with a single wrapper.
	return preg_replace(
		'/' . preg_quote( 'class="', '/' ) . '/',
		'class="' . $filter_id . ' ',
		$block_content,
		1
	);
}


add_action( 'wp_footer',
	static function () {

		foreach( WP_Duotone::$output as $filter_data ) {

			$filter_property = gutenberg_get_duotone_filter_property( $filter_data );
			// SVG will be output on the page later.
			$filter_svg = gutenberg_get_duotone_filter_svg( $filter_data );
			
			echo $filter_svg;

			
			// This is for classic themes - in block themes, the CSS is added in the head via the value_func.
			if( ! wp_is_block_theme() ) {
				$duotone_preset_css_var = WP_Theme_JSON_Gutenberg::get_preset_css_var( array( 'color', 'duotone' ), $filter_data[ 'slug'] );
				wp_add_inline_style( 'core-block-supports', 'body{' . $duotone_preset_css_var . ' :' . $filter_property . ';}' );
			}

			global $is_safari;
			if( $is_safari ) {
				duotone_safari_rerender_hack( $selector );
			}
		}
	}
);

/**
 * Appends the used duotone fitler CSS Vars to the inline global styles CSS
 */
add_action( 'wp_enqueue_scripts', static function() {

	if( empty( WP_Duotone::$output ) ) {
		return;
	}

	$duotone_css_vars = '';

	foreach ( WP_Duotone::$output as $filter_data ) {
		if( ! array_key_exists( $filter_data['slug'], WP_Duotone::$global_styles_presets ) ) {
			continue;
		}

		$filter_property = gutenberg_get_duotone_filter_property( $filter_data );
		
		$duotone_preset_css_var = WP_Theme_JSON_Gutenberg::get_preset_css_var( array( 'color', 'duotone' ), $filter_data[ 'slug'] );
		$duotone_css_vars .= $duotone_preset_css_var . ': ' . $filter_property . ';';		
	}

	if( ! empty( $duotone_css_vars ) ) {
		wp_add_inline_style( 'global-styles', 'body{' . $duotone_css_vars . '}' );
	}
}, 11 );

/**
 * Safari renders elements incorrectly on first paint when the SVG filter comes after the content that it is filtering,
 * so we force a repaint with a WebKit hack which solves the issue.
 *
 * @param string $selector The selector to apply the hack for.
 */
function duotone_safari_rerender_hack( $selector ) {
	/*
	 * Simply accessing el.offsetHeight flushes layout and style
	 * changes in WebKit without having to wait for setTimeout.
	 */
	printf(
		'<script>( function() { var el = document.querySelector( %s ); var display = el.style.display; el.style.display = "none"; el.offsetHeight; el.style.display = display; } )();</script>',
		wp_json_encode( $selector )
	);
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'duotone',
	array(
		'register_attribute' => 'gutenberg_register_duotone_support',
	)
);

// Remove WordPress core filter to avoid rendering duplicate support elements.
remove_filter( 'render_block', 'wp_render_duotone_support', 10, 2 );
add_filter( 'render_block', 'gutenberg_render_duotone_support', 10, 2 );


class WP_Duotone {
	/**
	 * An array of Duotone presets from global, theme, and custom styles.
	 * 
	 * Example: 
	 * [
	 * 		'blue-orange' => 
	 * 			[
	 * 				'slug'	=> 'blue-orange',
	 * 				'colors' => [ '#0000ff', '#ffcc00' ],
	 * 			]
	 * 		],
	 * 		…
	 * ]
	 * 
	 * @since 6.3.0
	 * @var array
	 */
	static $global_styles_presets = array();

	/** 
	 * An array of block names from global, theme, and custom styles that have duotone presets. We'll use this to quickly
	 * check if a block being rendered needs to have duotone applied, and which duotone preset to use.
	 * 
	 * Example: 
	 * 	[
	 *		'core/featured-image' => 'blue-orange',
	 * 		 …
	 * 	]
	 *
	 */
	static $global_styles_block_names = array();
	
	/**
	 * An array of Duotone SVG and CSS ouput needed for the frontend duotone rendering based on what is
	 * being ouptput on the page. Organized by a slug of the preset/color group and the information needed
	 * to generate the SVG and CSS at render.
	 * 
	 * Example:
	 *  [
     * 		'blue-orange' => [
     * 			'slug'	=> 'blue-orange',
     * 			'colors' => [ '#0000ff', '#ffcc00' ],
     * 		],
     * 		'wp-duotone-000000-ffffff-2' => [
     * 			'slug' => 'wp-duotone-000000-ffffff-2',
     * 			'colors' => [ '#000000', '#ffffff' ],
     * 		],
     * ]
	 * 
	 * @since 6.3.0
	 * @var array
	 */
	static $output = array();



	/**
	 * Get all possible duotone presets from global and theme styles and store as slug => [ colors array ]
	 * We only want to process this one time. On block render we'll access and output only the needed presets for that page.
	 * 
	 */
	static function save_global_styles_presets() {
		// Get the per block settings from the theme.json.
		$tree = WP_Theme_JSON_Resolver::get_merged_data();
		$settings = $tree->get_settings();
		$presets_by_origin = _wp_array_get( $settings, array( 'color', 'duotone' ), array() );
		$flat_presets = [];
		// Flatten the array
		foreach( $presets_by_origin as $presets ) {
			foreach( $presets as $preset ) {
				// $flat_presets[ _wp_to_kebab_case( $preset['slug'] ) ] = $preset;
				self::$global_styles_presets[ _wp_to_kebab_case( $preset['slug'] ) ] = [
					'slug'	=> $preset[ 'slug' ],
					'colors' => $preset[ 'colors' ],
				];
			}
		}
	}

	/**
	 * Scrape all block names from global styles and store in WP_Duotone::$global_styles_block_names
	 */
	static function save_global_style_block_names() {
		// Get the per block settings from the theme.json.
		$tree = WP_Theme_JSON_Resolver::get_merged_data();
		$block_nodes = $tree->get_styles_block_nodes();
		$theme_json = $tree->get_raw_data();
		

		foreach( $block_nodes as $block_node ) {
			// This block definition doesn't include any duotone settings. Skip it.
			if ( empty( $block_node['duotone'] ) ) {
				continue;
			}

			// Value looks like this: 'var(--wp--preset--duotone--blue-orange)' or 'var:preset|duotone|default-filter'
			$duotone_attr_path = array_merge( $block_node['path'], array( 'filter', 'duotone' ) );
			$duotone_attr = _wp_array_get( $theme_json, $duotone_attr_path, array() );
			
			if( empty( $duotone_attr ) ) {
				continue;
			}
			// If it has a duotone filter preset, save the block name and the preset slug.
			$slug = self::gutenberg_get_slug_from_attr( $duotone_attr );

			if( $slug && $slug !== $duotone_attr) {
				self::$global_styles_block_names[ $block_node[ 'name' ] ] = $slug;
			}
		}
	}

	/**
	 * Take the inline CSS duotone variable from a block and return the slug. Handles styles slugs like:
	 * var:preset|duotone|default-filter
	 * var(--wp--preset--duotone--blue-orange)
	 * 
	 * @param string $duotone_attr The duotone attribute from a block.
	 * @return string The slug of the duotone preset.
	 */
	static function gutenberg_get_slug_from_attr( $duotone_attr ) {
		return str_replace( [ 'var:preset|duotone|', 'var(--wp--preset--duotone--', ')' ], '', $duotone_attr );
	}

	/**
	 * Check if we have a duotone preset string
	 */
	static function is_preset( $duotone_attr ) {
		return strpos( $duotone_attr, 'var:preset|duotone|' ) === 0 || strpos( $duotone_attr, 'var(--wp--preset--duotone--' ) === 0;
	}

	/**
	 * Get all possible duotone presets from global and theme styles. We only want to process this one time. On block render we'll access and output only the needed presets for that page.
	 * 
	 */
	static function gutenberg_identify_used_duotone_blocks( $block_content, $block ) {
		// If the block name exists in our pre-defined list of block selectors that use duotone in theme.json (or related), add it to our list of duotone to output
		if( array_key_exists( $block['blockName'], self::$global_styles_block_names ) ) {
			$preset_slug = self::$global_styles_block_names[ $block['blockName'] ];

			self::$output[ $preset_slug ] = self::$global_styles_presets[ $preset_slug ];
		}

		return $block_content;
	}

	/**
	 * Registers the duotone preset.
	 *
	 * @param array $settings The block editor settings.
	 *
	 * @return array The block editor settings.
	 */
	public static function duotone_declarations( $declarations, $selector ) {
		foreach ( $declarations as $index => $declaration ) {
			if ( 'filter' === $declaration['name'] ) {
				static::$global_styles_presets[] = $declarations[ $index ]['value'];
			}
		}
	}
}
//
function gutenberg_get_duotone_preset_value( $preset ) {
	if( array_key_exists( $preset['slug'], WP_Duotone::$output ) ) {
		// This is returning the --wp--preset--duotone--dark-grayscale: CSS VAR NAME; but not removing the full --wp--preset--duotone--dark-grayscale preset name
		return gutenberg_get_duotone_filter_property( $preset );
	}

	return '';
}


add_action( 'wp_loaded', array( 'WP_Duotone', 'save_global_styles_presets' ), 10 );
add_action( 'wp_loaded', array( 'WP_Duotone', 'save_global_style_block_names' ), 10 );
add_action( 'theme_json_register_declarations', array( 'WP_Duotone', 'duotone_declarations' ), 10, 2 );