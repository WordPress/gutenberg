<?php
/**
 * Reusable blocks REST API: WP_REST_Blocks_Controller class
 *
 * @package WordPress
 * @subpackage REST_API
 * @since 5.0.0
 */

/**
 * Controller which provides a REST endpoint for the editor to read, create,
 * edit and delete reusable blocks. Blocks are stored as posts with the wp_block
 * post type.
 *
 * @since 5.0.0
 *
 * @see WP_REST_Posts_Controller
 * @see WP_REST_Controller
 */
class Gutenberg_REST_Blocks_Controller extends WP_REST_Blocks_Controller {
	/**
	 * Filters a response based on the context defined in the schema.
	 *
	 * @since 5.0.0
	 * @since 6.3 Adds the `wp_pattern_sync_status` property to the response.
	 *
	 * @param array  $data    Response data to filter.
	 * @param string $context Context defined in the schema.
	 * @return array Filtered response.
	 */
	public function filter_response_by_context( $data, $context ) {
		$data = parent::filter_response_by_context( $data, $context );

		/*
		 * Remove `title.rendered` and `content.rendered` from the response. It
		 * doesn't make sense for a reusable block to have rendered content on its
		 * own, since rendering a block requires it to be inside a post or a page.
		 */
		unset( $data['title']['rendered'] );
		unset( $data['content']['rendered'] );

		// If `$data['wp_pattern_sync_status']` is already set core 6.3 + has already done the job of setting this so return early.
		if ( isset( $data['wp_pattern_sync_status'] ) ) {
			return $data;
		}
		// Add the core wp_pattern_sync_status meta as top level property to the response.
		$data['wp_pattern_sync_status'] = isset( $data['meta']['wp_pattern_sync_status'] ) ? $data['meta']['wp_pattern_sync_status'] : '';
		unset( $data['meta']['wp_pattern_sync_status'] );
		return $data;
	}
}
