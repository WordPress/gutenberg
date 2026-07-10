<?php
/**
 * Block support to add semantic CSS classes to blocks when style properties are applied.
 *
 * @since 23.4.0
 * @package gutenberg
 */

/**
 * Callback function for the render_block filter to compute and inject style classes.
 *
 * @since 23.4.0
 *
 * @param string $block_content The block content.
 * @param array  $block         The full block, including name and attributes.
 * @return string Filtered block content with style classes injected.
 */
function gutenberg_render_style_classes( $block_content, $block ) {
	/**
	 * Filters the list of style properties enabled for CSS class generation.
	 *
	 * @since 23.4.0
	 *
	 * @param string[] $enabled Array of enabled style property slugs.
	 */
	$enabled = (array) apply_filters( 'wp_enabled_style_properties', array() );

	if ( empty( $enabled ) || '' === $block_content ) {
		return $block_content;
	}

	$block_name = isset( $block['blockName'] ) ? $block['blockName'] : '';
	if ( $block_name ) {
		$slug = str_replace( '/', '-', $block_name );

		/**
		 * Filters the list of style properties enabled for CSS class generation for a specific block type.
		 *
		 * The dynamic portion of the hook name, `$block_name`, refers to the block type name.
		 *
		 * @since 23.4.0
		 *
		 * @param string[] $enabled Array of enabled style property slugs.
		 * @param array    $block   The full block, including name and attributes.
		 */
		$enabled = (array) apply_filters( "wp_enabled_style_properties_{$block_name}", $enabled, $block );

		/**
		 * Filters the list of style properties enabled for CSS class generation for a specific block type slug.
		 *
		 * The dynamic portion of the hook name, `$slug`, refers to the kebab case block type name.
		 *
		 * @since 23.4.0
		 *
		 * @param string[] $enabled Array of enabled style property slugs.
		 * @param array    $block   The full block, including name and attributes.
		 */
		$enabled = (array) apply_filters( "wp_enabled_style_properties_{$slug}", $enabled, $block );
	}

	if ( empty( $enabled ) ) {
		return $block_content;
	}

	$ctx = array(
		'style'  => isset( $block['attrs']['style'] ) ? $block['attrs']['style'] : array(),
		'attrs'  => isset( $block['attrs'] ) ? $block['attrs'] : array(),
		'layout' => isset( $block['attrs']['layout'] ) ? $block['attrs']['layout'] : array(),
		'block'  => $block,
	);

	$classes = array();

	foreach ( $enabled as $property ) {
		$handler = gutenberg_get_style_classes_handler( $property );
		if ( null !== $handler ) {
			$new_classes = call_user_func( $handler, $ctx );
			if ( ! empty( $new_classes ) ) {
				$classes = array_merge( $classes, $new_classes );
			}
		}
	}

	/**
	 * Filters the final list of semantic style classes before they are injected into the block.
	 *
	 * @since 23.4.0
	 *
	 * @param string[] $classes Array of semantic style classes.
	 * @param array    $block   The full block, including name and attributes.
	 */
	$classes = (array) apply_filters( 'wp_block_style_classes', array_unique( array_filter( $classes ) ), $block );

	if ( empty( $classes ) ) {
		return $block_content;
	}

	$processor = new WP_HTML_Tag_Processor( $block_content );
	if ( $processor->next_tag() ) {
		foreach ( $classes as $class_name ) {
			$processor->add_class( $class_name );
		}
		return $processor->get_updated_html();
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_render_style_classes', 10, 2 );

/**
 * Returns the map of property key to callback functions.
 *
 * @since 23.4.0
 *
 * @return array Array of style property handlers.
 */
function gutenberg_get_style_classes_handlers() {

	$defaults = array(
		'padding'          => function ( $ctx ) {
			return gutenberg_spacing_style_classes( 'padding', _wp_array_get( $ctx, array( 'style', 'spacing', 'padding' ) ) );
		},
		'margin'           => function ( $ctx ) {
			return gutenberg_spacing_style_classes( 'margin', _wp_array_get( $ctx, array( 'style', 'spacing', 'margin' ) ) );
		},
		'block-gap'        => function ( $ctx ) {
			return gutenberg_block_gap_style_classes( _wp_array_get( $ctx, array( 'style', 'spacing', 'blockGap' ) ) );
		},
		'border-radius'    => function ( $ctx ) {
			return gutenberg_border_radius_style_classes( _wp_array_get( $ctx, array( 'style', 'border', 'radius' ) ) );
		},
		'border-width'     => function ( $ctx ) {
			$border = _wp_array_get( $ctx, array( 'style', 'border' ) );
			return gutenberg_border_side_style_classes( 'border-width', is_array( $border ) ? $border : array(), 'width' );
		},
		'border-style'     => function ( $ctx ) {
			$border = _wp_array_get( $ctx, array( 'style', 'border' ) );
			return gutenberg_border_side_style_classes( 'border-style', is_array( $border ) ? $border : array(), 'style', true );
		},
		'border-color'     => function ( $ctx ) {
			$border = _wp_array_get( $ctx, array( 'style', 'border' ) );
			return gutenberg_border_side_style_classes( 'border-color', is_array( $border ) ? $border : array(), 'color' );
		},
		'font-size'        => function ( $ctx ) {
			$val = _wp_array_get( $ctx, array( 'style', 'typography', 'fontSize' ) );
			if ( null === $val ) {
				$val = _wp_array_get( $ctx, array( 'attrs', 'fontSize' ) );
			}
			return gutenberg_typo_style_classes( 'font-size', $val );
		},
		'font-weight'      => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'font-weight', _wp_array_get( $ctx, array( 'style', 'typography', 'fontWeight' ) ), true );
		},
		'font-style'       => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'font-style', _wp_array_get( $ctx, array( 'style', 'typography', 'fontStyle' ) ), true );
		},
		'font-family'      => function ( $ctx ) {
			$val = _wp_array_get( $ctx, array( 'style', 'typography', 'fontFamily' ) );
			if ( null === $val ) {
				$val = _wp_array_get( $ctx, array( 'attrs', 'fontFamily' ) );
			}
			return gutenberg_typo_style_classes( 'font-family', $val );
		},
		'line-height'      => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'line-height', _wp_array_get( $ctx, array( 'style', 'typography', 'lineHeight' ) ) );
		},
		'letter-spacing'   => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'letter-spacing', _wp_array_get( $ctx, array( 'style', 'typography', 'letterSpacing' ) ) );
		},
		'text-decoration'  => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'text-decoration', _wp_array_get( $ctx, array( 'style', 'typography', 'textDecoration' ) ), true );
		},
		'text-transform'   => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'text-transform', _wp_array_get( $ctx, array( 'style', 'typography', 'textTransform' ) ), true );
		},
		'writing-mode'     => function ( $ctx ) {
			return gutenberg_typo_style_classes( 'writing-mode', _wp_array_get( $ctx, array( 'style', 'typography', 'writingMode' ) ), true );
		},
		'min-height'       => function ( $ctx ) {
			return gutenberg_single_style_classes( 'min-height', _wp_array_get( $ctx, array( 'style', 'dimensions', 'minHeight' ) ) );
		},
		'aspect-ratio'     => function ( $ctx ) {
			return gutenberg_single_style_classes( 'aspect-ratio', _wp_array_get( $ctx, array( 'style', 'dimensions', 'aspectRatio' ) ), true );
		},
		'shadow'           => function ( $ctx ) {
			return gutenberg_single_style_classes( 'shadow', _wp_array_get( $ctx, array( 'style', 'shadow' ) ) );
		},
		'color-gradient'   => function ( $ctx ) {
			return gutenberg_single_style_classes( 'gradient', _wp_array_get( $ctx, array( 'style', 'color', 'gradient' ) ) );
		},
		'color-duotone'    => function ( $ctx ) {
			return gutenberg_single_style_classes( 'duotone', _wp_array_get( $ctx, array( 'style', 'color', 'duotone' ) ) );
		},
		'color-background' => function ( $ctx ) {
			return gutenberg_single_style_classes( 'background', _wp_array_get( $ctx, array( 'style', 'color', 'background' ) ) );
		},
		'color-text'       => function ( $ctx ) {
			return gutenberg_single_style_classes( 'color', _wp_array_get( $ctx, array( 'style', 'color', 'text' ) ) );
		},
	);

	/**
	 * Filters the map of style property handlers.
	 *
	 * @since 23.4.0
	 *
	 * @param array $defaults Array mapping property keys to callable handlers.
	 */
	$handlers = (array) apply_filters( 'wp_style_property_handlers', $defaults );

	return $handlers;
}

