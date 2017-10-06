<?php
/**
 * Initialization and wp-admin integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Return whether the post can be edited in Gutenberg and by the current user.
 *
 * Gutenberg depends on the REST API, and if the post type is not shown in the
 * REST API, then the post cannot be edited in Gutenberg.
 *
 * @since 0.5.0
 *
 * @param int $post_id Post.
 * @return bool Whether the post can be edited with Gutenberg.
 */
function gutenberg_can_edit_post( $post_id ) {
	$post = get_post( $post_id );
	if ( ! $post || ! post_type_exists( $post->post_type ) ) {
		return false;
	}
	$post_type_object = get_post_type_object( $post->post_type );
	if ( ! $post_type_object->show_in_rest ) {
		return false;
	}
	return current_user_can( 'edit_post', $post_id );
}

/**
 * Determine whether a post has blocks.
 *
 * @since 0.5.0
 *
 * @param object $post Post.
 * @return bool  Whether the post has blocks.
 */
function gutenberg_post_has_blocks( $post ) {
	$post = get_post( $post );
	return $post && strpos( $post->post_content, '<!-- wp:' ) !== false;
}

/**
 * Adds a "Gutenberg" post state for post tables, if the post contains blocks.
 *
 * @param  array   $post_states An array of post display states.
 * @param  WP_Post $post        The current post object.
 * @return array                A filtered array of post display states.
 */
function gutenberg_add_gutenberg_post_state( $post_states, $post ) {
	if ( gutenberg_post_has_blocks( $post ) ) {
		$post_states[] = 'Gutenberg';
	}

	return $post_states;
}
add_filter( 'display_post_states', 'gutenberg_add_gutenberg_post_state', 10, 2 );

/**
 * Registers custom post types required by the Gutenberg editor.
 *
 * @since 0.10.0
 */
function gutenberg_register_post_types() {
	register_post_type( 'gb_reusable_block', array(
		'public' => false,
	) );
}
add_action( 'init', 'gutenberg_register_post_types' );

/**
 * Registers the REST API routes needed by the Gutenberg editor.
 *
 * @since 0.10.0
 */
function gutenberg_register_rest_routes() {
	$controller = new WP_REST_Reusable_Blocks_Controller();
	$controller->register_routes();
}
add_action( 'rest_api_init', 'gutenberg_register_rest_routes' );

