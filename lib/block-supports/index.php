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
		'callback'   => '__return_false',
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
 * Filter the registered blocks to apply the block supports attributes registration.
 */
function gutenberg_register_block_supports() {
	$block_registry         = WP_Block_Type_Registry::get_instance();
	$registered_block_types = $block_registry->get_all_registered();
	// Ideally we need a hook to extend the block registration
	// instead of mutating the block type.
	foreach ( $registered_block_types as $block_type ) {
		gutenberg_register_colors_support( $block_type );
	}
}
add_action( 'init', 'gutenberg_register_block_supports', 21 );

/**
 * TODO.
 */
function foo_register_block_supports() {
	global $block_supports_config;

	wp_register_style( 'wp-block-supports', false );

	$block_registry         = WP_Block_Type_Registry::get_instance();
	$registered_block_types = $block_registry->get_all_registered();
	$registered_features    = array(
		'align' => $block_supports_config['align'],
	);
	foreach ( $registered_block_types as $block_type ) {
		if ( ! property_exists( $block_type, 'supports' ) ) {
			continue;
		}
		if ( ! $block_type->attributes ) {
			$block_type->attributes = array();
		}
		foreach ( $registered_features as $feature_name => $feature_config ) {
			// TODO: split feature names like color.text.
			// TODO: look at default value.
			if (
				! gutenberg_experimental_get(
					$block_type->supports,
					array( $feature_name ),
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
add_action( 'init', 'foo_register_block_supports', 22 );

function foo_enqueue_style() {
	wp_enqueue_style( 'wp-block-supports' );
}
add_action( 'wp_footer', 'foo_enqueue_style' );

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
		// TODO: split feature names like color.text.
		// TODO: look at default value.
		if (
			! gutenberg_experimental_get(
				$block_type->supports,
				array( $feature_name ),
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
 * Filters the frontend output of blocks and apply the block support flags transformations.
 *
 * @param  string $block_content rendered block content.
 * @param  array  $block block object.
 * @return string filtered block content.
 */
function gutenberg_apply_block_supports( $block_content, $block ) {
	if ( ! isset( $block['attrs'] ) ) {
		return $block_content;
	}

	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	// If no render_callback, assume styles have been previously handled.
	if ( ! $block_type || ! $block_type->render_callback ) {
		return $block_content;
	}

	$attributes = array();
	$attributes = gutenberg_apply_colors_support( $attributes, $block['attrs'], $block_type );

	if ( ! count( $attributes ) ) {
		return $block_content;
	}

	$dom = new DOMDocument( '1.0', 'utf-8' );

	// Suppress DOMDocument::loadHTML warnings from polluting the front-end.
	$previous = libxml_use_internal_errors( true );

	// We need to wrap the block in order to handle UTF-8 properly.
	$wrapped_block_html =
		'<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"></head><body>'
		. $block_content
		. '</body></html>';

	$success = $dom->loadHTML( $wrapped_block_html, LIBXML_HTML_NODEFDTD | LIBXML_COMPACT );

	// Clear errors and reset the use_errors setting.
	libxml_clear_errors();
	libxml_use_internal_errors( $previous );

	if ( ! $success ) {
		return $block_content;
	}

	// Structure is like `<html><head/><body/></html>`, so body is the `lastChild` of our document.
	$body_element = $dom->documentElement->lastChild; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

	$xpath      = new DOMXPath( $dom );
	$block_root = $xpath->query( './*', $body_element )[0];

	// phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	if ( empty( $block_root ) ) {
		return $block_content;
	}

	// Merge and dedupe new and existing classes and styles.
	$current_classes = explode( ' ', trim( $block_root->getAttribute( 'class' ) ) );
	$classes_to_add  = array_key_exists( 'css_classes', $attributes ) ? $attributes['css_classes'] : array();
	$new_classes     = array_unique( array_filter( array_merge( $current_classes, $classes_to_add ) ) );

	$current_styles = preg_split( '/\s*;\s*/', trim( $block_root->getAttribute( 'style' ) ) );
	$styles_to_add  = array_key_exists( 'inline_styles', $attributes ) ? $attributes['inline_styles'] : array();
	$new_styles     = array_unique( array_map( 'gutenberg_normalize_css_rule', array_filter( array_merge( $current_styles, $styles_to_add ) ) ) );

	// Apply new styles and classes.
	if ( ! empty( $new_classes ) ) {
		// `DOMElement::setAttribute` handles attribute value escaping.
		$block_root->setAttribute( 'class', implode( ' ', $new_classes ) );
	}

	if ( ! empty( $new_styles ) ) {
		// `DOMElement::setAttribute` handles attribute value escaping.
		$block_root->setAttribute( 'style', implode( '; ', $new_styles ) . ';' );
	}

	// Avoid using `$dom->saveHtml( $node )` because the node results may not produce consistent
	// whitespace for PHP < 7.3. Saving the root HTML `$dom->saveHtml()` prevents this behavior.
	$full_html = $dom->saveHtml();

	// Find the <body> open/close tags. The open tag needs to be adjusted so we get inside the tag
	// and not the tag itself.
	$start = strpos( $full_html, '<body>', 0 ) + strlen( '<body>' );
	$end   = strpos( $full_html, '</body>', $start );
	return trim( substr( $full_html, $start, $end - $start ) );
}
add_filter( 'render_block', 'gutenberg_apply_block_supports', 10, 2 );

/**
 * Normalizes spacing in a string representing a CSS rule
 *
 * @example
 * 'color  :red;' becomes 'color:red'
 *
 * @param  string $css_rule_string CSS rule.
 * @return string Normalized CSS rule.
 */
function gutenberg_normalize_css_rule( $css_rule_string ) {
	return trim( implode( ': ', preg_split( '/\s*:\s*/', $css_rule_string, 2 ) ), ';' );
}
