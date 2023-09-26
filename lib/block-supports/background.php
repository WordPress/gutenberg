<?php
/**
 * Background block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_background_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_background_support = block_has_support( $block_type, array( 'background' ), false );

	if ( $has_background_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Renders the background styles to the block wrapper.
 * This block support uses the `render_block` hook to ensure that
 * it is also applied to non-server-rendered blocks.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_background_support( $block_content, $block ) {
	$block_type                   = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$block_attributes             = $block['attrs'];
	$has_background_image_support = block_has_support( $block_type, array( 'background', 'backgroundImage' ), false );

	if (
		! $has_background_image_support ||
		wp_should_skip_block_supports_serialization( $block_type, 'background', 'backgroundImage' )
	) {
		return $block_content;
	}

	$background_image_source = $block_attributes['style']['background']['backgroundImage']['source'] ?? null;
	$background_image_url    = $block_attributes['style']['background']['backgroundImage']['url'] ?? null;
	$background_size         = $block_attributes['style']['background']['backgroundSize'] ?? 'cover';

	$background_block_styles = array();

	if (
		'file' === $background_image_source &&
		$background_image_url
	) {
		// Set file based background URL.
		// TODO: In a follow-up, similar logic could be added to inject a featured image url.
		$background_block_styles['backgroundImage']['url'] = $background_image_url;
		// Only output the background size when an image url is set.
		$background_block_styles['backgroundSize'] = $background_size;
	}

	$styles = gutenberg_style_engine_get_styles( array( 'background' => $background_block_styles ) );

	if ( ! empty( $styles['css'] ) ) {
		// Inject background styles to the first element, presuming it's the wrapper, if it exists.
		$tags = new WP_HTML_Tag_Processor( $block_content );

		if ( $tags->next_tag() ) {
			$existing_style = $tags->get_attribute( 'style' );
			$updated_style  = '';

			if ( ! empty( $existing_style ) && ! str_ends_with( $existing_style, ';' ) ) {
				$updated_style = $existing_style . '; ';
			}

			$updated_style .= $styles['css'];
			$tags->set_attribute( 'style', $updated_style );
		}

		return $tags->get_updated_html();
	}

	return $block_content;
}

/**
 * Style value parser that constructs a CSS definition array comprising a single CSS property and value.
 * If the provided value is an array containing a `url` property, the function will return a CSS definition array
 * with a single property and value, with `url` escaped and injected into a CSS `url()` function,
 * e.g., array( 'background-image' => "url( '...' )" ).
 *
 * @param array $style_value      A single raw style value from $block_styles array.
 * @param array $style_definition A single style definition from static::$block_style_definition_metadata.
 *
 * @return string[] An associative array of CSS definitions, e.g., array( "$property" => "$value", "$property" => "$value" ).
 */
function _gutenberg_block_supports_get_url_or_value_css_declaration( $style_value, $style_definition ) {
	if ( empty( $style_value ) ) {
		return array();
	}

	$css_declarations = array();

	if ( isset( $style_definition['property_keys']['default'] ) ) {
		$value = null;

		if ( ! empty( $style_value['url'] ) ) {
			$value = "url('" . $style_value['url'] . "')";
		} elseif ( is_string( $style_value ) ) {
			$value = $style_value;
		}

		if ( null !== $value ) {
			$css_declarations[ $style_definition['property_keys']['default'] ] = $value;
		}
	}

	return $css_declarations;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'background',
	array(
		'register_attribute' => 'gutenberg_register_background_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_background_support', 10, 2 );

WP_Style_Engine_Gutenberg::register_block_style_definitions_metadata(
	'background',
	array(
		'backgroundImage' => array(
			'property_keys' => array(
				'default' => 'background-image',
			),
			'value_func'    => '_gutenberg_block_supports_get_url_or_value_css_declaration',
			'path'          => array( 'background', 'backgroundImage' ),
		),
		'backgroundSize'  => array(
			'property_keys' => array(
				'default' => 'background-size',
			),
			'path'          => array( 'background', 'backgroundSize' ),
		),
	)
);
