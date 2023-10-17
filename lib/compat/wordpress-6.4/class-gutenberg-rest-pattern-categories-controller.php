<?php
/**
 * Gutenberg_REST_Pattern_Categories_Controller class
 *
 * Extends the WP_REST_Terms_Controller to handle permissions of pattern categories.
 *
 * @package Gutenberg
 * @subpackage REST_API
 * @since 6.4.0
 */

/**
 * Extends the WP_REST_Terms_Controller to handle permissions of pattern categories.
 *
 * @access public
 */
class Gutenberg_REST_Pattern_Categories_Controller extends WP_REST_Terms_Controller {
	/**
	 * Make pattern categories behave more like a hierarchical taxonomy in terms of permissions.
	 * Check the edit_terms cap to see whether term creation is possible.
	 *
	 * @since 6.4.0
	 *
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function create_item_permissions_check() {
		if ( ! $this->check_is_taxonomy_allowed( $this->taxonomy ) ) {
			return false;
		}

		$taxonomy_obj = get_taxonomy( $this->taxonomy );

		// Patterns categories are a flat hierarchy (like tags), but work more like post categories in terms of permissions.
		if ( ! current_user_can( $taxonomy_obj->cap->edit_terms ) ) {
			return new WP_Error(
				'rest_cannot_create',
				__( 'Sorry, you are not allowed to create terms in this taxonomy.' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}

		return true;
	}
}
