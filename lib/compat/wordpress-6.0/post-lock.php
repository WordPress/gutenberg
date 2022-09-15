<?php
/**
 * Post Lock data filters.
 *
 * @package gutenberg
 */

/**
 * Update post lock error and add user display nama.
 *
 * @param array $response  The Heartbeat response.
 * @param array $data      The $_POST data sent.
 * @return array The Heartbeat response.
 */
function gutenberg_refresh_post_lock( $response, $data ) {
	if ( ! isset( $response['wp-refresh-post-lock']['lock_error'] ) ) {
		return $response;
	}

	if ( array_key_exists( 'wp-refresh-post-lock', $data ) ) {
		$received = $data['wp-refresh-post-lock'];

		$post_id = absint( $received['post_id'] );
		if ( ! $post_id ) {
			return $response;
		}

		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return $response;
		}

		$user_id = wp_check_post_lock( $post_id );
		$user    = get_userdata( $user_id );
		if ( $user ) {
			$response['wp-refresh-post-lock']['lock_error']['name'] = $user->display_name;
		}
	}

	return $response;
}
add_filter( 'heartbeat_received', 'gutenberg_refresh_post_lock', 20, 2 );

/**
 * Updates post editor settings and adds avatar to the `postLock` user details.
 *
 * @param array                   $settings             Default editor settings.
 * @param WP_Block_Editor_Context $block_editor_context The current block editor context.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_update_post_lock_details( $settings, $block_editor_context ) {
	if ( empty( $block_editor_context->post ) ) {
		return $settings;
	}

	if ( ! isset( $settings['postLock']['user'] ) ) {
		return $settings;
	}

	$user_id = wp_check_post_lock( $block_editor_context->post->ID );
	if ( $user_id ) {
		$settings['postLock']['user']['avatar'] = get_avatar_url( $user_id, array( 'size' => 128 ) );
	}

	return $settings;
}
add_filter( 'block_editor_settings_all', 'gutenberg_update_post_lock_details', 10, 2 );
