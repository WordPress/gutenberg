<?php
/**
 * REST API: WP_REST_Template_Parts_Controller class
 *
 * @subpackage REST_API
 * @package    WordPress
 */

/**
 * Core class used to access menu templte parts via the REST API.
 *
 * @see   WP_REST_Controller
 */
class WP_REST_Template_Parts_Controller extends WP_REST_Posts_Controller {

	/**
	 * Retrieves a list of template parts.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_items( $request ) {
		_gutenberg_synchronize_theme_templates( 'template-part' );

		return parent::get_items( $request );
	}

	/**
	 * Retrieves a single template parat.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function get_item( $request ) {
		_gutenberg_synchronize_theme_templates( 'template-part' );

		return parent::get_items( $request );
	}
}
