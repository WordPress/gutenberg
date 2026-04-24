<?php
/**
 * Adds support for users with sufficient permissions to be able to enable
 * RTC whenever they encounter a locked post.
 *
 * The user who enables the RTC updates the setting directly
 * through their client. All the other clients are informed through
 * the heartbeat that RTC has been enabled in settings which prompts
 * them to save and reload their client so that RTC is enabled for
 * their client as well.
 *
 * @package gutenberg
 */
if ( ! function_exists( 'gutenberg_rtc_heartbeat_post_lock' ) ) {
	/**
	 * Intercepts the heartbeat request to echo the RTC status based on the global option.
	 *
	 * @param array  $response  The Heartbeat response array.
	 * @param array  $data      The data sent by the client.
	 * @param string $screen_id The screen ID.
	 * @return array The modified Heartbeat response.
	 */
	function gutenberg_rtc_heartbeat_post_lock( $response, $data, $screen_id ) {
		if ( ! isset( $data['wp-refresh-post-lock'] ) ) {
			return $response;
		}

		$post_id = absint( $data['wp-refresh-post-lock']['post_id'] );
		if ( ! $post_id ) {
			return $response;
		}

		$is_rtc_enabled = get_option( 'wp_collaboration_enabled', false );

		if ( $is_rtc_enabled ) {
			if ( ! isset( $response['wp-refresh-post-lock'] ) ) {
				$response['wp-refresh-post-lock'] = array();
			}
			$response['wp-refresh-post-lock']['real_time_collaboration'] = true;
		}

		return $response;
	}

	add_filter( 'heartbeat_received', 'gutenberg_rtc_heartbeat_post_lock', 20, 3 );
}