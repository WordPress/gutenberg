<?php
/**
 * Tests for the WP_Collaboration_Table_Storage class.
 *
 * Covers the storage implementation contract: basic CRUD operations,
 * cursor mechanics, awareness caching, and data integrity.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 */
class Tests_Collaboration_WpCollaborationTableStorage extends WP_UnitTestCase {

	protected static $editor_id;
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create( array( 'post_author' => self::$editor_id ) );
		update_option( 'wp_collaboration_enabled', 1 );

		// Ensure the table exists.
		if ( function_exists( 'gutenberg_create_collaboration_table' ) ) {
			gutenberg_create_collaboration_table();
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		update_option( 'wp_collaboration_enabled', 1 );

		// Clean the collaboration table between tests.
		global $wpdb;
		gutenberg_register_collaboration_table();
		// phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching
		$wpdb->query( "TRUNCATE TABLE {$wpdb->collaboration}" );

		// Clear the object cache for the collaboration group.
		wp_cache_flush();
	}

	/**
	 * Returns the room identifier for the test post.
	 *
	 * @return string Room identifier.
	 */
	private function get_room(): string {
		return 'postType/post:' . self::$post_id;
	}

	/**
	 * Adding an update stores data and returns true.
	 */
	public function test_add_update_returns_true() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$result = $storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'dGVzdA==',
			)
		);

		$this->assertTrue( $result );
	}

	/**
	 * Updates can be retrieved after cursor 0.
	 */
	public function test_get_updates_after_cursor_returns_updates() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$update = array(
			'client_id' => '1',
			'type'      => 'update',
			'data'      => 'dGVzdA==',
		);
		$storage->add_update( $room, $update );

		$updates = $storage->get_updates_after_cursor( $room, 0 );
		$this->assertCount( 1, $updates );
		$this->assertSame( 'update', $updates[0]['type'] );
		$this->assertSame( 'dGVzdA==', $updates[0]['data'] );
	}

	/**
	 * Cursor advances after retrieving updates.
	 */
	public function test_cursor_advances_after_get_updates() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'first',
			)
		);

		$storage->get_updates_after_cursor( $room, 0 );
		$cursor1 = $storage->get_cursor( $room );
		$this->assertGreaterThan( 0, $cursor1 );

		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'second',
			)
		);

		$storage->get_updates_after_cursor( $room, $cursor1 );
		$cursor2 = $storage->get_cursor( $room );
		$this->assertGreaterThan( $cursor1, $cursor2 );
	}

	/**
	 * get_update_count() returns the total number of non-awareness updates.
	 */
	public function test_get_update_count() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		for ( $i = 0; $i < 3; $i++ ) {
			$storage->add_update(
				$room,
				array(
					'client_id' => '1',
					'type'      => 'update',
					'data'      => "data-$i",
				)
			);
		}

		$storage->get_updates_after_cursor( $room, 0 );
		$this->assertSame( 3, $storage->get_update_count( $room ) );
	}

	/**
	 * remove_updates_through_cursor() deletes updates up to and including the cursor.
	 */
	public function test_remove_updates_through_cursor() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		for ( $i = 0; $i < 5; $i++ ) {
			$storage->add_update(
				$room,
				array(
					'client_id' => '1',
					'type'      => 'update',
					'data'      => "data-$i",
				)
			);
		}

		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		// Add one more after capturing the cursor.
		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'after-cursor',
			)
		);

		$this->assertTrue( $storage->remove_updates_through_cursor( $room, $cursor ) );

		$remaining = $storage->get_updates_after_cursor( $room, 0 );
		$this->assertCount( 1, $remaining );
		$this->assertSame( 'after-cursor', $remaining[0]['data'] );
	}

	/**
	 * Awareness rows are excluded from get_updates_after_cursor().
	 */
	public function test_awareness_rows_excluded_from_updates() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'sync-data',
			)
		);

		wp_set_current_user( self::$editor_id );
		$storage->set_awareness_state( $room, '1', array( 'name' => 'Editor' ), self::$editor_id );

		$updates = $storage->get_updates_after_cursor( $room, 0 );
		$this->assertCount( 1, $updates );
		$this->assertSame( 'update', $updates[0]['type'] );
	}

	/**
	 * set_awareness_state() and get_awareness_state() round-trip.
	 */
	public function test_awareness_state_round_trip() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$state = array(
			'name'  => 'Alice',
			'color' => '#ff0000',
		);
		$storage->set_awareness_state( $room, 'client-a', $state, self::$editor_id );

		// Clear cache to force DB read.
		wp_cache_flush();

		$entries = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $entries );
		$this->assertSame( 'client-a', $entries[0]['client_id'] );
		$this->assertSame( 'Alice', $entries[0]['state']['name'] );
		$this->assertSame( self::$editor_id, $entries[0]['user_id'] );
	}

	/**
	 * set_awareness_state() updates existing rows instead of creating duplicates.
	 */
	public function test_awareness_state_upsert() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$storage->set_awareness_state( $room, 'client-a', array( 'name' => 'v1' ), self::$editor_id );

		// Force a new timestamp bucket by advancing time.
		// In practice the 5-second bucketing may short-circuit, but the upsert
		// should still result in a single row per client.
		$storage->set_awareness_state( $room, 'client-a', array( 'name' => 'v2' ), self::$editor_id );

		wp_cache_flush();
		$entries = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $entries );
	}

	/**
	 * get_awareness_state() caches results and returns from cache on second call.
	 */
	public function test_awareness_state_uses_cache() {
		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$storage->set_awareness_state( $room, 'client-a', array( 'name' => 'Test' ), self::$editor_id );

		// Clear cache and do a DB read to prime it.
		wp_cache_flush();
		$first_call = $storage->get_awareness_state( $room );

		// Verify cache is primed.
		$cache_key = 'awareness:' . str_replace( '/', ':', $room );
		$cached    = wp_cache_get( $cache_key, 'collaboration' );
		$this->assertNotFalse( $cached );
		$this->assertSame( $first_call, $cached );
	}

	/**
	 * Malformed JSON rows are dropped from get_updates_after_cursor().
	 */
	public function test_get_updates_after_cursor_drops_malformed_json() {
		global $wpdb;

		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		// Insert a valid update.
		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'dGVzdA==',
			)
		);

		// Insert a malformed JSON row directly.
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $room,
				'type'      => 'update',
				'client_id' => '2',
				'data'      => '{invalid json',
				'date_gmt'  => gmdate( 'Y-m-d H:i:s' ),
				'user_id'   => 0,
			),
			array( '%s', '%s', '%s', '%s', '%s', '%d' )
		);

		// Insert another valid update.
		$storage->add_update(
			$room,
			array(
				'client_id' => '3',
				'type'      => 'sync_step1',
				'data'      => 'c3RlcDE=',
			)
		);

		$updates = $storage->get_updates_after_cursor( $room, 0 );

		// The malformed row should be dropped; only the valid updates should appear.
		$this->assertCount( 2, $updates );
		$this->assertSame( 'update', $updates[0]['type'] );
		$this->assertSame( 'sync_step1', $updates[1]['type'] );
	}

	/**
	 * Cursor does not skip updates inserted during the fetch window.
	 *
	 * Uses a $wpdb proxy to inject a concurrent write between the snapshot
	 * query and the fetch query, verifying cursor-bounded safety.
	 */
	public function test_cursor_does_not_skip_update_inserted_during_fetch_window() {
		global $wpdb;

		$storage = new WP_Collaboration_Table_Storage();
		$room    = $this->get_room();

		$storage->add_update(
			$room,
			array(
				'client_id' => '1',
				'type'      => 'update',
				'data'      => 'c2VlZA==',
			)
		);

		$storage->get_updates_after_cursor( $room, 0 );
		$baseline_cursor = $storage->get_cursor( $room );
		$this->assertGreaterThan( 0, $baseline_cursor );

		$injected_update = array(
			'client_id' => '9999',
			'type'      => 'update',
			'data'      => base64_encode( 'injected-during-fetch' ),
		);

		$original_wpdb       = $wpdb;
		$collaboration_table = $wpdb->collaboration;
		$proxy_wpdb          = new class( $original_wpdb, $collaboration_table, $room, $injected_update ) {
			private $wpdb;
			private $table;
			private $room;
			private $injected_update;
			public $collaboration;
			public $did_inject = false;

			public function __construct( $wpdb, string $table, string $room, array $injected_update ) {
				$this->wpdb            = $wpdb;
				$this->table           = $table;
				$this->room            = $room;
				$this->injected_update = $injected_update;
				$this->collaboration   = $table;
			}

			// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- Proxy forwards fully prepared core queries.
			public function prepare( ...$args ) {
				return $this->wpdb->prepare( ...$args );
			}

			public function get_row( $query = null, $output = OBJECT, $y = 0 ) {
				$result = $this->wpdb->get_row( $query, $output, $y );

				$this->maybe_inject( $query );

				return $result;
			}

			public function get_results( $query = null, $output = OBJECT ) {
				return $this->wpdb->get_results( $query, $output );
			}
			// phpcs:enable WordPress.DB.PreparedSQL.NotPrepared

			public function __call( $name, $arguments ) {
				return $this->wpdb->$name( ...$arguments );
			}

			public function __get( $name ) {
				return $this->wpdb->$name;
			}

			public function __set( $name, $value ) {
				$this->wpdb->$name = $value;
			}

			private function maybe_inject( $query ): void {
				if ( $this->did_inject || ! is_string( $query ) ) {
					return;
				}

				if ( false !== strpos( $query, $this->table ) && false !== strpos( $query, 'MAX' ) ) {
					$this->did_inject = true;
					$this->wpdb->insert(
						$this->table,
						array(
							'room'      => $this->room,
							'type'      => $this->injected_update['type'],
							'client_id' => $this->injected_update['client_id'],
							'data'      => wp_json_encode( $this->injected_update ),
							'date_gmt'  => gmdate( 'Y-m-d H:i:s' ),
							'user_id'   => 0,
						),
						array( '%s', '%s', '%s', '%s', '%s', '%d' )
					);
				}
			}
		};

		$wpdb = $proxy_wpdb;
		try {
			$race_updates = $storage->get_updates_after_cursor( $room, $baseline_cursor );
			$race_cursor  = $storage->get_cursor( $room );
		} finally {
			$wpdb = $original_wpdb;
		}

		$this->assertTrue( $proxy_wpdb->did_inject, 'Expected race-window update injection to occur.' );
		$this->assertEmpty( $race_updates );
		$this->assertSame( $baseline_cursor, $race_cursor );

		$follow_up_updates = $storage->get_updates_after_cursor( $room, $race_cursor );
		$follow_up_cursor  = $storage->get_cursor( $room );

		$this->assertCount( 1, $follow_up_updates );
		$this->assertSame( $injected_update['data'], $follow_up_updates[0]['data'] );
		$this->assertGreaterThan( $race_cursor, $follow_up_cursor );
	}
}
