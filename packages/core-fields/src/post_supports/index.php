<?php
/**
 * Places the fields of the `post_supports` collection: the default fields of
 * every post type exposed in the REST API, each derived from a support of the
 * post type.
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
 * @package gutenberg
 */

/**
 * Registers the fields of the collection for the post types they apply to.
 *
 * @param Gutenberg_Fields_Registry $registry The registry being read.
 * @param array[]                   $fields   The fields of the collection, each with an `id`.
 * @param string|null               $module   The script module of the collection, if any.
 */
return static function ( $registry, $fields, $module ) {
	$fields = array_column( $fields, null, 'id' );

	foreach ( get_post_types( array( 'show_in_rest' => true ) ) as $post_type ) {
		if ( isset( $fields['author'] ) && post_type_supports( $post_type, 'author' ) ) {
			$registry->register( 'core', 'postType', $post_type, array( $fields['author'] ), $module );
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
};
