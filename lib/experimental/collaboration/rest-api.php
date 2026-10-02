<?php
/**
 * REST API compatibility functions for real-time collaboration.
 *
 * @package gutenberg
 */

/**
 * Overrides the default REST controller for autosaves to fix real-time
 * collaboration on draft posts.
 *
 * When RTC is enabled, regular draft autosaves are stored as revisions instead
 * of updating the parent post based on its lock and author. Auto-drafts are
 * still promoted to drafts.
 *
 * Only overrides when RTC is enabled and autosave_rest_controller_class is not
 * explicitly set, i.e. when WP_REST_Autosaves_Controller would be used by
 * default. Post types with their own specialized autosave controller (e.g.
 * templates) are left alone.
 *
 * @param array $args Array of arguments for registering a post type.
 * @return array Modified array of arguments.
 */
function gutenberg_override_autosaves_rest_controller( $args ) {
	if ( empty( $args['autosave_rest_controller_class'] ) && wp_is_collaboration_enabled() ) {
		$args['autosave_rest_controller_class'] = 'Gutenberg_REST_Autosaves_Controller';
	}
	return $args;
}

add_filter( 'register_post_type_args', 'gutenberg_override_autosaves_rest_controller', 10, 1 );

/**
 * Adds a `collaboration_disabled` field to post types that support real-time
 * collaboration, so the editor knows whether to sync the post it loads.
 *
 * @since 7.2.0
 */
function gutenberg_register_collaboration_disabled_rest_field() {
	if ( ! wp_is_collaboration_enabled() ) {
		return;
	}

	$post_types = array_values(
		array_filter(
			get_post_types( array( 'show_in_rest' => true ) ),
			static function ( $post_type ) {
				return ! wp_is_post_type_collaboration_disabled( $post_type );
			}
		)
	);

	register_rest_field(
		$post_types,
		'collaboration_disabled',
		array(
			'schema'       => array(
				'description' => __( 'Whether real-time collaboration is disabled for the post.', 'gutenberg' ),
				'type'        => 'boolean',
				'context'     => array( 'edit' ),
				'readonly'    => true,
			),
			'get_callback' => static function ( $item ) {
				// Templates use a string ID and carry the post ID in `wp_id`.
				$post = get_post( isset( $item['wp_id'] ) ? $item['wp_id'] : $item['id'] );

				// Leave records that are not stored as posts to the post type check.
				return $post ? wp_is_post_collaboration_disabled( $post ) : false;
			},
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_collaboration_disabled_rest_field' );