/**
 * Returns the callable for a single property key.
 *
 * @since 23.4.0
 *
 * @param string $property Property key.
 * @return callable|null Handler function, or null if not found.
 */
function gutenberg_get_style_classes_handler( $property ) {
	$handlers = gutenberg_get_style_classes_handlers();
	return isset( $handlers[ $property ] ) ? $handlers[ $property ] : null;
}

/**
 * Parses a raw Gutenberg style value and categorizes it.
 *
 * @since 23.4.0
 *
 * @param mixed $raw Raw value from block attributes.
 * @return array Parsed value details.
 */
function gutenberg_parse_style_classes_value( $raw ) {
	if ( null === $raw || '' === $raw ) {
		return array(
			'type' => 'empty',
			'slug' => null,
			'safe' => '',
		);
	}

	$str = is_scalar( $raw ) ? (string) $raw : '';

	if ( '' === $str ) {
		return array(
			'type' => 'empty',
			'slug' => null,
			'safe' => '',
		);
	}

	if ( preg_match( '/^var:preset\|[^|]+\|(.+)$/D', $str, $matches ) ) {
		return array(
			'type' => 'preset',
			'slug' => $matches[1],
			'safe' => gutenberg_to_style_class( $matches[1] ),
		);
	}

	if ( preg_match( '/^var\(--wp--preset--[a-z0-9-]+--([a-z0-9-]+)\)$/iD', $str, $matches ) ) {
		return array(
			'type' => 'preset',
			'slug' => $matches[1],
			'safe' => gutenberg_to_style_class( $matches[1] ),
		);
	}

	if ( preg_match( '/^[a-z][a-z0-9-]*$/iD', $str ) ) {
		return array(
			'type' => 'slug',
			'slug' => $str,
			'safe' => gutenberg_to_style_class( $str ),
		);
	}

	return array(
		'type' => 'custom',
		'slug' => null,
		'safe' => gutenberg_to_style_class( $str ),
	);
}

