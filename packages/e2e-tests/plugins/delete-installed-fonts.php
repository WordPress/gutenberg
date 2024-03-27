<?php
/**
 * Plugin Name: Gutenberg Test Delete Installed Fonts
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-delete-installed-fonts
 */

/**
 * Delete all user installed fonts, associated font files, the fonts directory, and user global styles typography
 * setings for the current theme so that we can test uploading/installing fonts in a clean environment.
 */
function gutenberg_delete_installed_fonts() {
	$font_family_ids = new WP_Query(
		array(
			'post_type'      => 'wp_font_family',
			'posts_per_page' => -1,
			'fields'         => 'ids',
		)
	);

	// Delete all font families, their child font faces, and associated font files.
	foreach ( $font_family_ids->posts as $font_family_id ) {
		wp_delete_post( $font_family_id, true );
	}

	// Delete the font directory, which should now be empty.
	$font_path = wp_get_font_dir()['path'];

	if ( is_dir( $font_path ) ) {
		rmdir( $font_path );
	}

	// Delete any installed fonts from global styles.
	$global_styles_post_id = WP_Theme_JSON_Resolver::get_user_global_styles_post_id();
	$request               = new WP_REST_Request( 'POST', '/wp/v2/global-styles/' . $global_styles_post_id );
	$request->set_body_params( array( 'settings' => array( 'typography' => array( 'fontFamilies' => array() ) ) ) );

	rest_do_request( $request );
}
add_action( 'init', 'gutenberg_delete_installed_fonts' );
