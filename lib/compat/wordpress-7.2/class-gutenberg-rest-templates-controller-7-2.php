<?php

/**
 * Core class used to access templates via the REST API for WordPress 7.2.
 *
 * This class extension protects against a fatal error when a `null` template
 * reaches `prepare_item_for_response`, which reads and assigns properties on
 * it. Core's `update_item` can pass `null` there: its "revert to theme" path
 * deletes the template's post before checking that a theme or plugin version
 * of the template exists, so reverting a template that only exists in the
 * database destroys it and then refetches `null`. `update_item` refuses such
 * reverts before deleting anything, and `prepare_item_for_response` answers
 * any remaining `null` with an error response instead of crashing.
 *
 * Note: these changes need to be backported to WordPress core.
 * See `WP_REST_Templates_Controller::update_item()` and
 * `WP_REST_Templates_Controller::prepare_item_for_response()`.
 *
 * @see Gutenberg_REST_Templates_Controller_7_0
 */
class Gutenberg_REST_Templates_Controller_7_2 extends Gutenberg_REST_Templates_Controller_7_0 {
	/**
	 * Prepares a single template output for response.
	 *
	 * @since 5.8.0
	 * @since 7.2.0 Answers with an error response instead of a fatal error
	 *              when the template is `null`.
	 *
	 * @param WP_Block_Template|null $item    Template instance.
	 * @param WP_REST_Request        $request Request object.
	 * @return WP_REST_Response|WP_Error Response object on success, or WP_Error when the template is `null`.
	 */
	public function prepare_item_for_response( $item, $request ) {
		//////////////////////////////
		// START CORE MODIFICATIONS //
		//////////////////////////////
		/*
		 * Core can pass `null` here, e.g. when `update_item` refetches a
		 * template after deleting its post. Reading `$item->content` on
		 * `null` is a fatal error, so answer with an error response instead.
		 */
		if ( ! $item ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}
		//////////////////////////////
		// END CORE MODIFICATIONS //
		//////////////////////////////

		return parent::prepare_item_for_response( $item, $request );
	}

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
		/*
		 * Refuse the revert only when the template exists (for an unknown id,
		 * core answers 404 below) but no theme or plugin version of it does.
		 */
		if (
			isset( $request['source'] ) && 'theme' === $request['source']
			&& get_block_template( $request['id'], $this->post_type )
			&& ! get_block_file_template( $request['id'], $this->post_type )
		) {
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