/**
 * Converts an arbitrary string to a valid CSS class token.
 *
 * @since 23.4.0
 *
 * @param string $value Raw string.
 * @return string CSS class safe string.
 */
function gutenberg_to_style_class( $value ) {
	$class_name = strtolower( $value );
	$class_name = preg_replace( '/[^a-z0-9]+/', '-', $class_name );
	return trim( $class_name, '-' );
}

/**
 * Generates classes for a single scalar value property.
 *
 * @since 23.4.0
 *
 * @param string  $property    CSS property name.
 * @param mixed   $value       Raw value from block attrs.
 * @param boolean $embed_value Whether to embed the raw value in the class.
 * @return array List of generated classes.
 */
function gutenberg_single_style_classes( $property, $value, $embed_value = false ) {
	if ( null === $value || '' === $value ) {
		return array();
	}

	$classes = array( 'has-' . $property );
	$parsed  = gutenberg_parse_style_classes_value( $value );

	if ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] ) {
		$classes[] = 'has-' . $parsed['safe'] . '-' . $property;
	} elseif ( $embed_value && '' !== $parsed['safe'] ) {
		$classes[] = 'has-' . $parsed['safe'] . '-' . $property;
	} else {
		$classes[] = 'has-custom-' . $property;
	}

	return $classes;
}

