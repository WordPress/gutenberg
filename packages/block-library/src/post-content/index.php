<?php
/**
 * Server-side rendering of the `core/post-content` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/post-content` block on the server.
 *
 * @param array    $attributes Block attributes.
 * @param string   $content    Block default content.
 * @param WP_Block $block      Block instance.
 * @return string Returns the filtered post content of the current post.
 */
function render_block_core_post_content( $attributes, $content, $block ) {
	static $seen_ids = array();

	if ( ! isset( $block->context['postId'] ) ) {
		return '';
	}

	$post_id = $block->context['postId'];

	if ( isset( $seen_ids[ $post_id ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	$seen_ids[ $post_id ] = true;

	// When inside the main loop, we want to use queried object
	// so that `the_preview` for the current post can apply.
	// We force this behavior by omitting the third argument (post ID) from the `get_the_content`.
	$content = get_the_content();
	// Check for nextpage to display page links for paginated posts.
	if ( has_block( 'core/nextpage' ) ) {
		$content .= wp_link_pages( array( 'echo' => 0 ) );
	}

	/** This filter is documented in wp-includes/post-template.php */
	$content = apply_filters( 'the_content', str_replace( ']]>', ']]&gt;', $content ) );
	unset( $seen_ids[ $post_id ] );

	if ( empty( $content ) ) {
		return '';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => 'entry-content' ) );

	// Allow `first_child` and `last_child` insertion.
	// As the Post Content block simply renders the markup returned by the
	// `get_the_content()` function (wrapped in a `<div>` block wrapper),
	// Limitations:
	// - Changes to anchor block by get_hooked_block_markup() aren't respected.
	// - No $context available.

	$context           = null;
	$anchor_block_type = 'core/post-content';
	$anchor_block      = array(
		'blockName'  => $anchor_block_type,
		'attributes' => $attributes,
	);
	$hooked_blocks     = get_hooked_blocks();

	$first_child_markup             = '';
	$hooked_block_types_first_child = isset( $hooked_blocks[ $anchor_block_type ]['first_child'] )
		? $hooked_blocks[ $anchor_block_type ]['first_child']
		: array();

	$hooked_block_types_first_child = apply_filters( 'hooked_block_types', $hooked_block_types_first_child, 'first_child', $anchor_block_type, $context );
	foreach ( $hooked_block_types_first_child as $hooked_block_type_first_child ) {
		$first_child_markup .= get_hooked_block_markup( $anchor_block, $hooked_block_type_first_child );
	}

	// TODO: Should run `get_the_content` and apply `the_content` filter here.

	$last_child_markup             = '';
	$hooked_block_types_last_child = isset( $hooked_blocks[ $anchor_block_type ]['last_child'] )
		? $hooked_blocks[ $anchor_block_type ]['last_child']
		: array();

	$hooked_block_types_last_child = apply_filters( 'hooked_block_types', $hooked_block_types_last_child, 'last_child', $anchor_block_type, $context );
	foreach ( $hooked_block_types_last_child as $hooked_block_type_last_child ) {
		// $parent_block should be a reference. That's an array. Tricky.
		$last_child_markup .= get_hooked_block_markup( $anchor_block, $hooked_block_type_last_child );
	}

	return (
		'<div ' . $wrapper_attributes . '>' .
			$first_child_markup . $content . $last_child_markup .
		'</div>'
	);
}

/**
 * Registers the `core/post-content` block on the server.
 */
function register_block_core_post_content() {
	register_block_type_from_metadata(
		__DIR__ . '/post-content',
		array(
			'render_callback' => 'render_block_core_post_content',
		)
	);
}
add_action( 'init', 'register_block_core_post_content' );
