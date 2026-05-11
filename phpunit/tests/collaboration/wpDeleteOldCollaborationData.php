<?php
/**
 * Tests for the collaboration cron cleanup routine.
 *
 * @package WordPress
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_wpDeleteOldCollaborationData extends WP_UnitTestCase {

	protected static $editor_id;
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create( array( 'post_author' => self::$editor_id ) );

		add_filter( 'pre_option_wp_collaboration_enabled', '__return_true' );
	}

	public static function wpTearDownAfterClass() {
		remove_filter( 'pre_option_wp_collaboration_enabled', '__return_true' );
	}

	public function set_up() {
		parent::set_up();

		add_filter( 'pre_option_wp_collaboration_enabled', '__return_true' );
	}

	/**
	 * Returns the room identifier for the test post.
	 *
	 * @return string Room identifier.
	 */
	private function get_post_room() {
		return 'postType/post:' . self::$post_id;
	}

	/**
	 * Inserts a row directly into the collaboration table with a given age.
	 *
	 * @param positive-int $age_in_seconds How old the row should be.
	 * @param string       $label          A label stored in the data column for identification.
	 */
	private function insert_collaboration_row( int $age_in_seconds, string $label = 'test' ): void {
		global $wpdb;

		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $this->get_post_room(),
				'type'      => 'update',
				'client_id' => '1',
				'user_id'   => self::$editor_id,
				'data'      => wp_json_encode(
					array(
						'type' => 'update',
						'data' => $label,
					)
				),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() - $age_in_seconds ),
			),
			array( '%s', '%s', '%s', '%d', '%s', '%s' )
		);
	}

	/**
	 * Returns the number of non-awareness rows in the collaboration table.
	 *
	 * @return positive-int Row count.
	 */
	private function get_collaboration_row_count(): int {
		global $wpdb;

		return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->collaboration} WHERE type != 'awareness'" );
	}

	/**
	 * Returns the number of awareness rows in the collaboration table.
	 *
	 * @return positive-int Row count.
	 */
	private function get_awareness_row_count(): int {
		global $wpdb;

		return (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$wpdb->collaboration} WHERE type = 'awareness'" );
	}

	/**
	 * @ticket 64696
	 */
	public function test_cron_cleanup_deletes_old_rows(): void {
		$this->insert_collaboration_row( 8 * DAY_IN_SECONDS );

		$this->assertSame( 1, $this->get_collaboration_row_count(), 'Old row should exist before cleanup.' );

		wp_delete_old_collaboration_data();

		$this->assertSame( 0, $this->get_collaboration_row_count(), 'Old row should be deleted after cleanup.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_cron_cleanup_preserves_recent_rows(): void {
		$this->insert_collaboration_row( DAY_IN_SECONDS );

		wp_delete_old_collaboration_data();

		$this->assertSame( 1, $this->get_collaboration_row_count() );
	}

	/**
	 * @ticket 64696
	 */
	public function test_cron_cleanup_boundary_at_exactly_seven_days(): void {
		$this->insert_collaboration_row( WEEK_IN_SECONDS + 60, 'expired' );
		$this->insert_collaboration_row( WEEK_IN_SECONDS - 60, 'just-inside' );

		wp_delete_old_collaboration_data();

		global $wpdb;
		$remaining = $wpdb->get_col( "SELECT data FROM {$wpdb->collaboration}" );

		$this->assertCount( 1, $remaining, 'Only the row within the 7-day window should remain.' );
		$this->assertStringContainsString( 'just-inside', $remaining[0], 'The surviving row should be the one inside the window.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_cron_cleanup_selectively_deletes_mixed_rows(): void {
		// 3 expired rows.
		$this->insert_collaboration_row( 10 * DAY_IN_SECONDS );
		$this->insert_collaboration_row( 10 * DAY_IN_SECONDS );
		$this->insert_collaboration_row( 10 * DAY_IN_SECONDS );

		// 2 recent rows.
		$this->insert_collaboration_row( HOUR_IN_SECONDS );
		$this->insert_collaboration_row( HOUR_IN_SECONDS );

		$this->assertSame( 5, $this->get_collaboration_row_count() );

		wp_delete_old_collaboration_data();

		$this->assertSame( 2, $this->get_collaboration_row_count(), 'Only the 2 recent rows should survive cleanup.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_cron_cleanup_hook_is_registered(): void {
		$this->assertSame(
			10,
			has_action( 'wp_delete_old_collaboration_data', 'wp_delete_old_collaboration_data' ),
			'The wp_delete_old_collaboration_data action should be hooked in default-filters.php.'
		);
	}

	/**
	 * When collaboration is disabled, the cron callback should still clean up
	 * stale rows and then unschedule itself so it does not continue to run.
	 *
	 * @ticket 64696
	 */
	public function test_cron_cleanup_when_collaboration_disabled(): void {
		global $wpdb;

		// Insert a stale sync row (older than 7 days).
		$this->insert_collaboration_row( 10 * DAY_IN_SECONDS );

		// Insert a stale awareness row (older than 60 seconds).
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $this->get_post_room(),
				'type'      => 'awareness',
				'client_id' => '42',
				'user_id'   => self::$editor_id,
				'data'      => wp_json_encode( array( 'cursor' => 'stale' ) ),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() - 120 ),
			),
			array( '%s', '%s', '%s', '%d', '%s', '%s' )
		);

		$this->assertSame( 1, $this->get_collaboration_row_count(), 'Should have 1 sync row before cleanup.' );
		$this->assertSame( 1, $this->get_awareness_row_count(), 'Should have 1 awareness row before cleanup.' );

		// Schedule the cron event so we can verify it gets cleared.
		wp_schedule_event( time(), 'hourly', 'wp_delete_old_collaboration_data' );
		$this->assertIsInt( wp_next_scheduled( 'wp_delete_old_collaboration_data' ), 'Cron event should be scheduled before cleanup.' );

		// Disable collaboration.
		add_filter( 'pre_option_wp_collaboration_enabled', '__return_zero' );

		wp_delete_old_collaboration_data();

		$this->assertSame( 0, $this->get_collaboration_row_count(), 'Stale sync rows should be deleted when collaboration is disabled.' );
		$this->assertSame( 0, $this->get_awareness_row_count(), 'Stale awareness rows should be deleted when collaboration is disabled.' );
		$this->assertFalse( wp_next_scheduled( 'wp_delete_old_collaboration_data' ), 'Cron hook should be unscheduled when collaboration is disabled.' );
	}

	/**
	 * Cron cleanup should remove expired awareness rows.
	 *
	 * @ticket 64696
	 */
	public function test_cron_cleanup_deletes_expired_awareness_rows(): void {
		global $wpdb;

		// Insert an awareness row older than 60 seconds.
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $this->get_post_room(),
				'type'      => 'awareness',
				'client_id' => '42',
				'user_id'   => self::$editor_id,
				'data'      => wp_json_encode( array( 'cursor' => 'old' ) ),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() - 120 ),
			),
			array( '%s', '%s', '%s', '%d', '%s', '%s' )
		);

		// Insert a recent collaboration row (should survive).
		$this->insert_collaboration_row( HOUR_IN_SECONDS );

		$this->assertSame( 1, $this->get_collaboration_row_count(), 'Collaboration table should have 1 sync row.' );
		$this->assertSame( 1, $this->get_awareness_row_count(), 'Collaboration table should have 1 awareness row.' );

		wp_delete_old_collaboration_data();

		$this->assertSame( 1, $this->get_collaboration_row_count(), 'Only the recent sync row should survive cron cleanup.' );
		$this->assertSame( 0, $this->get_awareness_row_count(), 'Expired awareness row should be deleted after cron cleanup.' );
	}

	/**
	 * Verifies that a fresh awareness row (younger than 60 seconds) survives cron cleanup.
	 *
	 * @ticket 64696
	 */
	public function test_cron_cleanup_preserves_fresh_awareness_rows(): void {
		global $wpdb;

		// Insert a fresh awareness row (30 seconds old — well within the 60s threshold).
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $this->get_post_room(),
				'type'      => 'awareness',
				'client_id' => '1',
				'user_id'   => self::$editor_id,
				'data'      => wp_json_encode( array( 'cursor' => 'active' ) ),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() - 30 ),
			),
			array( '%s', '%s', '%s', '%d', '%s', '%s' )
		);

		$this->assertSame( 1, $this->get_awareness_row_count(), 'Should have 1 awareness row before cleanup.' );

		wp_delete_old_collaboration_data();

		$this->assertSame( 1, $this->get_awareness_row_count(), 'Fresh awareness row should survive cron cleanup.' );
	}
}
