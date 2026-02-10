<?php
/**
 * Content Guidelines Admin Page.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Handles the Content Guidelines admin page.
 */
class Gutenberg_Content_Guidelines_Admin_Page {

	/**
	 * Register the admin menu page.
	 */
	public static function register_menu() {
		add_options_page(
			__( 'Content Guidelines', 'gutenberg' ),
			__( 'Content Guidelines', 'gutenberg' ),
			'manage_options',
			'content-guidelines',
			array( __CLASS__, 'render_page' )
		);
	}

	/**
	 * Render the admin page.
	 */
	public static function render_page() {
		echo '<div id="content-guidelines-admin" class="wrap"></div>';
	}

	/**
	 * Enqueue scripts and styles for the admin page.
	 *
	 * @param string $hook The current admin page hook.
	 */
	public static function enqueue_scripts( $hook ) {
		if ( 'settings_page_content-guidelines' !== $hook ) {
			return;
		}

		$asset_file = gutenberg_dir_path() . 'build/scripts/content-guidelines/index.min.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$asset = include $asset_file;

		wp_enqueue_script(
			'gutenberg-content-guidelines',
			gutenberg_url( 'build/scripts/content-guidelines/index.min.js' ),
			$asset['dependencies'],
			$asset['version'],
			true
		);

		$style_path = gutenberg_dir_path() . 'build/styles/content-guidelines/style.css';
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'gutenberg-content-guidelines',
				gutenberg_url( 'build/styles/content-guidelines/style.css' ),
				array( 'wp-components', 'wp-base-styles' ),
				$asset['version']
			);
		}
	}
}
