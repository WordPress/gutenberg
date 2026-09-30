<?php
/**
 * Registers the fields of the `post_supports` collection: the default fields
 * of every post type exposed in the REST API, each derived from a support of
 * the post type.
 *
 * - `author`, for the post types supporting `author`.
 * - `comment_status`, for the post types supporting `comments`.
 * - `notesCount`, for the post types whose `editor` support has the `notes`
 *   argument.
 *
 * Only the author field has JavaScript parts, so it is the only one
 * registered with the script module of the collection: a post type without
 * authors does not load the module.
 *
 * @package WordPress
 */

/**
 * Registers the fields of the `post_supports` collection for the post types
 * they apply to.
 *
 * The fields depend on the supports of the post type, which are not final
 * until `init` completes: core registers its post types on `init` at
 * priority 0, custom post types are usually registered at the default
 * priority, and plugins add or remove supports on `init` too. Hence it runs
 * on `fields_api_init`, which the registry fires on its first read, after
 * `init`. At priority 0, so a plugin altering the defaults on the registry
 * at the default priority sees them registered. The post types whose fields
 * differ from these defaults adjust them in their own collection, at
 * priority 9.
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_fields_post_supports( $registry ) {
	$fields = wp_get_field_collection_fields( __DIR__ );

	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		if ( isset( $fields['author'] ) && post_type_supports( $post_type, 'author' ) ) {
			$registry->register( 'core', 'postType', $post_type, array( $fields['author'] ), '@wordpress/core-fields/post_supports' );
		}

		// The remaining fields are plain data: no script module.
		$data_fields = array();

		if ( isset( $fields['comment_status'] ) && post_type_supports( $post_type, 'comments' ) ) {
			$data_fields[] = $fields['comment_status'];
		}

		// Notes are declared as an argument of the `editor` support, e.g.
		// `'supports' => array( 'editor' => array( 'notes' => true ) )`, which
		// WordPress stores as a list of argument arrays. A bare `editor`
		// support is stored as `true`, hence the array check.
		$editor_args = get_all_post_type_supports( $post_type )['editor'] ?? null;
		if ( isset( $fields['notesCount'] ) && is_array( $editor_args ) && array_filter( array_column( $editor_args, 'notes' ) ) ) {
			$data_fields[] = $fields['notesCount'];
		}

		if ( ! empty( $data_fields ) ) {
			$registry->register( 'core', 'postType', $post_type, $data_fields );
		}
	}
}
add_action( 'fields_api_init', 'register_core_fields_post_supports', 0 );
