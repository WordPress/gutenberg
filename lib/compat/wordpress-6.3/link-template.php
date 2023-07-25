<?php
/**
 * Overrides Core's wp-includes/link-template.php for WP 6.3.
 *
 * @package gutenberg
 */

/**
 * Updates the post edit link using the `_edit_link` property in wp_global_styles`, `wp_template`,
 * and `wp_template_part` custom post types.
 *
 * `_edit_link` for these custom post types is added by `gutenberg_update_templates_template_parts_rest_controller()`
 * in lib/compat/wordpress-6.3/rest-api.php.
 *
 * This functionality has already been ported to Core. See https://github.com/WordPress/gutenberg/issues/48065
 * The following hook is a modified version that passes only 2 arguments to `sprintf()` to be compatible with WP <= 6.2.
 *
 * @param string $link    The edit link.
 * @param int    $post_id Post ID.
 * @return string|null The edit post link for the given post. Null if the post type does not exist
 *                     or does not allow an editing UI.
 */
function gutenberg_update_get_edit_post_link( $link, $post_id ) {
	$post = get_post( $post_id );

	if ( 'wp_template' === $post->post_type || 'wp_template_part' === $post->post_type ) {
		$post_type_object = get_post_type_object( $post->post_type );
		$slug             = urlencode( get_stylesheet() . '//' . $post->post_name );
		$link             = admin_url( sprintf( $post_type_object->_edit_link, $slug ) );
	}

	return $link;
}

add_filter( 'get_edit_post_link', 'gutenberg_update_get_edit_post_link', 10, 2 );



/**
 * Modifies the edit link for the `wp_navigation` custom post type.
 *
 * This has not been backported to Core.
 *
 * @param string $link    The edit link.
 * @param int    $post_id Post ID.
 * @return string|null The edit post link for the given post. Null if the post type does not exist
 *                     or does not allow an editing UI.
 */
function gutenberg_update_navigation_get_edit_post_link( $link, $post_id ) {
	$post = get_post( $post_id );

	if ( 'wp_navigation' === $post->post_type ) {
		$post_type_object = get_post_type_object( $post->post_type );
		$id               = $post->ID;
		$link             = admin_url( sprintf( $post_type_object->_edit_link, $id ) );
	}

	return $link;
}
add_filter( 'get_edit_post_link', 'gutenberg_update_navigation_get_edit_post_link', 10, 2 );
