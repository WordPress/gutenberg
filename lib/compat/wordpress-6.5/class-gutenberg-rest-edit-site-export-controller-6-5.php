<?php
/**
 * REST API: Gutenberg_REST_Edit_Site_Export_Controller class
 *
 * @package    Gutenberg
 * @subpackage REST_API
 */

/**
 * Core class used to access block patterns via the REST API.
 *
 * @since 6.4.0
 *
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Edit_Site_Export_Controller_6_5 extends WP_REST_Edit_Site_Export_Controller {
	/**
	 * Output a ZIP file with an export of the current templates
	 * and template parts from the site editor, and close the connection.
	 *
	 * @since 5.9.0
	 * @since 6.5.0 Use WP_Theme_Export class to generate theme zip file.
	 *
	 * @return WP_Error|void
	 */
	public function export() {
		// Generate the export file.
		$filename = WP_Theme_Export::generate_theme_export();

		if ( is_wp_error( $filename ) ) {
			$filename->add_data( array( 'status' => 500 ) );

			return $filename;
		}

		$theme_name = basename( get_stylesheet() );
		header( 'Content-Type: application/zip' );
		header( 'Content-Disposition: attachment; filename=' . $theme_name . '.zip' );
		header( 'Content-Length: ' . filesize( $filename ) );
		flush();
		readfile( $filename );
		unlink( $filename );
		exit;
	}
}
