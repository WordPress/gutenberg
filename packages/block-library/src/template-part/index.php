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

	if ( ! empty( $attributes['postId'] ) ) {
		// If we have a post ID, which means this template part
		// is user-customized, render the corresponding post content.
		$content = get_post( $attributes['postId'] )->post_content;
	} elseif ( wp_get_theme()->get( 'TextDomain' ) === $attributes['theme'] ) {
		// Else, if the template part was provided by the active theme,
		// render the corresponding file content.
		$template_part_file_path =
				get_stylesheet_directory() . '/block-template-parts/' . $attributes['slug'] . '.html';
		if ( file_exists( $template_part_file_path ) ) {
			$content = file_get_contents( $template_part_file_path );
		}
	}

	if ( is_null( $content ) ) {
		return 'Template Part Not Found';
	}
	return apply_filters( 'the_template_part', str_replace( ']]>', ']]&gt;', $content ) );
}

/**
 * Registers the `core/template-part` block on the server.
 */
function register_block_core_template_part() {
	register_block_type(
		'core/template-part',
		array(
			'attributes'      => array(
				'postId' => array(
					'type' => 'number',
				),
				'slug'   => array(
					'type' => 'string',
				),
				'theme'  => array(
					'type' => 'string',
				),
			),
			'render_callback' => 'render_block_core_template_part',
		)
	);
}
add_action( 'init', 'register_block_core_template_part' );

// Add the filters that process the_template_part for template_parts.
add_filter( 'the_template_part', 'do_blocks', 9 );
add_filter( 'the_template_part', 'wptexturize' );
add_filter( 'the_template_part', 'convert_smilies', 20 );
add_filter( 'the_template_part', 'wpautop' );
add_filter( 'the_template_part', 'shortcode_unautop' );
add_filter( 'the_template_part', 'prepend_attachment' );
add_filter( 'the_template_part', 'wp_make_content_images_responsive' );
add_filter( 'the_template_part', 'do_shortcode', 11 ); // AFTER wpautop().
