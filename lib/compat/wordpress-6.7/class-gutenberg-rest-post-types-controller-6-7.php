<?php
/**
 * REST API: Gutenberg_REST_Post_Types_Controller_6_7 class
 *
 * @package gutenberg
 */

/**
 * Gutenberg_REST_Post_Types_Controller_6_7 class
 *
 * Add Block Editor default rendering mode to the post type response
 * to allow enabling/disabling at the post type level.
 */
class Gutenberg_REST_Post_Types_Controller_6_7 extends WP_REST_Post_Types_Controller {
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

		// Property will only exist if the post type supports the block editor.
		if ( 'edit' === $context && property_exists( $item, 'default_rendering_mode' ) ) {
			/**
			 * Filters the block editor rendering mode for a post type.
			 *
			 * @since 6.7.0
			 * @param string       $default_rendering_mode Default rendering mode for the post type.
			 * @param WP_Post_Type $post_type              Post type name.
			 * @return string Default rendering mode for the post type.
			 */
			$rendering_mode = apply_filters( 'post_type_default_rendering_mode', $item->default_rendering_mode, $item );

			/**
			 * Filters the block editor rendering mode for a specific post type.
			 * Applied after the generic `post_type_default_rendering_mode` filter.
			 *
			 * The dynamic portion of the hook name, `$item->name`, refers to the post type slug.
			 *
			 * @since 6.7.0
			 * @param string       $default_rendering_mode Default rendering mode for the post type.
			 * @param WP_Post_Type $post_type              Post type object.
			 * @return string Default rendering mode for the post type.
			 */
			$rendering_mode = apply_filters( "post_type_{$item->name}_default_rendering_mode", $rendering_mode, $item );

			// Validate the filtered rendering mode.
			if ( ! in_array( $rendering_mode, gutenberg_post_type_rendering_modes(), true ) ) {
				$rendering_mode = 'post-only';
			}

			$response->data['default_rendering_mode'] = $rendering_mode;
		}

		return rest_ensure_response( $response );
	}
}
