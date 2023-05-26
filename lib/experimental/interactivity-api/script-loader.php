<?php
/**
 * Updates the script-loader.php file
 *
 * @package gutenberg
 */

/**
 * Registers interactivity runtime and vendor scripts to use with interactive blocks.
 *
 * @param WP_Scripts $scripts WP_Scripts instance.
 */
function gutenberg_register_interactivity_scripts( $scripts ) {
	// When in production, use the plugin's version as the default asset version;
	// else (for development or test) default to use the current time.
	$default_version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

	foreach ( array( 'vendors', 'runtime' ) as $script_name ) {
		$script_path = "build/block-library/interactivity/$script_name.min.js";
		// Replace extension with `.asset.php` to find the generated dependencies file.
		$asset_file   = gutenberg_dir_path() . substr( $script_path, 0, -( strlen( '.js' ) ) ) . '.asset.php';
		$asset        = file_exists( $asset_file )
			? require $asset_file
			: null;
		$dependencies = isset( $asset['dependencies'] ) ? $asset['dependencies'] : array();
		$version      = isset( $asset['version'] ) ? $asset['version'] : $default_version;

		gutenberg_override_script(
			$scripts,
			"wp-interactivity-$script_name",
			gutenberg_url( $script_path ),
			$dependencies,
			$version
		);
	}
}
add_action( 'wp_default_scripts', 'gutenberg_register_interactivity_scripts', 10, 1 );
