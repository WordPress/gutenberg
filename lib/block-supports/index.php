<?php
/**
 * Block support flags.
 *
 * @package gutenberg
 */

global $block_supports_config;
$block_supports_config = array(
	'align'            => array(
		'attributes' => array(
			'align' => array(
				'type' => 'string',
				'enum' => array( 'left', 'center', 'right', 'wide', 'full', '' ),
			),
		),
		'callback'   => function( $attributes ) {
			if ( empty( $attributes['align'] ) ) {
				return false;
			}

			return sprintf(
				'align%s',
				$attributes['align']
			);
		},
		'default'    => false,
	),
	'className'        => array(
		'attributes' => array(),
		'callback'   => function( $attributes, $block_name ) {
			return gutenberg_get_block_default_classname( $block_name );
		},
		'default'    => true,
	),
	'color.background' => array(
		'attributes' => array(
			'backgroundColor' => array(
				'type' => 'string',
			),
		),
		'callback'   => '__return_false',
		'default'    => array( false, true ),
	),
	'color.gradients'  => array(
		'attributes' => array(
			'gradient' => array(
				'type' => 'string',
			),
		),
		'callback'   => '__return_false',
		'default'    => array( false, false ),
	),
	'color.link'       => array(
		'attributes' => array(),
		'callback'   => '__return_false',
		'default'    => array( false, false ),
	),
	'color.text'       => array(
		'attributes' => array(
			'style'     => array(
				'type' => 'object',
			),
			'textColor' => array(
				'type' => 'string',
			),
		),
		'callback'   => function( $attributes ) {
			$has_named_text_color = array_key_exists( 'textColor', $attributes );
			$has_custom_text_color = isset( $attributes['style']['color']['text'] );
			$classes = '';

			// Apply required generic class.
			if ( $has_custom_text_color || $has_named_text_color ) {
				$classes .= ' has-text-color';
			}
			// Apply color class or inline style.
			if ( $has_named_text_color ) {
				$classes .= sprintf( ' has-%s-color', $attributes['textColor'] );
			} elseif ( $has_custom_text_color ) {
				$generated_class_name = uniqid( 'wp-block-colortext-' );
				$classes .= " $generated_class_name";
				wp_add_inline_style(
					'wp-block-supports',
					sprintf(
						// TODO: how do systematically and confidently address specificity?
						// should we just go back to proper inline styles?
						// of course, there's also the blunt tool that is !important.
						':root:root:root .%s { color: %s; }',
						$generated_class_name,
						$attributes['style']['color']['text']
					)
				);
			}
			return $classes;
		},
		'default'    => array( false, true ),
	),
	'customClassName'  => array(
		'attributes' => array(
			'className' => array(
				'type' => 'string',
			),
		),
		'callback'   => function( $attributes ) {
			return array_key_exists( 'className', $attributes ) ?
				$attributes['className'] :
				false;
		},
		'default'    => true,
	),
	'fontSize'         => array(
		'attributes' => array(
			'style'    => array(
				'type' => 'object',
			),
			'fontSize' => array(
				'type' => 'string',
			),
		),
		'callback'   => function( $attributes, $block_name ) {
			$has_named_font_size = array_key_exists( 'fontSize', $attributes );
			$has_custom_font_size = isset( $attributes['style']['typography']['fontSize'] );

			$classes = '';
			if ( $has_named_font_size ) {
				$classes = sprintf( 'has-%s-font-size', $attributes['fontSize'] );
			} elseif ( $has_custom_font_size ) {
				$generated_class_name = uniqid( 'wp-block-fontsize-' );
				$classes = $generated_class_name;
				wp_add_inline_style(
					'wp-block-supports',
					sprintf(
						'.%s { font-size: %spx; }',
						$generated_class_name,
						$attributes['style']['typography']['fontSize']
					)
				);
			}

			return $classes;
		},
		'default'    => false,
	),
	'lineHeight'       => array(
		'attributes' => array(
			'style' => array(
				'type' => 'object',
			),
		),
		'callback'   => function( $attributes, $block_name ) {
			$has_line_height = isset( $attributes['style']['typography']['lineHeight'] );

			$classes = '';
			if ( $has_line_height ) {
				$generated_class_name = uniqid( 'wp-block-lineheight-' );
				$classes = $generated_class_name;
				wp_add_inline_style(
					'wp-block-supports',
					sprintf(
						'.%s { line-height: %s; }',
						$generated_class_name,
						$attributes['style']['typography']['lineHeight']
					)
				);
			}

			return $classes;
		},
		'default'    => false,
	),
);


/**
 * TODO.
 *
 * @param  string $input HTML input.
 * @param  string $value Class(es) to insert at the root element.
 * @return string HTML with class(es) inserted.
 */
function gutenberg_block_supports_inject_classes( $input, $value ) {
	$close_token    = '>';
	$class_token    = 'class="';
	$close_position = strpos( $input, $close_token );
	$class_position = strpos( $input, $class_token );
	// Unexpected. Bail.
	if ( false === $close_position ) {
		return $input;
	}
	// If the first HTML element in the string does not contain a `class`
	// attribute...
	if ( ! $class_position || $close_position < $class_position ) {
		// then inject a new one at the end of the tag.
		return substr_replace(
			$input,
			" class=\"$value\">",
			$close_position,
			strlen( $close_token )
		);
	}
	// Otherwise, overwrite the opening of the `class` attribute in order to
	// inject our value.
	return substr_replace(
		$input,
		"class=\"$value ",
		$class_position,
		strlen( $class_token )
	);
}

