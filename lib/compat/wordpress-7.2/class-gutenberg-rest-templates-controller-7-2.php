<?php

/**
 * Core class used to access templates via the REST API before WordPress 7.2.
 *
 * This class extension exists to prevent a fatal error when a `null` template
 * reaches `prepare_item_for_response`, which reads and assigns properties on
 * it. Core's `update_item` can pass `null` there from either of its two
 * unchecked `get_block_template()` refetches: after writing an update, and on
 * its "revert to theme" path, which force-deletes the template's post before
 * checking that a theme or plugin version of the template exists.
 *
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
		 * Core's `update_item` passes its `get_block_template()` refetches
		 * here unchecked, both after writing an update and after deleting
		 * the post on its revert path. Reading `$item->content` on `null`
		 * is a fatal error, so answer with an error response instead.
		 */
		if ( ! $item ) {
			return new WP_Error( 'rest_template_not_found', __( 'No templates exist with that id.' ), array( 'status' => 404 ) );
		}
		//////////////////////////////
		// END CORE MODIFICATIONS //
		//////////////////////////////

		return parent::prepare_item_for_response( $item, $request );
	}
}
