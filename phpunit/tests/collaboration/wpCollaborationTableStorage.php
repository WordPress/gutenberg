<?php
/**
 * Tests for the WP_Collaboration_Table_Storage class.
 *
 * Covers the storage implementation contract: cache bypass, data integrity,
 * malformed data handling, and race-condition safety.
 *
 * @package WordPress
 * @subpackage Collaboration
 *
 * @group collaboration
 * @group cache
 */
class Tests_Collaboration_WpCollaborationTableStorage extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		add_filter( 'pre_option_wp_collaboration_enabled', '__return_true' );
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
	public function test_collaboration_storage_add_update_rejects_empty_room(): void {
		$storage = new WP_Collaboration_Table_Storage();
		$result  = $storage->add_update(
			'',
			array(
				'type'      => 'update',
				'client_id' => '1',
				'data'      => 'test',
			)
		);
		$this->assertFalse( $result, 'add_update should reject an empty room.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_collaboration_storage_add_update_rejects_empty_type(): void {
		$storage = new WP_Collaboration_Table_Storage();
		$result  = $storage->add_update(
			'postType/post:1',
			array(
				'type'      => '',
				'client_id' => '1',
				'data'      => 'test',
			)
		);
		$this->assertFalse( $result, 'add_update should reject an empty type.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_collaboration_storage_add_update_rejects_empty_client_id(): void {
		$storage = new WP_Collaboration_Table_Storage();
		$result  = $storage->add_update(
			'postType/post:1',
			array(
				'type'      => 'update',
				'client_id' => '',
				'data'      => 'test',
			)
		);
		$this->assertFalse( $result, 'add_update should reject an empty client_id.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_collaboration_storage_set_awareness_rejects_empty_room(): void {
		$storage = new WP_Collaboration_Table_Storage();
		$result  = $storage->set_awareness_state( '', '1', array( 'user' => 'test' ), 1 );
		$this->assertFalse( $result, 'set_awareness_state should reject an empty room.' );
	}

	/**
	 * @ticket 64696
	 */
	public function test_collaboration_storage_set_awareness_rejects_empty_client_id(): void {
		$storage = new WP_Collaboration_Table_Storage();
		$result  = $storage->set_awareness_state( 'postType/post:1', '', array( 'user' => 'test' ), 1 );
		$this->assertFalse( $result, 'set_awareness_state should reject an empty client_id.' );
	}

	/**
	 * Ensure awareness updates are not stored in the DB for sites using a persistent cache.
	 *
	 * @ticket 64696
	 */
	public function test_awareness_uses_persistent_object_cache() {
		if ( ! wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'This test requires that an external object cache is in use.' );
		}

		$storage          = new WP_Collaboration_Table_Storage();
		$db_calls_initial = get_num_queries();
		$storage->set_awareness_state( 'test-room', 'test-client', array( 'name' => 'Test Client' ), 1 );
		$db_calls_after = get_num_queries();

		$this->assertSame( 0, $db_calls_after - $db_calls_initial, 'Awareness update should not trigger database queries when using persistent object cache.' );
		$this->assertSame( 0, $this->get_awareness_row_count(), 'Awareness row should not be stored in database when using persistent object cache.' );
	}

	/**
	 * Ensure awareness retrieval uses in-memory cache within a single request, even when a persistent cache is in use.
	 *
	 * @ticket 64696
	 */
	public function test_awareness_uses_in_memory_cache() {
		if ( wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'This test requires that an external object cache is not in use.' );
		}

		$storage          = new WP_Collaboration_Table_Storage();
		$db_calls_initial = get_num_queries();
		$storage->set_awareness_state( 'test-room', 'test-client', array( 'name' => 'Test Client' ), 1 );
		$db_calls_after = get_num_queries();

		$this->assertSame( 3, $db_calls_after - $db_calls_initial, 'Awareness update should not trigger database queries when using persistent object cache.' );
		$this->assertSame( 1, $this->get_awareness_row_count(), 'Awareness row should not be stored in database when using persistent object cache.' );

		$db_calls_initial = get_num_queries();
		$storage->get_awareness_state( 'test-room' );
		$db_calls_after = get_num_queries();

		$this->assertSame( 1, $db_calls_after - $db_calls_initial, 'Initial awareness retrieval should query database.' );

		$db_calls_initial = get_num_queries();
		$storage->get_awareness_state( 'test-room' );
		$db_calls_after = get_num_queries();

		$this->assertSame( 0, $db_calls_after - $db_calls_initial, 'Subsequent awareness retrieval should use in-memory cache and not query database.' );
	}

	/**
	 * Ensure adding subsequent client does not remove existing clients from room.
	 *
	 * @ticket 64696
	 */
	public function test_awareness_updates_for_multiple_users() {
		$storage = new WP_Collaboration_Table_Storage();

		// User 1 sets awareness.
		$storage->set_awareness_state( 'test-room', 'client-1', array( 'name' => 'Client 1' ), 1 );

		// User 2 sets awareness.
		$storage->set_awareness_state( 'test-room', 'client-2', array( 'name' => 'Client 2' ), 2 );

		// Retrieve awareness state and verify both users are present.
		$awareness = $storage->get_awareness_state( 'test-room' );
		$clients   = wp_list_pluck( $awareness, 'client_id' );

		$this->assertContains( 'client-1', $clients, 'Client 1 should be present in awareness state.' );
		$this->assertContains( 'client-2', $clients, 'Client 2 should be present in awareness state.' );
		$this->assertCount( 2, $awareness, 'There should be two clients present in awareness state.' );
	}

	/**
	 * Ensure awareness does not include out of date clients from cached results.
	 *
	 * @ticket 64696
	 */
	public function test_awareness_excludes_expired_clients_from_cached_results() {
		$storage     = new WP_Collaboration_Table_Storage();
		$cached_data = array(
			array(
				'client_id' => 'client-1',
				'state'     => array( 'name' => 'Client 1' ),
				'timestamp' => time() - 120, // Simulate expired client.
			),
			array(
				'client_id' => 'client-2',
				'state'     => array( 'name' => 'Client 2' ),
				'timestamp' => time(), // Active client.
			),
		);

		// Manually set cached awareness data.
		wp_cache_set( 'awareness::test-room', $cached_data, 'collaboration', HOUR_IN_SECONDS );

		$awareness = $storage->get_awareness_state( 'test-room' );
		$clients   = wp_list_pluck( $awareness, 'client_id' );

		$this->assertNotContains( 'client-1', $clients, 'Expired client should not be present in awareness state.' );
		$this->assertContains( 'client-2', $clients, 'Active client should be present in awareness state.' );
		$this->assertCount( 1, $awareness, 'Only one active client should be present in awareness state.' );
	}

	/**
	 * Ensure awareness getter returns data of the correct shape.
	 *
	 * @ticket 64696
	 */
	public function test_awareness_getter_is_of_correct_shape() {
		$storage = new WP_Collaboration_Table_Storage();
		$storage->set_awareness_state( 'test-room', 'client-1', array( 'name' => 'Client 1' ), 1 );

		$awareness = $storage->get_awareness_state( 'test-room' );

		$this->assertIsArray( $awareness, 'Awareness state should be an array.' );
		$this->assertCount( 1, $awareness, 'There should be one client state in awareness.' );
		$this->assertArrayHasKey( 0, $awareness, 'Awareness state should be an array of client states.' );

		$expected_keys = array(
			'client_id',
			'state',
			'timestamp',
			'user_id',
		);

		$this->assertSameSets( $expected_keys, array_keys( $awareness[0] ), 'Client state should have expected keys.' );
		$this->assertSame( 'client-1', $awareness[0]['client_id'], 'Client ID should match what was set.' );
		$this->assertIsArray( $awareness[0]['state'], 'Client state should be an array.' );
		$this->assertSame( 'Client 1', $awareness[0]['state']['name'], 'Client state should match what was set.' );
		$this->assertIsInt( $awareness[0]['user_id'], 'Client state user_id should be an integer.' );
		$this->assertIsInt( $awareness[0]['timestamp'], 'Client state timestamp should be an integer.' );
	}

	/*
	 * Data integrity tests.
	 */

	/**
	 * Ensure malformed updates are ignored.
	 *
	 * @ticket 64696
	 */
	public function test_get_updates_after_cursor_drops_malformed_json() {
		global $wpdb;

		$storage = new WP_Collaboration_Table_Storage();
		$room    = __FUNCTION__;

		// Advance cursor past the seed update from create_storage_post().
		$storage->get_updates_after_cursor( $room, 0 );
		$cursor = $storage->get_cursor( $room );

		// Insert a valid update.
		$valid_update = array(
			'type'      => 'update',
			'data'      => 'dGVzdA==',
			'client_id' => '1',
		);
		$this->assertTrue( $storage->add_update( $room, $valid_update ) );

		// Insert a malformed JSON row directly into the database.
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $room,
				'type'      => 'update',
				'client_id' => '1',
				'data'      => '{invalid json',
			),
			array( '%s', '%s', '%s', '%s' )
		);

		// Insert another valid update after the malformed one.
		$valid_update_2 = array(
			'type'      => 'sync_step1',
			'client_id' => '1',
			'data'      => 'c3RlcDE=',
		);
		$this->assertTrue( $storage->add_update( $room, $valid_update_2 ) );

		$updates = $storage->get_updates_after_cursor( $room, $cursor );

		// The malformed row should be dropped; only the valid updates should appear.
		$this->assertCount( 2, $updates );
		$this->assertSame( $valid_update, $updates[0] );
		$this->assertSame( $valid_update_2, $updates[1] );
	}

	/**
	 * Ensure awareness getter returns the latest row when duplicate rows exist.
	 *
	 * @ticket 64696
	 */
	public function test_duplicate_awareness_rows_coalesces_on_latest_row() {
		if ( wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'This test requires that an external object cache is not in use.' );
		}

		global $wpdb;

		$storage = new WP_Collaboration_Table_Storage();
		$room    = __FUNCTION__;

		// Simulate a race: insert two awareness rows directly.
		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $room,
				'type'      => 'awareness',
				'client_id' => '1',
				'user_id'   => 1,
				'data'      => wp_json_encode( array( 'name' => 'Stale' ) ),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() ),
			),
			array( '%s', '%s', '%s', '%d', '%s' )
		);

		$wpdb->insert(
			$wpdb->collaboration,
			array(
				'room'      => $room,
				'type'      => 'awareness',
				'client_id' => '1',
				'user_id'   => 1,
				'data'      => wp_json_encode( array( 'name' => 'Latest' ) ),
				'date_gmt'  => gmdate( 'Y-m-d H:i:s', time() ),
			),
			array( '%s', '%s', '%s', '%d', '%s' )
		);

		// get_awareness_state and set_awareness_state should target the latest row.
		wp_cache_flush();
		$awareness = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $awareness, 'Only one awareness state should be returned for the client.' );
		$this->assertSame( array( 'name' => 'Latest' ), $awareness[0]['state'] );
		$storage->set_awareness_state( $room, '1', array( 'name' => 'Current' ), 1 );
		$awareness = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $awareness, 'Only one awareness state should be returned for the client.' );
		$this->assertSame( array( 'name' => 'Current' ), $awareness[0]['state'] );
	}


	/**
	 * Ensure awareness getter returns the last client entry when duplicates exist.
	 *
	 * @ticket 64696
	 */
	public function test_duplicate_awareness_rows_coalesces_on_latest_entry_with_object_cache() {
		if ( ! wp_using_ext_object_cache() ) {
			$this->markTestSkipped( 'This test requires that an external object cache is in use.' );
		}

		global $wpdb;

		$storage = new WP_Collaboration_Table_Storage();
		$room    = __FUNCTION__;

		wp_cache_set(
			'awareness::' . $room,
			array(
				array(
					'client_id' => '1',
					'state'     => array( 'name' => 'Cached Stale' ),
					'timestamp' => time(),
				),
				array(
					'client_id' => '1',
					'state'     => array( 'name' => 'Cached Latest' ),
					'timestamp' => time(),
				),
			),
			'collaboration',
			HOUR_IN_SECONDS
		);

		// get_awareness_state and set_awareness_state should target the latest row.
		$awareness = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $awareness, 'Only one awareness state should be returned for the client.' );
		$this->assertSame( array( 'name' => 'Cached Latest' ), $awareness[0]['state'] );
		$storage->set_awareness_state( $room, '1', array( 'name' => 'Current' ), 1 );
		$awareness = $storage->get_awareness_state( $room );
		$this->assertCount( 1, $awareness, 'Only one awareness state should be returned for the client.' );
		$this->assertSame( array( 'name' => 'Current' ), $awareness[0]['state'] );
	}
}