/**
 * TODO.
 *
 * @param  string $input HTML input.
 * @param  string $value Inline styles to insert at the root element.
 * @return string HTML with styles inserted.
 */
function gutenberg_block_supports_inject_style( $input, $value ) {
	$close_token    = '>';
	$style_token    = 'style="';
	$close_position = strpos( $input, $close_token );
	$style_position = strpos( $input, $style_token );
	// Unexpected. Bail.
	if ( false === $close_position ) {
		return $input;
	}
	// If the first HTML element in the string does not contain a `style`
	// attribute...
	if ( ! $style_position || $close_position < $style_position ) {
		// then inject a new one at the end of the tag.
		return substr_replace(
			$input,
			" style=\"$value\">",
			$close_position,
			strlen( $close_token )
		);
	}
	// Otherwise, overwrite the opening of the `style` attribute in order to
	// inject our value.
	return substr_replace(
		$input,
		"style=\"$value ",
		$style_position,
		strlen( $style_token )
	);
}


/**
 * Filter the registered blocks to apply the block supports attributes registration.
 */
function gutenberg_register_block_supports() {
	$block_registry         = WP_Block_Type_Registry::get_instance();
	$registered_block_types = $block_registry->get_all_registered();
	// Ideally we need a hook to extend the block registration
	// instead of mutating the block type.
	foreach ( $registered_block_types as $block_type ) {
		/* gutenberg_register_colors_support( $block_type ); */
	}
}
add_action( 'init', 'gutenberg_register_block_supports', 21 );

/**
 * TODO.
 */
function gutenberg_block_supports_register_attributes() {
	global $block_supports_config;

	wp_register_style( 'wp-block-supports', false );

	$block_registry         = WP_Block_Type_Registry::get_instance();
	$registered_block_types = $block_registry->get_all_registered();
	foreach ( $registered_block_types as $block_type ) {
		if ( ! property_exists( $block_type, 'supports' ) ) {
			continue;
		}
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}
		foreach ( $block_supports_config as $feature_name => $feature_config ) {
			if (
				! gutenberg_get_block_support(
					$block_type->supports,
					$feature_name,
					$feature_config['default']
				)
			) {
				continue;
			}
			foreach ( $feature_config['attributes'] as $attribute_name => $attribute_schema ) {
				if ( ! array_key_exists( $attribute_name, $block_type->attributes ) ) {
					$block_type->attributes[ $attribute_name ] = $attribute_schema;
				}
			}
		}
	}
}
add_action( 'init', 'gutenberg_block_supports_register_attributes', 22 );

/**
 * TODO.
 */
function gutenberg_block_supports_enqueue_style() {
	wp_enqueue_style( 'wp-block-supports' );
}
add_action( 'wp_footer', 'gutenberg_block_supports_enqueue_style' );

/**
 * TODO.
 *
 * @param  array         $block_supports Supports object.
 * @param  string        $feature_name   Feature name.
 * @param  boolean|array $default        Default value if support no found.
 * @return any                           Supports data.
 */
function gutenberg_get_block_support( $block_supports, $feature_name, $default = false ) {
	$path    = explode( '.', $feature_name );
	$default = (array) $default;
	if ( count( $path ) !== count( $default ) ) {
		return false;
	}
	$partial_path = array();
	foreach ( $path as $i => $subkey ) {
		$partial_path[] = $subkey;
		$result         = gutenberg_experimental_get(
			$block_supports,
			$partial_path,
			$default[ $i ]
		);
		if ( ! $result ) {
			break;
		}
	}
	return $result;
}

/**
 * TODO.
 */
function gutenberg_block_supports_classes() {
	global $block_supports_config, $current_parsed_block;

	if (
		empty( $current_parsed_block ) ||
		! isset( $current_parsed_block['attrs'] ) ||
		! isset( $current_parsed_block['blockName'] )
	) {
		// TODO: handle as error?
		return '';
	}

	$block_attributes = $current_parsed_block['attrs'];
	$block_type       = WP_Block_Type_Registry::get_instance()->get_registered(
		$current_parsed_block['blockName']
	);

	if ( empty( $block_type ) ) {
		// TODO: handle as error?
		return '';
	}

	$output = '';
	foreach ( $block_supports_config as $feature_name => $feature_config ) {
		if (
			! gutenberg_get_block_support(
				$block_type->supports,
				$feature_name,
				$feature_config['default']
			)
		) {
			continue;
		}
		$classes = call_user_func(
			$feature_config['callback'],
			// Pick from $block_attributes according to feature attributes.
			array_intersect_key(
				$block_attributes,
				array_flip( array_keys( $feature_config['attributes'] ) )
			),
			$block_type->name
		);
		if ( ! empty( $classes ) ) {
			$output .= " $classes";
		}
	}
	return $output;
}


/**
 * TODO.
 *
 * @param  string $block_content rendered block content.
 * @param  array  $block block object.
 */
function gutenberg_block_supports_inject_attributes( $block_content, $block ) {
	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	// If no render_callback, assume styles have been previously handled.
	if ( ! $block_type || ! $block_type->render_callback ) {
		return $block_content;
	}

	$classes = gutenberg_block_supports_classes();
	if ( ! empty( $classes ) ) {
		return gutenberg_block_supports_inject_classes( $block_content, $classes );
	}

	return $block_content;
}
add_filter( 'render_block', 'gutenberg_block_supports_inject_attributes', 10, 2 );
