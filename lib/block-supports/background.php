<?php
/**
 * Background block support flag.
 *
 * @package WordPress
 * @since 6.0.0
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @since 6.0.0
 * @access private
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function wp_register_background_image_support( $block_type ) {
	$has_background_image_support = block_has_support( $block_type, array( '__experimentalBackgroundImage' ), false );

	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( $has_background_image_support && ! array_key_exists( 'style', $block_type->attributes ) ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Checks whether serialization of the current block's background image properties should
 * occur.
 *
 * @since 5.9.0
 * @access private
 *
 * @param WP_Block_Type $block_type Block type.
 * @return bool Whether to serialize spacing support styles & classes.
 */
function wp_skip_background_image_serialization( $block_type ) {
	$background_image_support = _wp_array_get( $block_type->supports, array( '__experimentalBackgroundImage' ), false );

	return is_array( $background_image_support ) &&
		array_key_exists( '__experimentalSkipSerialization', $background_image_support ) &&
		$background_image_support['__experimentalSkipSerialization'];
}

/**
 * Renders the background image styles to the block wrapper.
 * This block support uses the `render_block` hook to ensure that
 * it is applied to non-server-rendered blocks.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_background_image_support( $block_content, $block ) {
	$block_type                   = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$block_attributes             = $block['attrs'];
	$has_background_image_support = gutenberg_block_has_support( $block_type, array( '__experimentalBackgroundImage' ), false );
	if ( ! $has_background_image_support || ! isset( $block_attributes['style']['backgroundImage'] ) ) {
		return $block_content;
	}

	if ( wp_skip_background_image_serialization( $block_type ) ) {
		return $block_content;
	}

	$styles = array();

	$background_image_source = _wp_array_get( $block_attributes, array( 'style', 'backgroundImage', 'source' ), null );
	$background_image_url    = _wp_array_get( $block_attributes, array( 'style', 'backgroundImage', 'url' ), null );

	if (
		'file' === $background_image_source &&
		$background_image_url
	) {
		$styles[] = sprintf( "background-image: url('%s')", esc_url( $background_image_url ) );
	}

	$inline_style = safecss_filter_attr( implode( '; ', $styles ) );

	// Attempt to update an existing style attribute on the wrapper element.
	$injected_style = preg_replace(
		'/^([^>.]+?)(' . preg_quote( 'style="', '/' ) . ')(?=.+?>)/',
		'$1$2' . $inline_style . '; ',
		$block_content,
		1
	);

	// If there is no existing style attribute, add one to the wrapper element.
	if ( $injected_style === $block_content ) {
		$injected_style = preg_replace(
			'/<([a-zA-Z0-9]+)([ >])/',
			'<$1 style="' . $inline_style . '"$2',
			$block_content,
			1
		);
	};

	return $injected_style;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'backgroundImage',
	array(
		'register_attribute' => 'wp_register_background_image_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_background_image_support', 10, 2 );
