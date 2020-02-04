<?php
/**
 * Global styles functions, filters and actions, etc.
 *
 * @package gutenberg
 */

/**
 * Whether theme has support for Global Styles
 *
 * @return boolean
 */
function gutenberg_global_styles_has_theme_support() {
	return is_readable( locate_template( 'experimental-theme.json' ) );
}

/**
 * Function that given a branch of the global styles object recursively generates
 * an array defining all the css vars that the global styles object represents.
 *
 * @param array  $global_styles_branch Array representing a brach of the global styles object.
 * @param string $prefix Prefix to append to each variable.
 * @param bool   $is_start Indicates if we are on the first call to gutenberg_get_css_vars (outside the recursion).
 * @return array An array whose keys are css variable names and whose values are the css variables value.
 */
function gutenberg_global_styles_get_css_vars( $global_styles_branch, $prefix = '', $is_start = true ) {
	$result = array();
	foreach ( $global_styles_branch as $key => $value ) {
		$processed_key = str_replace( '/', '-', $key );
		$separator     = $is_start ? '' : '--';
		$new_key       = ( $prefix ? $prefix . $separator : '' ) . $processed_key;

		if ( is_array( $value ) ) {
			$result = array_merge(
				$result,
				gutenberg_global_styles_get_css_vars( $value, $new_key, false )
			);
		} else {
			$result[ $new_key ] = $value;
		}
	}
	return $result;
}

/**
 * Returns an array containing the Global Styles
 * design tokens found in a file. A void array if none.
 *
 * @param string $global_styles_path Path to file.
 * @return array Global Styles design tokens.
 */
function gutenberg_global_styles_get_from_file( $global_styles_path ) {
	$global_styles = [];
	if ( file_exists( $global_styles_path ) ) {
		$decoded_file = json_decode(
			file_get_contents( $global_styles_path ),
			true
		);
		if ( is_array( $decoded_file ) ) {
			$global_styles = $decoded_file;
		}
	}
	return $global_styles;
}

/**
 * Returns an array containing the Global Styles
 * design tokens found in a given CPT. A void array if none.
 *
 * @return array Global Styles design tokens.
 */
function gutenberg_global_styles_get_from_cpt() {
	// TODO: fetch from CPT.
	return [];
}

/**
 * Fetches the Global Styles design tokens (defaults, theme, user),
 * and enqueues the resulting CSS custom properties if any.
 */
function gutenberg_global_styles_enqueue_assets() {
	if ( ! gutenberg_global_styles_has_theme_support() ) {
		return;
	}

	$default_global_styles = gutenberg_global_styles_get_from_file( dirname( dirname( __FILE__ ) ) . '/experimental-default-global-styles.json' );
	$theme_global_styles   = gutenberg_global_styles_get_from_file( locate_template( 'experimental-theme.json' ) );
	$user_global_styles    = gutenberg_global_styles_get_from_cpt();
	$global_styles         = array_merge(
		$default_global_styles,
		$theme_global_styles,
		$user_global_styles,
	);

	$css_vars = gutenberg_global_styles_get_css_vars( $global_styles, '--wp-' );
	if ( empty( $css_vars ) ) {
		return;
	}

	$inline_style = ":root {\n";
	foreach ( $css_vars as $var => $value ) {
		$inline_style = "\t" . $var . ': ' . $value . ";\n";
	}
	$inline_style = '}';

	wp_register_style( 'global-styles', false, array(), true, true );
	wp_add_inline_style( 'global-styles', $inline_style );
	wp_enqueue_style( 'global-styles' );
}
add_action( 'enqueue_block_assets', 'gutenberg_global_styles_enqueue_assets' );

/**
 * Adds class wp-gs to the frontend body class
 * if the theme has support for Global Styles.
 *
 * @param array $classes Existing body classes.
 * @return array The filtered array of body classes.
 */
function gutenberg_global_styles_add_wp_gs_class_front_end( $classes ) {
	if ( gutenberg_global_styles_has_theme_support() ) {
		return array_merge( $classes, array( 'wp-gs' ) );
	}
	return $classes;
}
add_filter( 'body_class', 'gutenberg_global_styles_add_wp_gs_class_front_end' );


/**
 * Adds class wp-gs to the block-editor body class
 * if the theme has support for Global Styles.
 *
 * @param string $classes Existing body classes separated by space.
 * @return string The filtered string of body classes.
 */
function gutenberg_global_styles_add_wp_gs_class_editor( $classes ) {
	global $current_screen;
	if ( $current_screen->is_block_editor() && gutenberg_global_styles_has_theme_support() ) {
		return $classes . ' wp-gs';
	}
	return $classes;
}
add_filter( 'admin_body_class', 'gutenberg_global_styles_add_wp_gs_class_editor' );
