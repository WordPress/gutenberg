<?php
/**
 * REST API: Gutenberg_REST_Templates_Controller_6_6 class
 *
 * @package    gutenberg
 */

/**
 * Gutenberg_REST_Templates_Controller_6_6 class
 *
 * Templates and template parts currently only allow access to administrators with the
 * `edit_theme_options` capability. In order to allow other roles to also view the templates,
 * we need to override the permissions check for the REST API endpoints.
 */
class Gutenberg_REST_Templates_Controller_6_6 extends Gutenberg_REST_Templates_Controller_6_4 {

	/**
	 * Checks if a given request has access to read templates.
	 *
	 * @since 6.6
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_items_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		/*
		 * Allow access to anyone who can edit posts.
		 */
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_cannot_manage_templates',
				__( 'Sorry, you are not allowed to access the templates on this site.', 'default' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}

	/**
	 * Checks if a given request has access to read templates.
	 *
	 * @since 6.6
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return true|WP_Error True if the request has read access, WP_Error object otherwise.
	 */
	public function get_item_permissions_check( $request ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		/*
		 * Allow access to anyone who can edit posts.
		 */
		if ( ! current_user_can( 'edit_posts' ) ) {
			return new WP_Error(
				'rest_cannot_manage_templates',
				__( 'Sorry, you are not allowed to access the templates on this site.', 'default' ),
				array(
					'status' => rest_authorization_required_code(),
				)
			);
		}

		return true;
	}
}
