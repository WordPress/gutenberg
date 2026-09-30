<?php
/**
 * Registers the fields of WordPress core through the Fields API, like a
 * plugin registers its own.
 *
 * The default fields every post type derives from its supports are
 * registered in code, see register_core_post_type_supports_fields(). Their
 * definitions are the `field.php` files of the `post_type_supports` folder. The
 * post types whose fields differ from the defaults exclude the ones they do
 * not get on the `fields_api_post_type_supports_exclusions` filter, as a
 * plugin would, see exclude_core_post_type_support_fields().
 *
 * The fields of a single post type are declarative collections, the other
 * folders next to this file, see wp_register_field_collection() for their
 * format.
 *
 * @package WordPress
 */

/**
 * Registers the default fields of each post type exposed in the REST API,
 * from what it supports:
 *
 * - `author`, for the post types supporting `author`.
 * - `comment_status`, for the post types supporting `comments`.
 * - `discussion`, for the post types supporting `comments` or `trackbacks`.
 * - `excerpt`, for the post types supporting `excerpt`.
 * - `notesCount`, for the post types whose `editor` support has the `notes`
 *   argument.
 * - `ping_status`, for the post types supporting `trackbacks`.
 *
 * It makes no exception for any post type: the fields a post type does not
 * get are excluded on the `fields_api_post_type_supports_exclusions` filter,
 * before they are registered.
 *
 * Only some fields have JavaScript parts, but every field is registered
 * with the script module of the folder: a post type supporting only
 * comments or notes lists the module too, which is small.
 *
 * @since 7.2.0
 *
 * @param WP_Fields_Registry $registry The registry being read.
 */
function register_core_post_type_supports_fields( $registry ) {
	$definitions = wp_get_field_collection_fields( __DIR__ . '/post_type_supports' );

	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		// WordPress stores the arguments of a support as a list of argument
		// arrays, and a support without arguments as `true`.
		$editor = get_all_post_type_supports( $post_type )['editor'] ?? null;

		$applies = array(
			'author'         => post_type_supports( $post_type, 'author' ),
			'comment_status' => post_type_supports( $post_type, 'comments' ),
			'discussion'     => post_type_supports( $post_type, 'comments' ) || post_type_supports( $post_type, 'trackbacks' ),
			'excerpt'        => post_type_supports( $post_type, 'excerpt' ),
			'notesCount'     => is_array( $editor ) && (bool) array_filter( array_column( $editor, 'notes' ) ),
			'ping_status'    => post_type_supports( $post_type, 'trackbacks' ),
		);
		$all_fields = array_keys( array_filter( $applies ) );
		if ( ! $all_fields ) {
			continue;
		}

		/**
		 * Filters the default fields a post type does not get from its
		 * supports.
		 *
		 * A post type whose fields differ from the defaults excludes some
		 * or all of them here, before they are registered, and registers
		 * its own if needed. Callbacks compose: add to the incoming list
		 * rather than replacing it.
		 *
		 * The filter runs when the registry fires `fields_api_init`, on its
		 * first read after `init`: add callbacks on plugin load or on
		 * `init`, not later.
		 *
		 * @since 7.2.0
		 *
		 * @param string[] $excluded_fields The ids of the default fields the
		 *                                  post type does not get. Default
		 *                                  empty array.
		 * @param string   $post_type       The post type.
		 * @param string[] $all_fields      The ids of the default fields the
		 *                                  post type supports.
		 */
		$excluded_fields = apply_filters( 'fields_api_post_type_supports_exclusions', array(), $post_type, $all_fields );
		if ( ! is_array( $excluded_fields ) ) {
			_doing_it_wrong(
				__FUNCTION__,
				sprintf(
					/* translators: 1: The name of a filter. 2: A post type. */
					__( 'The %1$s filter must return a list of field ids. Nothing is excluded for the post type "%2$s".', 'gutenberg' ),
					'<code>fields_api_post_type_supports_exclusions</code>',
					$post_type
				),
				'7.2.0'
			);
			$excluded_fields = array();
		}

		// Keeps the alphabetical order of the folders.
		$fields = array_values( array_intersect_key( $definitions, array_flip( array_diff( $all_fields, $excluded_fields ) ) ) );
		if ( $fields ) {
			$registry->register( 'core', 'postType', $post_type, $fields, '@wordpress/core-fields/post_type_supports' );
		}
	}
}

/**
 * Excludes the default fields the core post types do not get:
 *
 * - Templates: `author`. Their author is the theme, plugin, site, or user
 *   that provides them rather than their post author, so the `wp_template`
 *   collection has its own author field.
 * - Template parts: `author`. They declare their own author field
 *   client-side.
 * - Templates, template parts, and patterns: `excerpt`. Their excerpt is
 *   their description: templates and patterns edit it with their own
 *   description fields, declared client-side (the one of patterns has the
 *   `excerpt` id), and template parts do not show it.
 * - Attachments: every default field. The media editor has its own fields,
 *   declared client-side and in the `attachment` collection.
 *
 * @since 7.2.0
 *
 * @param string[] $excluded_fields The ids of the default fields the post
 *                                  type does not get.
 * @param string   $post_type       The post type.
 * @param string[] $all_fields      The ids of the default fields the post
 *                                  type supports.
 * @return string[] The excluded ids, with those of the core post types.
 */
function exclude_core_post_type_support_fields( $excluded_fields, $post_type, $all_fields ) {
	switch ( $post_type ) {
		case 'wp_template':
		case 'wp_template_part':
			$excluded_fields[] = 'author';
			$excluded_fields[] = 'excerpt';
			break;
		case 'wp_block':
			$excluded_fields[] = 'excerpt';
			break;
		case 'attachment':
			$excluded_fields = array_merge( $excluded_fields, $all_fields );
			break;
	}
	return $excluded_fields;
}
add_filter( 'fields_api_post_type_supports_exclusions', 'exclude_core_post_type_support_fields', 10, 3 );

/**
 * Registers the fields of WordPress core: the defaults first, then the
 * collections of single post types.
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
	register_core_post_type_supports_fields( $registry );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template' );
	wp_register_field_collection( $registry, __DIR__ . '/wp_template_part' );
	wp_register_field_collection( $registry, __DIR__ . '/attachment' );
}
add_action( 'fields_api_init', 'register_core_field_collections', 0 );
