<?php
/**
 * Media block support flag.
 *
 * @package gutenberg
 */

/**
 * Registers the style block attribute for block types that support it.
 *
 * @param WP_Block_Type $block_type Block Type.
 */
function gutenberg_register_media_support( $block_type ) {
	// Setup attributes and styles within that if needed.
	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	// Check for existing style attribute definition e.g. from block.json.
	if ( array_key_exists( 'style', $block_type->attributes ) ) {
		return;
	}

	$has_media_support = block_has_support( $block_type, array( 'media' ), false );

	if ( $has_media_support ) {
		$block_type->attributes['style'] = array(
			'type' => 'object',
		);
	}
}

/**
 * Renders the media styles to the block wrapper.
 * This block support uses the `render_block` hook to ensure that
 * it is also applied to non-server-rendered blocks.
 *
 * @param  string $block_content Rendered block content.
 * @param  array  $block         Block object.
 * @return string                Filtered block content.
 */
function gutenberg_render_media_support( $block_content, $block ) {
	$block_type                   = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	$block_attributes             = $block['attrs'];
	$has_background_image_support = block_has_support( $block_type, array( 'media', 'backgroundImage' ), false );

	if (
		! $has_background_image_support ||
		wp_should_skip_block_supports_serialization( $block_type, 'media', 'backgroundImage' )
	) {
		return $block_content;
	}

	// TODO: should we get the style engine to handle `backgroundImage`?

	$styles = array();

	$background_image_source = _wp_array_get( $block_attributes, array( 'style', 'media', 'backgroundImage', 'source' ), null );
	$background_image_url    = _wp_array_get( $block_attributes, array( 'style', 'media', 'backgroundImage', 'url' ), null );
	$background_size         = _wp_array_get( $block_attributes, array( 'style', 'media', 'backgroundSize' ), null );

	if ( empty( $background_size ) ) {
		$background_size = 'cover';
	}

	if (
		'file' === $background_image_source &&
		$background_image_url
	) {
		$styles[] = sprintf( "background-image: url('%s')", esc_url( $background_image_url ) );
	}

	// TODO: Yeah, for this to work reliably, it'd be better to run it through the style engine, I think.
	$styles[] = "background-size: $background_size";

	$inline_style = safecss_filter_attr( implode( '; ', $styles ) );

	// Inject media styles to the first element, presuming it's the wrapper, if it exists.
	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		$existing_style = $tags->get_attribute( 'style' );

		$updated_style = '';

		if ( ! empty( $existing_style ) && ! str_ends_with( $existing_style, ';' ) ) {
			$updated_style = $existing_style . '; ';
		}

		$updated_style .= $inline_style;
		$tags->set_attribute( 'style', $updated_style );
	}

	return $tags->get_updated_html();
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'dimensions',
	array(
		'register_attribute' => 'gutenberg_register_media_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_media_support', 10, 2 );