/**
 * Generates classes for spacing properties (padding, margin).
 *
 * @since 23.4.0
 *
 * @param string $property 'padding' or 'margin'.
 * @param mixed  $value    Property value.
 * @return array List of generated classes.
 */
function gutenberg_spacing_style_classes( $property, $value ) {
	if ( null === $value || '' === $value ) {
		return array();
	}

	$classes = array( 'has-' . $property );

	if ( is_string( $value ) ) {
		$parsed    = gutenberg_parse_style_classes_value( $value );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-' . $property
			: 'has-custom-' . $property;
		return $classes;
	}

	if ( ! is_array( $value ) ) {
		return $classes;
	}

	$side_keys = array( 'top', 'right', 'bottom', 'left' );
	$sides     = array();

	foreach ( $side_keys as $side ) {
		if ( isset( $value[ $side ] ) && '' !== $value[ $side ] ) {
			$sides[ $side ] = (string) $value[ $side ];
		}
	}

	if ( empty( $sides ) ) {
		return $classes;
	}

	$side_values = array_values( $sides );
	$all_equal   = count( array_unique( $side_values ) ) === 1 && count( $sides ) === count( $side_keys );

	if ( $all_equal ) {
		$parsed    = gutenberg_parse_style_classes_value( $side_values[0] );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-' . $property
			: 'has-custom-' . $property;
	} else {
		$classes[] = 'has-mixed-' . $property;
		foreach ( $sides as $side => $raw ) {
			$parsed    = gutenberg_parse_style_classes_value( $raw );
			$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
				? 'has-' . $parsed['safe'] . '-' . $side . '-' . $property
				: 'has-custom-' . $side . '-' . $property;
		}
	}

	return $classes;
}

/**
 * Generates classes for block gap.
 *
 * @since 23.4.0
 *
 * @param mixed $value Property value.
 * @return array List of generated classes.
 */
function gutenberg_block_gap_style_classes( $value ) {
	if ( null === $value || '' === $value ) {
		return array();
	}

	if ( is_string( $value ) ) {
		return gutenberg_single_style_classes( 'block-gap', $value );
	}

	if ( ! is_array( $value ) ) {
		return array();
	}

	$classes = array( 'has-block-gap' );
	$axes    = array( 'horizontal', 'vertical' );

	foreach ( $axes as $axis ) {
		if ( empty( $value[ $axis ] ) ) {
			continue;
		}
		$parsed    = gutenberg_parse_style_classes_value( $value[ $axis ] );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-' . $axis . '-block-gap'
			: 'has-custom-' . $axis . '-block-gap';
	}

	if ( isset( $value['horizontal'], $value['vertical'] ) && $value['horizontal'] === $value['vertical'] ) {
		$parsed    = gutenberg_parse_style_classes_value( $value['horizontal'] );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-block-gap'
			: 'has-custom-block-gap';
	}

	return array_unique( $classes );
}

/**
 * Generates classes for border radius.
 *
 * @since 23.4.0
 *
 * @param mixed $value Property value.
 * @return array List of generated classes.
 */
function gutenberg_border_radius_style_classes( $value ) {
	if ( null === $value || '' === $value ) {
		return array();
	}

	$classes = array( 'has-border-radius' );

	if ( is_string( $value ) ) {
		$parsed    = gutenberg_parse_style_classes_value( $value );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-border-radius'
			: 'has-custom-border-radius';
		return $classes;
	}

	if ( ! is_array( $value ) ) {
		return $classes;
	}

	$corner_map = array(
		'topLeft'     => 'top-left',
		'topRight'    => 'top-right',
		'bottomRight' => 'bottom-right',
		'bottomLeft'  => 'bottom-left',
	);

	$corners = array();
	foreach ( $corner_map as $key => $label ) {
		if ( isset( $value[ $key ] ) && '' !== $value[ $key ] ) {
			$corners[ $label ] = (string) $value[ $key ];
		}
	}

	if ( empty( $corners ) ) {
		return $classes;
	}

	$corner_values = array_values( $corners );
	$all_equal     = count( array_unique( $corner_values ) ) === 1 && count( $corners ) === count( $corner_map );

	if ( $all_equal ) {
		$parsed    = gutenberg_parse_style_classes_value( $corner_values[0] );
		$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
			? 'has-' . $parsed['safe'] . '-border-radius'
			: 'has-custom-border-radius';
	} else {
		$classes[] = 'has-mixed-border-radius';
		foreach ( $corners as $corner => $raw ) {
			$parsed    = gutenberg_parse_style_classes_value( $raw );
			$classes[] = ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] )
				? 'has-' . $parsed['safe'] . '-' . $corner . '-border-radius'
				: 'has-custom-' . $corner . '-border-radius';
		}
	}

	return $classes;
}

