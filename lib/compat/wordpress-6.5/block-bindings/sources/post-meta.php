<?php
/**
 * Add the post_meta source to the block bindings API.
 *
 * @package gutenberg
 */
function gutenberg_block_bindings_post_meta_callback( $source_attrs ) {
	if ( ! isset( $source_attrs['key'] ) ) {
		return null;
	}

	// Use the postId attribute if available
	if ( isset( $source_attrs['postId'] ) ) {
		$post_id = $source_attrs['postId'];
	} else {
		// I tried using $block_instance->context['postId'] but it wasn't available in the image block.
		$post_id = get_the_ID();
	}

	// If a post isn't public, we need to prevent
	// unauthorized users from accessing the post meta.
	$post = get_post( $post_id );
	if ( ( $post && 'publish' !== $post->post_status && ! current_user_can( 'read_post', $post_id ) ) || post_password_required( $post_id ) ) {
		return null;
	}

	return get_post_meta( $post_id, $source_attrs['key'], true );
}

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
		)
	);
}

add_action( 'init', 'gutenberg_register_block_bindings_post_meta_source' );
