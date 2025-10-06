<?php
/**
 * Post Data source for the block bindings.
 *
 * @since 6.9.0
 * @package gutenberg
 * @subpackage Block Bindings
 */

/**
 * Gets value for Post Data source.
 *
 * @since 6.9.0
 * @access private
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "key" => "foo" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_post_data_get_value( array $source_args, $block_instance ) {
	if ( empty( $source_args['key'] ) ) {
		return null;
	}

	// Hardcoded exception for navigation blocks (temporary for WP 6.9)
	// TODO: Replace with proper binding configuration API in WP 7.0
	// See https://github.com/WordPress/gutenberg/pull/71002
	$block_name          = $block_instance->name ?? '';
	$is_navigation_block = in_array(
		$block_name,
		array( 'core/navigation-link', 'core/navigation-submenu' ),
		true
	);

	if ( $is_navigation_block ) {
		// Navigation blocks: read from block attributes
		$post_id = $block_instance->attributes['id'] ?? null;
	} else {
		// All other blocks: use context
		$post_id = $block_instance->context['postId'] ?? null;
	}

	// If we don't have an entity ID, bail early.
	if ( empty( $post_id ) ) {
		return null;
	}

	// If a post isn't public, we need to prevent unauthorized users from accessing the post data.
	$post = get_post( $post_id );
	if ( ( ! is_post_publicly_viewable( $post ) && ! current_user_can( 'read_post', $post_id ) ) || post_password_required( $post ) ) {
		return null;
	}

	if ( 'date' === $source_args['key'] ) {
		return esc_attr( get_the_date( 'c', $post_id ) );
	}

	if ( 'modified' === $source_args['key'] ) {
		// Only return the modified date if it is later than the publishing date.
		if ( get_the_modified_date( 'U', $post_id ) > get_the_date( 'U', $post_id ) ) {
			return esc_attr( get_the_modified_date( 'c', $post_id ) );
		} else {
			return '';
		}
	}

	if ( 'link' === $source_args['key'] ) {
		$permalink = get_permalink( $post_id );
		return is_wp_error( $permalink ) ? null : esc_url( $permalink );
	}
}

/**
 * Registers Post Data source in the block bindings registry.
 *
 * @since 6.9.0
 * @access private
 */
function gutenberg_register_block_bindings_post_data_source() {
	if ( get_block_bindings_source( 'core/post-data' ) ) {
		// The source is already registered.
		return;
	}

	register_block_bindings_source(
		'core/post-data',
		array(
			'label'              => _x( 'Post Data', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_post_data_get_value',
			'uses_context'       => array( 'postId', 'postType' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_post_data_source' );
