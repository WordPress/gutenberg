<?php
/**
 * Gutenberg_Sync_Cleanup class
 *
 * @package gutenberg
 */

/**
 * Handles scheduled cleanup of stale real-time collaboration post meta.
 *
 * Registers a daily WP-Cron event that removes stale `sync_update_*` and
 * `sync_awareness_*` meta from the sync storage post when all updates in
 * a room are older than the expiration period.
 *
 * @access private
 * @internal
 */
class Gutenberg_Sync_Cleanup {
	/**
	 * WP-Cron hook name.
	 */
	const CRON_HOOK = 'wp_sync_cleanup';

	/**
	 * Default expiration period for stale sync updates.
	 *
	 * @var int
	 */
	const DEFAULT_EXPIRATION = 7 * DAY_IN_SECONDS;

	/**
	 * Register the cron callback.
	 */
	public function init(): void {
		add_action( self::CRON_HOOK, array( $this, 'run_cleanup' ) );
	}

	/**
	 * Schedule the daily cleanup event if not already scheduled.
	 */
	public static function schedule(): void {
		if ( ! wp_next_scheduled( self::CRON_HOOK ) ) {
			wp_schedule_event( time(), 'daily', self::CRON_HOOK );
		}
	}

	/**
	 * Clear the scheduled cleanup event.
	 */
	public static function unschedule(): void {
		wp_clear_scheduled_hook( self::CRON_HOOK );
	}

	/**
	 * Run the cleanup routine.
	 */
	public function run_cleanup(): void {
		$this->cleanup_sync_storage_meta();
	}

	/**
	 * Get the expiration period in seconds.
	 *
	 * @return int Expiration period in seconds.
	 */
	private function get_expiration_seconds(): int {
		/**
		 * Filters the expiration period for stale sync update cleanup.
		 *
		 * @param int $expiration Expiration period in seconds. Default 7 days.
		 */
		return (int) apply_filters( 'wp_sync_cleanup_expiration', self::DEFAULT_EXPIRATION );
	}

	/**
	 * Remove stale sync update and awareness meta from the sync storage post.
	 *
	 * Each sync update is an associative array envelope with a `timestamp`
	 * property (milliseconds since epoch). If the most recent update in a
	 * room is older than the expiration period, all meta for that room is
	 * deleted. Awareness meta for matching rooms is also removed.
	 */
	private function cleanup_sync_storage_meta(): void {
		global $wpdb;

		$storage_post_id = $this->get_sync_storage_post_id();
		if ( null === $storage_post_id ) {
			return;
		}

		$expiration = $this->get_expiration_seconds();
		$cutoff_ms  = ( time() - $expiration ) * 1000;

		// Find all sync_update_* meta keys on the storage post.
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$update_keys = $wpdb->get_col(
			$wpdb->prepare(
				"SELECT DISTINCT meta_key FROM {$wpdb->postmeta} WHERE post_id = %d AND meta_key LIKE %s",
				$storage_post_id,
				'sync\_update\_%'
			)
		);

		foreach ( $update_keys as $meta_key ) {
			$updates       = get_post_meta( $storage_post_id, $meta_key, false );
			$max_timestamp = 0;

			foreach ( $updates as $update ) {
				if ( is_array( $update ) && isset( $update['timestamp'] ) ) {
					$max_timestamp = max( $max_timestamp, (int) $update['timestamp'] );
				}
			}

			// If the newest update is older than the cutoff, delete all meta for this room.
			if ( $max_timestamp < $cutoff_ms ) {
				delete_post_meta( $storage_post_id, $meta_key );

				// Also remove the corresponding awareness meta.
				$awareness_key = str_replace( 'sync_update_', 'sync_awareness_', $meta_key );
				delete_post_meta( $storage_post_id, $awareness_key );
			}
		}
	}

	/**
	 * Get the sync storage post ID without creating it.
	 *
	 * @return int|null Post ID, or null if no storage post exists.
	 */
	private function get_sync_storage_post_id(): ?int {
		$posts = get_posts(
			array(
				'post_type'      => 'wp_sync_storage',
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'orderby'        => 'ID',
				'order'          => 'ASC',
			)
		);

		if ( empty( $posts ) ) {
			return null;
		}

		return $posts[0]->ID;
	}
}