/**
 * Generates classes for per side border properties: width, style, color.
 *
 * @since 23.4.0
 *
 * @param string  $property    CSS property.
 * @param array   $border      Border object.
 * @param string  $key         Specific key to extract.
 * @param boolean $embed_value Whether to embed the raw value.
 * @return array List of generated classes.
 */
function gutenberg_border_side_style_classes( $property, $border, $key, $embed_value = false ) {
	if ( empty( $border ) ) {
		return array();
	}

	$uniform  = isset( $border[ $key ] ) ? $border[ $key ] : null;
	$side_map = array( 'top', 'right', 'bottom', 'left' );
	$sides    = array();

	foreach ( $side_map as $side ) {
		if ( isset( $border[ $side ][ $key ] ) && '' !== $border[ $side ][ $key ] ) {
			$sides[ $side ] = (string) $border[ $side ][ $key ];
		}
	}

	if ( null === $uniform && empty( $sides ) ) {
		return array();
	}

	$classes = array( 'has-' . $property );

	$get_class = function ( $raw, $side = '' ) use ( $property, $embed_value ) {
		$parsed = gutenberg_parse_style_classes_value( $raw );
		$suffix = $side ? '-' . $side . '-' . $property : '-' . $property;

		if ( 'preset' === $parsed['type'] || 'slug' === $parsed['type'] ) {
			return 'has-' . $parsed['safe'] . $suffix;
		}
		if ( $embed_value && '' !== $parsed['safe'] ) {
			return 'has-' . $parsed['safe'] . $suffix;
		}
		return 'has-custom' . $suffix;
	};

	if ( null !== $uniform ) {
		$classes[] = call_user_func( $get_class, (string) $uniform );
		return $classes;
	}

	$side_values = array_values( $sides );
	$all_equal   = count( array_unique( $side_values ) ) === 1 && count( $sides ) === count( $side_map );

	if ( $all_equal ) {
		$classes[] = call_user_func( $get_class, $side_values[0] );
	} else {
		$classes[] = 'has-mixed-' . $property;
		foreach ( $sides as $side => $raw ) {
			$classes[] = call_user_func( $get_class, $raw, $side );
		}
	}

	return $classes;
}

/**
 * Generates classes for typography properties.
 *
 * @since 23.4.0
 *
 * @param string  $property    CSS property.
 * @param mixed   $value       Property value.
 * @param boolean $embed_value Whether to embed the raw value.
 * @return array List of generated classes.
 */
function gutenberg_typo_style_classes( $property, $value, $embed_value = false ) {
	if ( null === $value || '' === $value ) {
		return array();
	}

	return gutenberg_single_style_classes( $property, $value, $embed_value );
}

/**
 * Pass enabled style properties to the React editor settings.
 *
 * @since 23.4.0
 *
 * @param array $settings Default editor settings.
 * @return array Filtered editor settings.
 */
function gutenberg_style_classes_editor_settings( $settings ) {
	/**
	 * Filters the list of style properties enabled for CSS class generation.
	 *
	 * @since 23.4.0
	 *
	 * @param string[] $enabled Array of enabled style property slugs.
	 */
	$enabled = (array) apply_filters( 'wp_enabled_style_properties', array() );

	$settings['__experimentalStyleClassesEnabled'] = $enabled;

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_style_classes_editor_settings' );
