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
 * Use the `comments_save_pre` filter to remove the dummy content added to work around
 * the REST API's limitation which does not allow empty content.
 *
 * Note: Comments with empty content will be supported in WordPress 6.9. Once that becomes
 * the minimum required version, this function can be removed and actual empty comments sent.
 */
function gutenberg_remove_dummy_content_from_empty_comments( $comment ) {
	if ( '<!-- GUTENBERG_COMMENT_PLACEHOLDER -->' === $comment->comment_content ) {
		$comment->comment_content = '';
	}
	return $comment;
}
add_filter( 'comments_save_pre', 'gutenberg_remove_dummy_content_from_empty_comments' );

/**
 * Use the `rest_preprocess_comment` filter to substitute empty comment content with a dummy placeholder.
 * This is required because of the REST API's limitation which does not allow empty content.
 *
 * Note: Comments with empty content will be supported in WordPress 6.9. Once that becomes
 * the minimum required version, this function can be removed and actual empty comments sent.
 */
function gutenberg_substitute_empty_comment_content( $prepared_comment ) {
	if ( isset( $prepared_comment['comment_content'] ) && '' ===  $prepared_comment['comment_content'] ) {
		$prepared_comment['comment_content'] = '<!-- GUTENBERG_COMMENT_PLACEHOLDER -->';
	}
	return $prepared_comment;
}
add_filter( 'rest_preprocess_comment', 'gutenberg_substitute_empty_comment_content' );