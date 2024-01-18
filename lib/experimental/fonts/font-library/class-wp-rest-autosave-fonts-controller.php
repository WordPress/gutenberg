<?php
/**
 * WP_REST_Autosave_Fonts_Controller class.
 *
 * This file contains the class for the REST API Autosave Font Families and Font Faces Controller.
 *
 * @package    WordPress
 * @subpackage REST_API
 * @since      6.5.0
 */

if ( class_exists( 'WP_REST_Autosave_Fonts_Controller' ) ) {
	return;
}

/**
 * Autosave Font Families Controller class.
 *
 * @since 6.5.0
 */
class WP_REST_Autosave_Fonts_Controller {
	public function register_routes() {
		// disable autosave endpoints for font families and faces.
	}
}
