<?php
/**
 * Server-side rendering of the `core/term-description` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/term-description` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_term_description( $attributes, $content, $block ) {

	$description = false;
	if ( is_category() ) {
		$description = category_description();
	} else if ( is_tag() ) {
		$description = tag_description();
	} else if ( is_tax() ) {
		$description = term_description();
	}

	if ( $description ) {
		$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'term-description' ) );
		return '<div ' . $wrapper_attributes . '>' . $description . '</div>';
	}

	return '';
}

/**
 * Registers the `core/term-description` block on the server.
 */
function register_block_core_term_description() {
	register_block_type_from_metadata(
		__DIR__ . '/term-description',
		array(
			'render_callback' => 'render_block_core_term_description',
		)
	);
}
add_action( 'init', 'register_block_core_term_description' );
