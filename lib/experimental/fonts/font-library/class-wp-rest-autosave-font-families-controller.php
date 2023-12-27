<?php
/**
 * Autosave Rest Font Families Controller.
 *
 * This file contains the class for the Autosave REST API Font Families Controller.
 *
 * @package    WordPress
 * @subpackage Font Library
 * @since      6.5.0
 */

if ( class_exists( 'WP_REST_Autosave_Font_Families_Controller' ) ) {
	return;
}

/**
 * Autosave Font Families Controller class.
 *
 * @since 6.5.0
 */
class WP_REST_Autosave_Font_Families_Controller {
	public function register_routes() {
		// disable autosave endpoints for font families
	}
}
