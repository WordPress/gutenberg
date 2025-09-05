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

	if ( empty( $block_instance->context['postId'] ) ) {
		return null;
	}
	$post_id = $block_instance->context['postId'];

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
			'uses_context'       => array( 'postId' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_post_data_source' );
