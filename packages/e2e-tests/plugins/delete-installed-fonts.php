<?php
/**
 * Plugin Name: Gutenberg Test Delete Installed Fonts
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-delete-installed-fonts
 */

/**
 * Saves a randomly generated temporary font directory to use for e2e tests.
 */
function gutenberg_e2e_set_temp_font_dir() {
	update_option( 'gutenberg_e2e_font_dir', '/e2e_fonts_' . wp_generate_uuid4() );
}
register_activation_hook( __FILE__, 'gutenberg_e2e_set_temp_font_dir' );

/**
 * Uses the randomly generated font directory for the duration of the font tests.
 */
function gutenberg_filter_e2e_font_dir( $font_dir ) {
	$subdir = get_option( 'gutenberg_e2e_font_dir' );

	$font_dir['path']    .= $subdir;
	$font_dir['url']     .= $subdir;
	$font_dir['basedir'] .= $subdir;
	$font_dir['baseurl'] .= $subdir;

	return $font_dir;
}
add_filter( 'font_dir', 'gutenberg_filter_e2e_font_dir' );

/**
 * Deletes all user installed fonts, associated font files, the fonts directory, and user global styles typography
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
	$global_styles_post_id = WP_Theme_JSON_Resolver_Gutenberg::get_user_global_styles_post_id();
	$request               = new WP_REST_Request( 'POST', '/wp/v2/global-styles/' . $global_styles_post_id );
	$request->set_body_params( array( 'settings' => array( 'typography' => array( 'fontFamilies' => array() ) ) ) );

	rest_do_request( $request );
}

// Clean up fonts on plugin activation and deactivation.
register_activation_hook( __FILE__, 'gutenberg_delete_installed_fonts' );
register_deactivation_hook( __FILE__, 'gutenberg_delete_installed_fonts' );
