<?php

// @core-merge: the following function is not needed, since the WP_REST_Font_Faces_Controller can be modified directly.
/**
 * Overrides the default REST controller for the wp_font_face post type.
 *
 * @param array  $arg       Post type registration arguments.
 * @param string $post_type Post type name.
 *
 * @return array Filtered post type registration arguments.
 */
function gutenberg_register_font_post_type_args( $arg, $post_type ) {
	global $wp_version;

	if ( 'wp_font_face' === $post_type && version_compare( $wp_version, '6.6', '<' ) ) {
		$arg['rest_controller_class'] = 'Gutenberg_REST_Font_Faces_Controller';
	}

	return $arg;
}
add_filter( 'register_post_type_args', 'gutenberg_register_font_post_type_args', 10, 2 );

// @core-merge: adds the following function's contents directly to _wp_after_delete_font_family.
/**
	 * Deletes the font family subdirectiory when the font family is deleted.
	 *
	 * @param int     $post_id Post ID.
	 * @param WP_Post $post    Post object.
	 */
function gutenberg_after_delete_font_family( $post_id, $post ) {
	global $wp_version;

	if ( 'wp_font_family' !== $post->post_type || version_compare( $wp_version, '6.6', '>=' ) ) {
		return;
	}

	$font_subdir = trailingslashit( wp_get_font_dir()['path'] ) . $post->post_name;

	if ( is_dir( $font_subdir ) ) {
		rmdir( $font_subdir );
	}
}
add_action( 'deleted_post', 'gutenberg_after_delete_font_family', 10, 2 );
