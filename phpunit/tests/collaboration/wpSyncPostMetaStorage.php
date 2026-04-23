<?php
/**
 * Tests for the WP_Sync_Post_Meta_Storage class.
 *
 * Covers the storage implementation contract: cache bypass, data integrity,
 * malformed data handling, and race-condition safety.
 *
 * @package gutenberg
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group cache
 */
class Tests_Collaboration_WpSyncPostMetaStorage extends WP_UnitTestCase {

	protected static $editor_id;
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$post_id   = $factory->post->create( array( 'post_author' => self::$editor_id ) );
		update_option( 'wp_collaboration_enabled', 1 );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$editor_id );
		delete_option( 'wp_collaboration_enabled' );
		wp_delete_post( self::$post_id, true );
	}

	public function set_up() {
		parent::set_up();
		update_option( 'wp_collaboration_enabled', 1 );

		// Reset storage post ID cache to ensure clean state after transaction rollback.
		$reflection = new ReflectionProperty( 'WP_Sync_Post_Meta_Storage', 'storage_post_ids' );
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		$reflection->setValue( null, array() );
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
	 * Creates the storage post for the room and returns its ID.
	 *
	 * Adds a seed update to trigger storage post creation, then looks up
	 * the resulting post ID.
	 *
	 * @param WP_Sync_Post_Meta_Storage $storage Storage instance.
	 * @param string                    $room    Room identifier.
	 * @return int Storage post ID.
	 */
	private function create_storage_post( WP_Sync_Post_Meta_Storage $storage, string $room ): int {
		$storage->add_update(
			$room,
			array(
				'type' => 'update',
				'data' => 'seed',
			)
		);

		$posts = get_posts(
			array(
				'post_type'      => 'wp_sync_storage',
				'posts_per_page' => 1,
				'post_status'    => 'publish',
				'name'           => md5( $room ),
				'fields'         => 'ids',
			)
		);

		/*
		 * array_first() is a PHP 8.5 function. WordPress added
		 * a polyfill in WP 6.9 (see https://core.trac.wordpress.org/ticket/63853).
		 * Since Gutenberg must support the two most recent WordPress
		 * versions (currently 6.8+), we cannot rely on it here.
		 */
		$storage_post_id = $posts[0] ?? null;
		$this->assertIsInt( $storage_post_id );

		return $storage_post_id;
	}

	/**
	 * Primes the post meta object cache for a given post and returns the cached value.
	 *
	 * @param int $post_id Post ID.
	 * @return array Cached meta data.
	 */
	private function prime_and_get_meta_cache( int $post_id ): array {
		update_meta_cache( 'post', array( $post_id ) );

		$cached = wp_cache_get( $post_id, 'post_meta' );
		$this->assertNotFalse( $cached, 'Post meta cache should be primed.' );

		return $cached;
	}

	/**
	 * Adding a sync update must not invalidate the post meta cache for the storage
	 * post.
	 *
	 * @ticket 64916
	 */
	public function test_add_update_does_not_invalidate_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );
		$cached_before   = $this->prime_and_get_meta_cache( $storage_post_id );

		$storage->add_update(
			$room,
			array(
				'type' => 'update',
				'data' => 'new',
			)
		);

		$cached_after = wp_cache_get( $storage_post_id, 'post_meta' );
		$this->assertSame(
			$cached_before,
			$cached_after,
			'add_update() must not invalidate the post meta cache.'
		);
	}

	/**
	 * Setting awareness state must not invalidate the post meta cache for the
	 * storage post.
	 *
	 * @ticket 64916
	 */
	public function test_set_awareness_state_insert_does_not_invalidate_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );
		$cached_before   = $this->prime_and_get_meta_cache( $storage_post_id );

		// First call triggers an INSERT (no existing awareness row).
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Test' ) ) );

		$cached_after = wp_cache_get( $storage_post_id, 'post_meta' );
		$this->assertSame(
			$cached_before,
			$cached_after,
			'set_awareness_state() INSERT path must not invalidate the post meta cache.'
		);
	}

	/**
	 * Updating awareness state must not invalidate the post meta cache for the
	 * storage post.
	 *
	 * @ticket 64916
	 */
	public function test_set_awareness_state_update_does_not_invalidate_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Create initial awareness row (INSERT path).
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Initial' ) ) );

		// Prime cache after the insert.
		$cached_before = $this->prime_and_get_meta_cache( $storage_post_id );

		// Second call triggers an UPDATE (existing awareness row).
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Updated' ) ) );

		$cached_after = wp_cache_get( $storage_post_id, 'post_meta' );
		$this->assertSame(
			$cached_before,
			$cached_after,
			'set_awareness_state() UPDATE path must not invalidate the post meta cache.'
		);
	}

	/**
	 * Removing updates / compaction must not invalidate the post meta cache for
	 * the storage post.
	 *
	 * @ticket 64916
	 */
	public function test_remove_updates_before_cursor_does_not_invalidate_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Get a cursor after the seed update.
		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		$cached_before = $this->prime_and_get_meta_cache( $storage_post_id );

		$storage->remove_updates_before_cursor( $room, $cursor );

		$cached_after = wp_cache_get( $storage_post_id, 'post_meta' );
		$this->assertSame(
			$cached_before,
			$cached_after,
			'remove_updates_before_cursor() must not invalidate the post meta cache.'
		);
	}

	/**
	 * Adding a sync update must not update the posts last_changed value.
	 *
	 * @ticket 64696
	 */
	public function test_add_update_does_not_update_posts_last_changed() {
		$storage = new WP_Sync_Post_Meta_Storage();
		$room    = $this->get_room();
		$this->create_storage_post( $storage, $room );

		$last_changed_before = wp_cache_get_last_changed( 'posts' );

		$storage->add_update(
			$room,
			array(
				'type' => 'update',
				'data' => 'new',
			)
		);

		$this->assertSame(
			$last_changed_before,
			wp_cache_get_last_changed( 'posts' ),
			'add_update() must not update posts last_changed.'
		);
	}

	/**
	 * Setting awareness state must not update the posts last_changed value.
	 *
	 * @ticket 64696
	 */
	public function test_set_awareness_state_does_not_update_posts_last_changed() {
		$storage = new WP_Sync_Post_Meta_Storage();
		$room    = $this->get_room();
		$this->create_storage_post( $storage, $room );

		$last_changed_before = wp_cache_get_last_changed( 'posts' );

		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Test' ) ) );

		$this->assertSame(
			$last_changed_before,
			wp_cache_get_last_changed( 'posts' ),
			'set_awareness_state() must not update posts last_changed.'
		);
	}

	/**
	 * Updating awareness state must not update the posts last_changed value.
	 *
	 * @ticket 64916
	 */
	public function test_set_awareness_state_update_does_not_update_posts_last_changed() {
		$storage = new WP_Sync_Post_Meta_Storage();
		$room    = $this->get_room();
		$this->create_storage_post( $storage, $room );

		$last_changed_before = wp_cache_get_last_changed( 'posts' );

		// Create initial awareness row (INSERT path).
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Initial' ) ) );

		$this->assertSame(
			$last_changed_before,
			wp_cache_get_last_changed( 'posts' ),
			'set_awareness_state() must not update posts last_changed.'
		);

		// Second call triggers an UPDATE (existing awareness row).
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Updated' ) ) );

		$this->assertSame(
			$last_changed_before,
			wp_cache_get_last_changed( 'posts' ),
			'set_awareness_state() must not update posts last_changed.'
		);
	}

	/**
	 * Removing sync updates / compaction must not update the posts last_changed
	 * value.
	 *
	 * @ticket 64916
	 */
	public function test_remove_updates_before_cursor_does_not_update_posts_last_changed() {
		$storage = new WP_Sync_Post_Meta_Storage();
		$room    = $this->get_room();
		$this->create_storage_post( $storage, $room );

		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		$last_changed_before = wp_cache_get_last_changed( 'posts' );

		$storage->remove_updates_before_cursor( $room, $cursor );

		$this->assertSame(
			$last_changed_before,
			wp_cache_get_last_changed( 'posts' ),
			'remove_updates_before_cursor() must not update posts last_changed.'
		);
	}

	/**
	 * Getting awareness state must not prime the post meta cache for the storage
	 * post.
	 *
	 * @ticket 64916
	 */
	public function test_get_awareness_state_does_not_prime_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Populate awareness so there is data to read.
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Test' ) ) );

		// Clear any existing cache.
		wp_cache_delete( $storage_post_id, 'post_meta' );
		$this->assertFalse(
			wp_cache_get( $storage_post_id, 'post_meta' ),
			'Post meta cache should be empty before read.'
		);

		$storage->get_awareness_state( $room );

		$this->assertFalse(
			wp_cache_get( $storage_post_id, 'post_meta' ),
			'get_awareness_state() must not prime the post meta cache.'
		);
	}

	/**
	 * Getting sync updates must not prime the post meta cache for the storage
	 * post.
	 *
	 * @ticket 64916
	 */
	public function test_get_updates_after_cursor_does_not_prime_post_meta_cache() {
		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Clear any existing cache.
		wp_cache_delete( $storage_post_id, 'post_meta' );
		$this->assertFalse(
			wp_cache_get( $storage_post_id, 'post_meta' ),
			'Post meta cache should be empty before read.'
		);

		$storage->get_updates_after_cursor( $room, 0 );

		$this->assertFalse(
			wp_cache_get( $storage_post_id, 'post_meta' ),
			'get_updates_after_cursor() must not prime the post meta cache.'
		);
	}

	/*
	 * Data integrity tests.
	 */

	public function test_get_updates_after_cursor_drops_malformed_json() {
		global $wpdb;

		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Advance cursor past the seed update from create_storage_post().
		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		// Insert a valid update.
		$valid_update = array(
			'type' => 'update',
			'data' => 'dGVzdA==',
		);
		$this->assertTrue( $storage->add_update( $room, $valid_update ) );

		// Insert a malformed JSON row directly into the database.
		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $storage_post_id,
				'meta_key'   => WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY,
				'meta_value' => '{invalid json',
			),
			array( '%d', '%s', '%s' )
		);

		// Insert another valid update after the malformed one.
		$valid_update_2 = array(
			'type' => 'sync_step1',
			'data' => 'c3RlcDE=',
		);
		$this->assertTrue( $storage->add_update( $room, $valid_update_2 ) );

		$updates = $storage->get_updates_after_cursor( $room, $cursor );

		// The malformed row should be dropped; only the valid updates should appear.
		$this->assertCount( 2, $updates );
		$this->assertSame( $valid_update, $updates[0] );
		$this->assertSame( $valid_update_2, $updates[1] );
	}

	public function test_duplicate_awareness_rows_coalesces_on_latest_row() {
		global $wpdb;

		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Simulate a race: insert two awareness rows directly.
		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $storage_post_id,
				'meta_key'   => WP_Sync_Post_Meta_Storage::AWARENESS_META_KEY,
				'meta_value' => wp_json_encode( array( 1 => array( 'name' => 'Stale' ) ) ),
			),
			array( '%d', '%s', '%s' )
		);

		$wpdb->insert(
			$wpdb->postmeta,
			array(
				'post_id'    => $storage_post_id,
				'meta_key'   => WP_Sync_Post_Meta_Storage::AWARENESS_META_KEY,
				'meta_value' => wp_json_encode( array( 1 => array( 'name' => 'Latest' ) ) ),
			),
			array( '%d', '%s', '%s' )
		);

		// get_awareness_state and set_awareness_state should target the latest row.
		$awareness = $storage->get_awareness_state( $room );
		$this->assertSame( array( 'name' => 'Latest' ), $awareness[0] );
		$storage->set_awareness_state( $room, array( 1 => array( 'name' => 'Current' ) ) );
		$awareness = $storage->get_awareness_state( $room );
		$this->assertSame( array( 'name' => 'Current' ), $awareness[0] );
	}

	/*
	 * Race-condition tests.
	 *
	 * These use a $wpdb proxy to inject concurrent writes between internal
	 * query steps, verifying that the cursor-bounded query window prevents
	 * data loss.
	 */

	public function test_cursor_does_not_skip_update_inserted_during_fetch_window() {
		global $wpdb;

		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		$seed_update = array(
			'client_id' => 1,
			'type'      => 'update',
			'data'      => 'c2VlZA==',
		);

		$this->assertTrue( $storage->add_update( $room, $seed_update ) );

		$storage->get_updates_after_cursor( $room, 0 );
		$baseline_cursor = $storage->get_cursor( $room );

		// The seed from create_storage_post() plus the one we just added.
		$this->assertGreaterThan( 0, $baseline_cursor );

		$injected_update = array(
			'client_id' => 9999,
			'type'      => 'update',
			'data'      => base64_encode( 'injected-during-fetch' ),
		);

		$original_wpdb = $wpdb;
		$proxy_wpdb    = new class( $original_wpdb, $storage_post_id, $injected_update ) {
			private $wpdb;
			private $storage_post_id;
			private $injected_update;
			public $postmeta;
			public $did_inject = false;

			public function __construct( $wpdb, int $storage_post_id, array $injected_update ) {
				$this->wpdb            = $wpdb;
				$this->storage_post_id = $storage_post_id;
				$this->injected_update = $injected_update;
				$this->postmeta        = $wpdb->postmeta;
			}

			// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- Proxy forwards fully prepared core queries.
			public function prepare( ...$args ) {
				return $this->wpdb->prepare( ...$args );
			}

			public function get_row( $query = null, $output = OBJECT, $y = 0 ) {
				$result = $this->wpdb->get_row( $query, $output, $y );

				$this->maybe_inject_after_sync_query( $query );

				return $result;
			}

			public function get_var( $query = null, $x = 0, $y = 0 ) {
				$result = $this->wpdb->get_var( $query, $x, $y );

				$this->maybe_inject_after_sync_query( $query );

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

			private function inject_update(): void {
				if ( $this->did_inject ) {
					return;
				}

				$this->did_inject = true;

				$this->wpdb->insert(
					$this->wpdb->postmeta,
					array(
						'post_id'    => $this->storage_post_id,
						'meta_key'   => WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY,
						'meta_value' => wp_json_encode( $this->injected_update ),
					),
					array( '%d', '%s', '%s' )
				);
			}

			private function maybe_inject_after_sync_query( $query ): void {
				if ( $this->did_inject || ! is_string( $query ) ) {
					return;
				}

				$targets_postmeta = false !== strpos( $query, $this->postmeta );
				$targets_post_id  = 1 === preg_match( '/\bpost_id\s*=\s*' . (int) $this->storage_post_id . '\b/', $query );
				$targets_meta_key = 1 === preg_match(
					"/\bmeta_key\s*=\s*'" . preg_quote( WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY, '/' ) . "'/",
					$query
				);

				if ( $targets_postmeta && $targets_post_id && $targets_meta_key ) {
					$this->inject_update();
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
		$this->assertSame( $injected_update, $follow_up_updates[0] );
		$this->assertGreaterThan( $race_cursor, $follow_up_cursor );
	}

	public function test_compaction_does_not_delete_update_inserted_during_delete() {
		global $wpdb;

		$storage         = new WP_Sync_Post_Meta_Storage();
		$room            = $this->get_room();
		$storage_post_id = $this->create_storage_post( $storage, $room );

		// Seed three updates so there's something to compact.
		for ( $i = 1; $i <= 3; $i++ ) {
			$this->assertTrue(
				$storage->add_update(
					$room,
					array(
						'client_id' => $i,
						'type'      => 'update',
						'data'      => base64_encode( "seed-$i" ),
					)
				)
			);
		}

		// Capture the cursor after all seeds are in place.
		$storage->get_updates_after_cursor( $room, 0 );
		$compaction_cursor = $storage->get_cursor( $room );
		$this->assertGreaterThan( 0, $compaction_cursor );

		$concurrent_update = array(
			'client_id' => 9999,
			'type'      => 'update',
			'data'      => base64_encode( 'arrived-during-compaction' ),
		);

		$original_wpdb = $wpdb;
		$proxy_wpdb    = new class( $original_wpdb, $storage_post_id, $concurrent_update ) {
			private $wpdb;
			private $storage_post_id;
			private $concurrent_update;
			public $did_inject = false;

			public function __construct( $wpdb, int $storage_post_id, array $concurrent_update ) {
				$this->wpdb              = $wpdb;
				$this->storage_post_id   = $storage_post_id;
				$this->concurrent_update = $concurrent_update;
			}

			// phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- Proxy forwards fully prepared core queries.
			public function prepare( ...$args ) {
				return $this->wpdb->prepare( ...$args );
			}

			public function query( $query ) {
				$result = $this->wpdb->query( $query );

				// After the DELETE executes, inject a concurrent update via
				// raw SQL through the real $wpdb to avoid metadata cache
				// interactions while the proxy is active.
				if ( ! $this->did_inject
					&& is_string( $query )
					&& 0 === strpos( $query, "DELETE FROM {$this->wpdb->postmeta}" )
					&& false !== strpos( $query, "post_id = {$this->storage_post_id}" )
				) {
					$this->did_inject = true;
					$this->wpdb->insert(
						$this->wpdb->postmeta,
						array(
							'post_id'    => $this->storage_post_id,
							'meta_key'   => WP_Sync_Post_Meta_Storage::SYNC_UPDATE_META_KEY,
							'meta_value' => wp_json_encode( $this->concurrent_update ),
						),
						array( '%d', '%s', '%s' )
					);
				}

				return $result;
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
		};

		// Run compaction through the proxy so the concurrent update
		// is injected immediately after the DELETE executes.
		$wpdb = $proxy_wpdb;
		try {
			$result = $storage->remove_updates_before_cursor( $room, $compaction_cursor );
		} finally {
			$wpdb = $original_wpdb;
		}

		$this->assertTrue( $result );
		$this->assertTrue( $proxy_wpdb->did_inject, 'Expected concurrent update injection to occur.' );

		// The concurrent update must survive the compaction delete.
		$updates = $storage->get_updates_after_cursor( $room, 0 );

		$update_data = wp_list_pluck( $updates, 'data' );
		$this->assertContains(
			$concurrent_update['data'],
			$update_data,
			'Concurrent update should survive compaction.'
		);
	}
}
