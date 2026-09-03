<?php

/**
 * Core class used to access templates via the REST API for WordPress 7.2.
 *
 * This class extension guards the "revert to theme" path of `update_item`.
 * Core deletes the template's post before checking that a theme or plugin
 * version of the template exists, so reverting a template that only exists
 * in the database destroys it and then crashes with a fatal error when the
 * refetched template is `null`.
 *
 * Note: this change needs to be backported to WordPress core.
 * See `WP_REST_Templates_Controller::update_item()`.
 *
 * @see Gutenberg_REST_Templates_Controller_7_0
 */
class Gutenberg_REST_Templates_Controller_7_2 extends Gutenberg_REST_Templates_Controller_7_0 {
	/**
	 * Updates a single template.
	 *
	 * @since 5.8.0
	 * @since 7.2.0 Reverting to the theme version is refused when no theme or
	 *              plugin version of the template exists, instead of deleting
	 *              the template and crashing.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error object on failure.
	 */
	public function update_item( $request ) {
		//////////////////////////////
		// START CORE MODIFICATIONS //
		//////////////////////////////
		if ( isset( $request['source'] ) && 'theme' === $request['source'] && ! get_block_file_template( $request['id'], $this->post_type ) ) {
			return new WP_Error(
				'rest_invalid_template',
				__( 'This template cannot be reverted because the active theme and plugins do not provide a version of it.' ),
				array( 'status' => 400 )
			);
		}
		//////////////////////////////
		// END CORE MODIFICATIONS //
		//////////////////////////////

		return parent::update_item( $request );
	}
}
