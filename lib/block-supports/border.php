<?php
/**
 * Border block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style attribute used by the border feature if needed for block
 * types that support borders.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_border_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( block_has_support( $block_type, array( '__experimentalBorder' ) ) && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}

	if ( gutenberg_has_border_feature_support( $block_type, 'color' ) && ! array_key_exists( 'borderColor', $block_type->attributes ) ) {
		$block_type->attributes['borderColor'] = array(
			'type' => 'string',
		);
	}
}

/**
 * Adds CSS classes and inline styles for border styles to the incoming
 * attributes array. This will be applied to the block markup in the front-end.
 *
 * @param WP_Block_Type $block_type       Block type.
 * @param array         $block_attributes Block attributes.
 *
 * @return array Border CSS classes and inline styles.
 */
function gutenberg_apply_border_support( $block_type, $block_attributes ) {
	if ( wp_should_skip_block_supports_serialization( $block_type, 'border' ) ) {
		return array();
	}

	$border_block_styles      = array();
	$has_border_color_support = gutenberg_has_border_feature_support( $block_type, 'color' );
	$has_border_width_support = gutenberg_has_border_feature_support( $block_type, 'width' );

	// Border radius.
	if (
		gutenberg_has_border_feature_support( $block_type, 'radius' ) &&
		isset( $block_attributes['style']['border']['radius'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'radius' )
	) {
		$border_radius = $block_attributes['style']['border']['radius'];

		if ( is_numeric( $border_radius ) ) {
			$border_radius .= 'px';
		}

		$border_block_styles['radius'] = $border_radius;
	}

	// Border style.
	if (
		gutenberg_has_border_feature_support( $block_type, 'style' ) &&
		isset( $block_attributes['style']['border']['style'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'style' )
	) {
		$border_block_styles['style'] = $block_attributes['style']['border']['style'];
	}

	// Border width.
	if (
		$has_border_width_support &&
		isset( $block_attributes['style']['border']['width'] ) &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'width' )
	) {
		$border_width = $block_attributes['style']['border']['width'];

		// This check handles original unitless implementation.
		if ( is_numeric( $border_width ) ) {
			$border_width .= 'px';
		}

		$border_block_styles['width'] = $border_width;
	}

	// Border color.
	if (
		$has_border_color_support &&
		! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'color' )
	) {
		$preset_border_color          = array_key_exists( 'borderColor', $block_attributes ) ? "var:preset|color|{$block_attributes['borderColor']}" : null;
		$custom_border_color          = $block_attributes['style']['border']['color'] ?? null;
		$border_block_styles['color'] = $preset_border_color ? $preset_border_color : $custom_border_color;
	}

	// Generate styles for individual border sides.
	if ( $has_border_color_support || $has_border_width_support ) {
		foreach ( array( 'top', 'right', 'bottom', 'left' ) as $side ) {
			$border                       = $block_attributes['style']['border'][ $side ] ?? null;
			$border_side_values           = array(
				'width' => isset( $border['width'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'width' ) ? $border['width'] : null,
				'color' => isset( $border['color'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'color' ) ? $border['color'] : null,
				'style' => isset( $border['style'] ) && ! wp_should_skip_block_supports_serialization( $block_type, '__experimentalBorder', 'style' ) ? $border['style'] : null,
			);
			$border_block_styles[ $side ] = $border_side_values;
		}
	}

	// Collect classes and styles.
	$attributes = array();
	$styles     = gutenberg_style_engine_get_styles( array( 'border' => $border_block_styles ) );

	if ( ! empty( $styles['classnames'] ) ) {
		$attributes['class'] = $styles['classnames'];
	}

	if ( ! empty( $styles['css'] ) ) {
		$attributes['style'] = $styles['css'];
	}

	return $attributes;
}

/**
 * Checks whether the current block type supports the border feature requested.
 *
 * If the `__experimentalBorder` support flag is a boolean `true` all border
 * support features are available. Otherwise, the specific feature's support
 * flag nested under `experimentalBorder` must be enabled for the feature
 * to be opted into.
 *
 * @param WP_Block_Type $block_type    Block type to check for support.
 * @param string        $feature       Name of the feature to check support for.
 * @param mixed         $default_value Fallback value for feature support, defaults to false.
 *
 * @return boolean                  Whether or not the feature is supported.
 */
function gutenberg_has_border_feature_support( $block_type, $feature, $default_value = false ) {
	// Check if all border support features have been opted into via `"__experimentalBorder": true`.
	if ( property_exists( $block_type, 'supports' ) ) {
		$block_type_supports_border = $block_type->supports['__experimentalBorder'] ?? $default_value;
		if ( true === $block_type_supports_border ) {
			return true;
		}
	}

	// Check if the specific feature has been opted into individually
	// via nested flag under `__experimentalBorder`.
	return block_has_support( $block_type, array( '__experimentalBorder', $feature ), $default_value );
}

/**
 * Style value parser that returns a CSS definition array comprising style properties
 * that have keys representing individual style properties, otherwise known as longhand CSS properties.
 * e.g., "$style_property-$individual_feature: $value;", which could represent the following:
 * "border-{top|right|bottom|left}-{color|width|style}: {value};" or,
 * "border-image-{outset|source|width|repeat|slice}: {value};"
 *
 * @param array $style_value                    A single raw style value from $block_styles array.
 * @param array $individual_property_definition A single style definition from static::$block_style_definition_metadata,
 *                                              representing an individual property of a CSS property, e.g., 'top' in 'border-top'.
 * @param array $options                        {
 *     Optional. An array of options. Default empty array.
 *
 *     @type bool $convert_vars_to_classnames Whether to skip converting incoming CSS var patterns, e.g., `var:preset|<PRESET_TYPE>|<PRESET_SLUG>`, to var( --wp--preset--* ) values. Default `false`.
 * }
 *
 * @return string[] An associative array of CSS definitions, e.g., array( "$property" => "$value", "$property" => "$value" ).
 */
function _gutenberg_block_supports_get_individual_property_css_declarations( $style_value, $individual_property_definition, $options = array() ) {
	if ( ! is_array( $style_value ) || empty( $style_value ) || empty( $individual_property_definition['path'] ) ) {
		return array();
	}

	/*
		* The first item in $individual_property_definition['path'] array tells us the style property, e.g., "border".
		* We use this to get a corresponding CSS style definition such as "color" or "width" from the same group.
		* The second item in $individual_property_definition['path'] array refers to the individual property marker, e.g., "top".
		*/
	$definition_group_key    = $individual_property_definition['path'][0];
	$individual_property_key = $individual_property_definition['path'][1];
	$should_skip_css_vars    = isset( $options['convert_vars_to_classnames'] ) && true === $options['convert_vars_to_classnames'];
	$css_declarations        = array();

	foreach ( $style_value as $css_property => $value ) {
		if ( empty( $value ) ) {
			continue;
		}

		// Build a path to the individual rules in definitions.
		$style_definition_path = array( $definition_group_key, $css_property );
		$style_definition      = _wp_array_get( WP_Style_Engine_Gutenberg::$block_style_definition_metadata, $style_definition_path, null );

		if ( $style_definition && isset( $style_definition['property_keys']['individual'] ) ) {
			// Set a CSS var if there is a valid preset value.
			if ( is_string( $value ) && str_contains( $value, 'var:' ) && ! $should_skip_css_vars && ! empty( $individual_property_definition['css_vars'] ) ) {
				$value = WP_Style_Engine_Gutenberg::get_css_var_value( $value, $individual_property_definition['css_vars'] );
			}
			$individual_css_property                      = sprintf( $style_definition['property_keys']['individual'], $individual_property_key );
			$css_declarations[ $individual_css_property ] = $value;
		}
	}
	return $css_declarations;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'border',
	array(
		'register_attribute' => 'gutenberg_register_border_support',
		'apply'              => 'gutenberg_apply_border_support',
	)
);

WP_Style_Engine_Gutenberg::register_block_style_definitions_metadata(
	'border',
	array(
		'color'  => array(
			'property_keys' => array(
				'default'    => 'border-color',
				'individual' => 'border-%s-color',
			),
			'path'          => array( 'border', 'color' ),
			'classnames'    => array(
				'has-border-color'       => true,
				'has-$slug-border-color' => 'color',
			),
		),
		'radius' => array(
			'property_keys' => array(
				'default'    => 'border-radius',
				'individual' => 'border-%s-radius',
			),
			'path'          => array( 'border', 'radius' ),
		),
		'style'  => array(
			'property_keys' => array(
				'default'    => 'border-style',
				'individual' => 'border-%s-style',
			),
			'path'          => array( 'border', 'style' ),
		),
		'width'  => array(
			'property_keys' => array(
				'default'    => 'border-width',
				'individual' => 'border-%s-width',
			),
			'path'          => array( 'border', 'width' ),
		),
		'top'    => array(
			'value_func' => '_gutenberg_block_supports_get_individual_property_css_declarations',
			'path'       => array( 'border', 'top' ),
			'css_vars'   => array(
				'color' => '--wp--preset--color--$slug',
			),
		),
		'right'  => array(
			'value_func' => '_gutenberg_block_supports_get_individual_property_css_declarations',
			'path'       => array( 'border', 'right' ),
			'css_vars'   => array(
				'color' => '--wp--preset--color--$slug',
			),
		),
		'bottom' => array(
			'value_func' => '_gutenberg_block_supports_get_individual_property_css_declarations',
			'path'       => array( 'border', 'bottom' ),
			'css_vars'   => array(
				'color' => '--wp--preset--color--$slug',
			),
		),
		'left'   => array(
			'value_func' => '_gutenberg_block_supports_get_individual_property_css_declarations',
			'path'       => array( 'border', 'left' ),
			'css_vars'   => array(
				'color' => '--wp--preset--color--$slug',
			),
		),
	)
);
