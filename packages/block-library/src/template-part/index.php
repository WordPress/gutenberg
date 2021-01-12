<?php
/**
 * Server-side rendering of the `core/template-part` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/template-part` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The render.
 */
function render_block_core_template_part( $attributes ) {
	$content = null;

	$template_part = gutenberg_get_block_template( $attributes['slug'], 'wp_template_part' );

	if ( is_null( $template_part ) ) {
		return 'Template Part Not Found';
	} else {
		$content = $template_part->content;
	}

	// Run through the actions that are typically taken on the_content.
	$content = do_blocks( $content );
	$content = wptexturize( $content );
	$content = convert_smilies( $content );
	$content = wpautop( $content );
	$content = shortcode_unautop( $content );
	if ( function_exists( 'wp_filter_content_tags' ) ) {
		$content = wp_filter_content_tags( $content );
	} else {
		$content = wp_make_content_images_responsive( $content );
	}
	$content            = do_shortcode( $content );
	$html_tag           = esc_attr( $attributes['tagName'] );
	$wrapper_attributes = get_block_wrapper_attributes();

	return "<$html_tag $wrapper_attributes>" . str_replace( ']]>', ']]&gt;', $content ) . "</$html_tag>";
}

/**
 * Registers the `core/template-part` block on the server.
 */
function register_block_core_template_part() {
	register_block_type_from_metadata(
		__DIR__ . '/template-part',
		array(
			'render_callback' => 'render_block_core_template_part',
		)
	);
}
add_action( 'init', 'register_block_core_template_part' );
