<?php
/**
 * Post Meta source for the block bindings.
 *
 * @package gutenberg
 */

/**
 * Gets value for Post Meta source.
 *
 * @param array    $source_args    Array containing source arguments used to look up the override value.
 *                                 Example: array( "key" => "foo" ).
 * @param WP_Block $block_instance The block instance.
 * @return mixed The value computed for the source.
 */
function gutenberg_block_bindings_post_meta_callback( $source_attrs, $block_instance ) {
	if ( empty( $source_attrs['key'] ) ) {
		return null;
	}

	if ( empty( $block_instance->context['postId'] ) ) {
		return null;
	}
	$post_id = $block_instance->context['postId'];
	// If a post isn't public, we need to prevent unauthorized users from accessing the post meta.
	$post = get_post( $post_id );
	if ( ( ! is_post_publicly_viewable( $post ) && ! current_user_can( 'read_post', $post_id ) ) || post_password_required( $post ) ) {
		return null;
	}

	return get_post_meta( $post_id, $source_attrs['key'], true );
}

/**
 * Registers Post Meta source in the block bindings registry.
 */
function gutenberg_register_block_bindings_post_meta_source() {
	// Override the "core/post-meta" source from core.
	if ( array_key_exists( 'core/post-meta', get_all_registered_block_bindings_sources() ) ) {
		unregister_block_bindings_source( 'core/post-meta' );
	}
	register_block_bindings_source(
		'core/post-meta',
		array(
			'label'              => _x( 'Post Meta', 'block bindings source' ),
			'get_value_callback' => 'gutenberg_block_bindings_post_meta_callback',
			'uses_context'       => array( 'postId', 'postType' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_post_meta_source' );
