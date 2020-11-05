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

	if ( ! empty( $attributes['postId'] ) && get_post_status( $attributes['postId'] ) ) {
		// If we have a post ID and the post exists, which means this template part
		// is user-customized, render the corresponding post content.
		$content = get_post( $attributes['postId'] )->post_content;
	} elseif ( isset( $attributes['theme'] ) && basename( wp_get_theme()->get_stylesheet() ) === $attributes['theme'] ) {
		$template_part_query = new WP_Query(
			array(
				'post_type'      => 'wp_template_part',
				'post_status'    => 'publish',
				'name'           => $attributes['slug'],
				'meta_key'       => 'theme',
				'meta_value'     => $attributes['theme'],
				'posts_per_page' => 1,
				'no_found_rows'  => true,
			)
		);
		$template_part_post  = $template_part_query->have_posts() ? $template_part_query->next_post() : null;
		if ( $template_part_post ) {
			// A published post might already exist if this template part was customized elsewhere
			// or if it's part of a customized template.
			$content = $template_part_post->post_content;
		} else {
			// Else, if the template part was provided by the active theme,
			// render the corresponding file content.
			$template_part_file_path = get_stylesheet_directory() . '/block-template-parts/' . $attributes['slug'] . '.html';
			if ( 0 === validate_file( $template_part_file_path ) && file_exists( $template_part_file_path ) ) {
				$content = file_get_contents( $template_part_file_path );
			}
		}
	}

	if ( is_null( $content ) ) {
		return 'Template Part Not Found';
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
