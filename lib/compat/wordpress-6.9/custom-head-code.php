<?php
/**
 * Custom Head Code functionality for Site Editor.
 *
 * Allows users to add custom code snippets to the HTML <head> element
 * through the Site Editor interface, similar to Additional CSS.
 *
 * @package gutenberg
 * @since 6.9.0
 */

/**
 * Renders custom head code in the head section.
 *
 * Retrieves custom head code from Global Styles and outputs it in the <head>
 * section via the wp_head hook. Only users with 'unfiltered_html' capability
 * can add custom head code. On multisite, only Super Admins can use this feature.
 *
 * @since 6.9.0
 */
function gutenberg_custom_head_code_cb() {
	$head_code = gutenberg_get_custom_head_code();
	
	if ( empty( $head_code ) ) {
		return;
	}

	// Output the custom head code.
	echo wp_unslash( $head_code );
	echo "\n";
}

/**
 * Gets the custom head code from Global Styles.
 *
 * Retrieves the custom head code stored in the Global Styles post type
 * under the 'styles.headCode' property.
 *
 * @since 6.9.0
 *
 * @return string Custom head code, or empty string if not set.
 */
function gutenberg_get_custom_head_code() {
	// Get the user's global styles post directly from the database
	$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme() );
	
	if ( empty( $user_cpt ) ) {
		return '';
	}
	
	// Check if it's an array (contains 'ID' and 'post_content')
	if ( is_array( $user_cpt ) ) {
		$config = json_decode( $user_cpt['post_content'], true );
	} else {
		$config = json_decode( $user_cpt->post_content, true );
	}
	
	// Return the headCode if it exists
	return $config['styles']['headCode'] ?? '';
}

/**
 * Checks if the current user can edit custom head code.
 *
 * On multisite, only Super Admins can edit custom head code.
 * On single site, users need the 'unfiltered_html' capability.
 *
 * @since 6.9.0
 *
 * @return bool True if the user can edit custom head code, false otherwise.
 */
function gutenberg_can_edit_custom_head_code() {
	// On multisite, only Super Admins can edit custom head code.
	if ( is_multisite() && ! is_super_admin() ) {
		return false;
	}

	// Check for unfiltered_html capability.
	return current_user_can( 'unfiltered_html' );
}

// Hook into wp_head at priority 102 (after CSS at 101).
add_action( 'wp_head', 'gutenberg_custom_head_code_cb', 102 );