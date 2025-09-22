<?php
/**
 * PHP and WordPress configuration compatibility functions for the Gutenberg
 * editor plugin changes related to REST API.
 *
 * @package gutenberg
 */

/**
 * Adds export theme link relation to the block theme responses.
 *
 * @param WP_REST_Response $response The response object.
 * @param WP_Theme         $theme    Theme object used to create response.
 * @return WP_REST_Response Modified response object.
 */
function gutenberg_rest_theme_export_link_rel( $response, $theme ) {
	if ( ! empty( $response->get_links() ) && $theme->is_block_theme() ) {
		$response->add_link(
			'https://api.w.org/export-theme',
			rest_url( 'wp-block-editor/v1/export' ),
			array(
				'targetHints' => array(
					'allow' => current_user_can( 'export' ) ? array( 'GET' ) : array(),
				),
			)
		);
	}

	return $response;
}
add_filter( 'rest_prepare_theme', 'gutenberg_rest_theme_export_link_rel', 10, 2 );

/**
 * Enable empty comments when the comment_type is 'block_comment'.
 *
 * @param bool  $allow            Whether to allow an empty comment.
 * @param array $prepared_comment The prepared comment data.
 * @return bool Modified allow empty comment value.
 */
function gutenberg_allow_empty_block_comments( $allow, $prepared_comment ) {
	if ( isset( $prepared_comment['comment_type'] ) && 'block_comment' === $prepared_comment['comment_type'] ) {
		$allow = true;
	}
	return $allow;
}
add_filter( 'allow_empty_comment', 'gutenberg_allow_empty_block_comments', 10, 2 );
