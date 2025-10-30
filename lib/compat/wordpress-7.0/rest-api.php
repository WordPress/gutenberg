<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Adds mediaRoles to the block type REST API response.
 * @since 7.0.0
 *
 * @param WP_REST_Response $response   The response object.
 * @param WP_Block_Type    $block_type Block type object.
 * @return WP_REST_Response Modified response with mediaRoles if present.
 */
function gutenberg_add_media_roles_to_rest_response( $response, $block_type ) {
	if ( isset( $block_type->media_roles ) ) {
		$response->data['media_roles'] = $block_type->media_roles;
	}
	return $response;
}
add_filter( 'rest_prepare_block_type', 'gutenberg_add_media_roles_to_rest_response', 10, 2 );
