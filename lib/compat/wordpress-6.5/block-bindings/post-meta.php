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

	// Check if the meta field is protected.
	if ( is_protected_meta( $source_attrs['key'], 'post' ) ) {
		return null;
	}

	// Check if the meta field is registered to be shown in REST.
	// It follows the format: $wp_meta_keys[ $object_type ][ $object_subtype ][ $meta_key ].
	global $wp_meta_keys;
	$object_subtype = 'post' === $block_instance->context['postType'] ? '' : $block_instance->context['postType'];
	if ( empty( $wp_meta_keys['post'][ $object_subtype ][ $source_attrs['key'] ]['show_in_rest'] ) || false === $wp_meta_keys['post'][ $object_subtype ][ $source_attrs['key'] ]['show_in_rest'] ) {
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
