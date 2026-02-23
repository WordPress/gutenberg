<?php
/**
 * Unit tests covering Gutenberg_Sync_Cleanup functionality.
 *
 * @package Gutenberg
 */
class Gutenberg_Sync_Cleanup_Test extends WP_UnitTestCase {

	/**
	 * Sync storage post ID used across tests.
	 *
	 * @var int
	 */
	private static $storage_post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		register_post_type( 'wp_sync_storage', array( 'public' => false ) );
		self::$storage_post_id = $factory->post->create(
			array(
				'post_type'   => 'wp_sync_storage',
				'post_status' => 'publish',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$storage_post_id, true );
	}

	public function tear_down() {
		$this->cleanup_sync_storage_meta();
		remove_all_filters( 'wp_sync_cleanup_expiration' );
		parent::tear_down();
	}

	private function cleanup_sync_storage_meta() {
		global $wpdb;
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query(
			$wpdb->prepare(
				"DELETE FROM {$wpdb->postmeta} WHERE post_id = %d AND (meta_key LIKE %s OR meta_key LIKE %s)",
				self::$storage_post_id,
				'sync\_update\_%',
				'sync\_awareness\_%'
			)
		);
	}

	public function test_cleanup_removes_stale_sync_updates() {
		$stale_timestamp = ( time() - ( 8 * DAY_IN_SECONDS ) ) * 1000;
		$meta_key        = 'sync_update_' . md5( 'postType/post:1' );

		add_post_meta(
			self::$storage_post_id,
			$meta_key,
			array(
				'client_id' => 1,
				'type'      => 'update',
				'data'      => 'test',
				'timestamp' => $stale_timestamp,
			)
		);
		add_post_meta(
			self::$storage_post_id,
			str_replace( 'sync_update_', 'sync_awareness_', $meta_key ),
			array(
				array(
					'client_id'  => 1,
					'state'      => array(),
					'updated_at' => time() - ( 8 * DAY_IN_SECONDS ),
				),
			)
		);

		$cleanup = new Gutenberg_Sync_Cleanup();
		$cleanup->run_cleanup();

		$this->assertEmpty( get_post_meta( self::$storage_post_id, $meta_key, false ) );
		$this->assertEmpty(
			get_post_meta(
				self::$storage_post_id,
				str_replace( 'sync_update_', 'sync_awareness_', $meta_key ),
				true
			)
		);
	}

	public function test_cleanup_preserves_recent_sync_updates() {
		$recent_timestamp = ( time() - HOUR_IN_SECONDS ) * 1000;
		$meta_key         = 'sync_update_' . md5( 'postType/post:2' );

		add_post_meta(
			self::$storage_post_id,
			$meta_key,
			array(
				'client_id' => 1,
				'type'      => 'update',
				'data'      => 'test',
				'timestamp' => $recent_timestamp,
			)
		);

		$cleanup = new Gutenberg_Sync_Cleanup();
		$cleanup->run_cleanup();

		$this->assertNotEmpty( get_post_meta( self::$storage_post_id, $meta_key, false ) );
	}

	public function test_expiration_filter() {
		// Set a sync update from 2 hours ago.
		$two_hours_ago_ms = ( time() - ( 2 * HOUR_IN_SECONDS ) ) * 1000;
		$meta_key         = 'sync_update_' . md5( 'postType/post:3' );

		add_post_meta(
			self::$storage_post_id,
			$meta_key,
			array(
				'client_id' => 1,
				'type'      => 'update',
				'data'      => 'test',
				'timestamp' => $two_hours_ago_ms,
			)
		);

		// Default expiration (7 days) would keep this, but set it to 1 hour.
		add_filter(
			'wp_sync_cleanup_expiration',
			function () {
				return HOUR_IN_SECONDS;
			}
		);

		$cleanup = new Gutenberg_Sync_Cleanup();
		$cleanup->run_cleanup();

		$this->assertEmpty( get_post_meta( self::$storage_post_id, $meta_key, false ) );
	}

	public function test_schedule_registers_cron() {
		// Ensure clean state.
		wp_clear_scheduled_hook( Gutenberg_Sync_Cleanup::CRON_HOOK );

		Gutenberg_Sync_Cleanup::schedule();

		$this->assertNotFalse( wp_next_scheduled( Gutenberg_Sync_Cleanup::CRON_HOOK ) );

		// Clean up.
		wp_clear_scheduled_hook( Gutenberg_Sync_Cleanup::CRON_HOOK );
	}

	public function test_unschedule_clears_cron() {
		Gutenberg_Sync_Cleanup::schedule();
		Gutenberg_Sync_Cleanup::unschedule();

		$this->assertFalse( wp_next_scheduled( Gutenberg_Sync_Cleanup::CRON_HOOK ) );
	}
}
