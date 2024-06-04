<?php
/**
 * REST API: Gutenberg_REST_Post_Types_Controller_6_6 class
 *
 * @package gutenberg
 */

/**
 * Gutenberg_REST_Post_Types_Controller_6_6 class
 *
 * Add Block Editor default rendering mode to the post type response
 * to allow enabling/disabling at the post type level.
 */
class Gutenberg_REST_Post_Types_Controller_6_6 extends WP_REST_Post_Types_Controller {
	/**
	 * Add Block Editor default rendering mode setting to the response.
	 *
	 * @param WP_Post_Type      $item    Post type object.
	 * @param WP_REST_Request   $request Request object.
	 * @return WP_REST_Response Response object.
	 */
	public function prepare_item_for_response( $item, $request ) {
		$response = parent::prepare_item_for_response( $item, $request );
		$context  = ! empty( $request['context'] ) ? $request['context'] : 'view';

		if ( 'edit' === $context ) {
			/**
			 * Filters the block editor rendering mode for a post type.
			 *
			 * @since 6.6.0
			 * @param string $default_rendering_mode Default rendering mode for the post type.
			 * @param string $post_type              Post type name.
			 * @return string Default rendering mode for the post type.
			 */
			$response->data['rendering_mode'] = apply_filters( 'post_type_default_rendering_mode', 'post-only', $item->name );
		}

		return $response;
	}
}
