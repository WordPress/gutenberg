<?php
/**
 * Initialization for REST API integration for the Gutenberg editor plugin.
 *
 * @package gutenberg
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Gets revisions details for the selected post.
 *
 * @since 1.6.0
 *
 * @param array $post The post object from the response.
 * @return array|null Revisions details or null when no revisions present.
 */
function gutenberg_get_post_revisions( $post ) {
	$revisions       = wp_get_post_revisions( $post['id'] );
	$revisions_count = count( $revisions );
	if ( 0 === $revisions_count ) {
		return null;
	}

	$last_revision = array_shift( $revisions );

	return array(
		'count'   => $revisions_count,
		'last_id' => $last_revision->ID,
	);
}

/**
 * Adds the custom field `revisions` to the REST API response of post.
 *
 * TODO: This is a temporary solution. Next step would be to find a solution that is limited to the editor.
 *
 * @since 1.6.0
 */
function gutenberg_register_rest_api_post_revisions() {
	register_rest_field( get_post_types( '', 'names' ),
		'revisions',
		array(
			'get_callback' => 'gutenberg_get_post_revisions',
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_rest_api_post_revisions' );
