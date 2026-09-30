<?php
/**
 * Registers the fields of WordPress core through the Fields API, like a
 * plugin registers its own.
 *
 * The default fields every post type derives from its supports are
 * registered in code, see register_core_post_supports_fields(). Their
 * definitions are the `field.php` files of the `post_supports` folder.
 *
 * The fields of a single post type are declarative collections, the other
 * folders next to this file, see wp_register_field_collection() for their
 * format. A post type whose fields differ from the defaults lists the
 * defaults it replaces or drops in the `unregister` of its collection, as a
 * plugin would.
 *
 * @package WordPress
 */

/**
 * Registers the default fields of each post type exposed in the REST API,
 * from what it supports:
 *
 * - `author`, for the post types supporting `author`.
 * - `comment_status`, for the post types supporting `comments`.
 * - `notesCount`, for the post types whose `editor` support has the `notes`
 *   argument.
 *
 * It makes no exception for any post type: a post type whose fields differ
 * unregisters the defaults it does not want, like a plugin does.
 *
 * Only the author field has JavaScript parts, but every field is registered
 * with the script module of the folder: a post type supporting only
 * comments or notes lists the module too, which is small.
 *
 * @since 7.2.0
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_post_supports_fields( $registry ) {
	$definitions = wp_get_field_collection_fields( __DIR__ . '/post_supports' );

	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		// WordPress stores the arguments of a support as a list of argument
		// arrays, and a support without arguments as `true`.
		$editor = get_all_post_type_supports( $post_type )['editor'] ?? null;

		$applies = array(
			'author'         => post_type_supports( $post_type, 'author' ),
			'comment_status' => post_type_supports( $post_type, 'comments' ),
			'notesCount'     => is_array( $editor ) && (bool) array_filter( array_column( $editor, 'notes' ) ),
		);

		// Keeps the alphabetical order of the folders.
		$fields = array_values( array_intersect_key( $definitions, array_filter( $applies ) ) );
		if ( $fields ) {
			$registry->register( 'core', 'postType', $post_type, $fields, '@wordpress/core-fields/post_supports' );
		}
	}
}

/**
 * Registers the fields of WordPress core: the defaults first, then the
 * collections of single post types, which may replace or drop them.
 *
 * Hooked at priority 0, so a plugin hooking `fields_api_init` at the
 * default priority sees the core fields registered, and can update or
 * unregister them.
 *
 * @since 7.2.0
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_field_collections( $registry ) {
	register_core_post_supports_fields( $registry );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template' );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template_part' );
	wp_register_field_collection( $registry, __DIR__ . '/attachment' );
}
add_action( 'fields_api_init', 'register_core_field_collections', 0 );
