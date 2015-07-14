<?php

if ( is_multisite() ) :

/**
 * Tests specific to sites in multisite.
 *
 * @group ms-site
 * @group multisite
 */
class Tests_Multisite_Site extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER[ 'REMOTE_ADDR' ] = '';
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	function test_switch_restore_blog() {
		global $_wp_switched_stack, $wpdb;

		$this->assertEquals( array(), $_wp_switched_stack );
		$this->assertFalse( ms_is_switched() );
		$current_blog_id = get_current_blog_id();
		$this->assertInternalType( 'integer', $current_blog_id );

		wp_cache_set( 'switch-test', $current_blog_id, 'switch-test' );
		$this->assertEquals( $current_blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		$blog_id = $this->factory->blog->create();

		$cap_key = wp_get_current_user()->cap_key;
		switch_to_blog( $blog_id );
		$this->assertNotEquals( $cap_key, wp_get_current_user()->cap_key );
		$this->assertEquals( array( $current_blog_id ), $_wp_switched_stack );
		$this->assertTrue( ms_is_switched() );
		$this->assertEquals( $blog_id, $wpdb->blogid );
		$this->assertFalse( wp_cache_get( 'switch-test', 'switch-test' ) );
		wp_cache_set( 'switch-test', $blog_id, 'switch-test' );
		$this->assertEquals( $blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		switch_to_blog( $blog_id );
		$this->assertEquals( array( $current_blog_id, $blog_id ), $_wp_switched_stack );
		$this->assertTrue( ms_is_switched() );
		$this->assertEquals( $blog_id, $wpdb->blogid );
		$this->assertEquals( $blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		restore_current_blog();
		$this->assertEquals( array( $current_blog_id ), $_wp_switched_stack );
		$this->assertTrue( ms_is_switched() );
		$this->assertEquals( $blog_id, $wpdb->blogid );
		$this->assertEquals( $blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		restore_current_blog();
		$this->assertEquals( $cap_key, wp_get_current_user()->cap_key );
		$this->assertEquals( $current_blog_id, get_current_blog_id() );
		$this->assertEquals( array(), $_wp_switched_stack );
		$this->assertFalse( ms_is_switched() );
		$this->assertEquals( $current_blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		$this->assertFalse( restore_current_blog() );
	}

	/**
	 * Test the cache keys and database tables setup through the creation of a site.
	 */
	function test_created_site_details() {
		global $wpdb;

		$blog_id = $this->factory->blog->create();

		$this->assertInternalType( 'int', $blog_id );
		$prefix = $wpdb->get_blog_prefix( $blog_id );

		// $get_all = false, only retrieve details from the blogs table
		$details = get_blog_details( $blog_id, false );

		// Combine domain and path for a site specific cache key.
		$key = md5( $details->domain . $details->path );

		$this->assertEquals( $details, wp_cache_get( $blog_id . 'short', 'blog-details' ) );

		// get_id_from_blogname(), see #20950
		$this->assertEquals( $blog_id, get_id_from_blogname( $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( 'get_id_from_blogname_' . trim( $details->path, '/' ), 'blog-details' ) );

		// get_blogaddress_by_name()
		$this->assertEquals( 'http://' . $details->domain . $details->path, get_blogaddress_by_name( trim( $details->path, '/' ) ) );

		// These are empty until get_blog_details() is called with $get_all = true
		$this->assertEquals( false, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-lookup' ) );

		// $get_all = true, populate the full blog-details cache and the blog slug lookup cache
		$details = get_blog_details( $blog_id, true );
		$this->assertEquals( $details, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertEquals( $details, wp_cache_get( $key, 'blog-lookup' ) );

		// Check existence of each database table for the created site.
		foreach ( $wpdb->tables( 'blog', false ) as $table ) {
			$suppress     = $wpdb->suppress_errors();
			$table_fields = $wpdb->get_results( "DESCRIBE $prefix$table;" );
			$wpdb->suppress_errors( $suppress );

			// The table should exist.
			$this->assertNotEmpty( $table_fields );

			// And the table should not be empty, unless commentmeta or links.
			$result = $wpdb->get_results( "SELECT * FROM $prefix$table LIMIT 1" );
			if ( 'commentmeta' == $table || 'links' == $table ) {
				$this->assertEmpty( $result );
			} else {
				$this->assertNotEmpty( $result );
			}
		}

		// update the blog count cache to use get_blog_count()
		wp_update_network_counts();
		$this->assertEquals( 2, (int) get_blog_count() );
	}

	/**
	 * When a site is flagged as 'deleted', its data should be cleared from cache.
	 */
	function test_data_in_cache_after_wpmu_delete_blog_drop_false() {
		$blog_id = $this->factory->blog->create();

		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );

		// Delete the site without forcing a table drop.
		wpmu_delete_blog( $blog_id, false );

		$this->assertEquals( false, wp_cache_get( 'get_id_from_blogname_' . trim( $details->path, '/' ), 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id . 'short', 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-lookup' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * When a site is flagged as 'deleted', its data should remain in the database.
	 */
	function test_data_in_tables_after_wpmu_delete_blog_drop_false() {
		global $wpdb;

		$blog_id = $this->factory->blog->create();

		// Delete the site without forcing a table drop.
		wpmu_delete_blog( $blog_id, false );

		$prefix = $wpdb->get_blog_prefix( $blog_id );
		foreach ( $wpdb->tables( 'blog', false ) as $table ) {
			$suppress = $wpdb->suppress_errors();
			$table_fields = $wpdb->get_results( "DESCRIBE $prefix$table;" );
			$wpdb->suppress_errors( $suppress );
			$this->assertNotEmpty( $table_fields, $prefix . $table );
		}
	}

	/**
	 * When a site is fully deleted, its data should be cleared from cache.
	 */
	function test_data_in_cache_after_wpmu_delete_blog_drop_true() {
		$blog_id = $this->factory->blog->create();

		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );

		// Delete the site and force a table drop.
		wpmu_delete_blog( $blog_id, true );

		$this->assertEquals( false, wp_cache_get( 'get_id_from_blogname_' . trim( $details->path, '/' ), 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id . 'short', 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-lookup' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * When a site is fully deleted, its data should be removed from the database.
	 */
	function test_data_in_tables_after_wpmu_delete_blog_drop_true() {
		global $wpdb;

		$blog_id = $this->factory->blog->create();

		// Delete the site and force a table drop.
		wpmu_delete_blog( $blog_id, true );

		$prefix = $wpdb->get_blog_prefix( $blog_id );
		foreach ( $wpdb->tables( 'blog', false ) as $table ) {
			$suppress = $wpdb->suppress_errors();
			$table_fields = $wpdb->get_results( "DESCRIBE $prefix$table;" );
			$wpdb->suppress_errors( $suppress );
			$this->assertEmpty( $table_fields );
		}
	}

	/**
	 * When the main site of a network is fully deleted, its data should be cleared from cache.
	 */
	function test_data_in_cache_after_wpmu_delete_blog_main_site_drop_true() {
		$blog_id = 1; // The main site in our test suite has an ID of 1.

		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );

		// Delete the site and force a table drop.
		wpmu_delete_blog( $blog_id, true );

		$this->assertEquals( false, wp_cache_get( 'get_id_from_blogname_' . trim( $details->path, '/' ), 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $blog_id . 'short', 'blog-details' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-lookup' ) );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * When the main site of a network is fully deleted, its data should remain in the database.
	 */
	function test_data_in_tables_after_wpmu_delete_blog_main_site_drop_true() {
		global $wpdb;

		$blog_id = 1; // The main site in our test suite has an ID of 1.

		// Delete the site and force a table drop.
		wpmu_delete_blog( $blog_id, true );

		$prefix = $wpdb->get_blog_prefix( $blog_id );
		foreach ( $wpdb->tables( 'blog', false ) as $table ) {
			$suppress = $wpdb->suppress_errors();
			$table_fields = $wpdb->get_results( "DESCRIBE $prefix$table;" );
			$wpdb->suppress_errors( $suppress );
			$this->assertNotEmpty( $table_fields, $prefix . $table );
		}
	}

	/**
	 * The site count of a network should change when a site is flagged as 'deleted'.
	 */
	function test_network_count_after_wpmu_delete_blog_drop_false() {
		$blog_id = $this->factory->blog->create();

		// Delete the site without forcing a table drop.
		wpmu_delete_blog( $blog_id, false );

		// update the blog count cache to use get_blog_count()
		wp_update_network_counts();
		$this->assertEquals( 1, get_blog_count() );
	}

	/**
	 * The site count of a network should change when a site is fully deleted.
	 */
	function test_blog_count_after_wpmu_delete_blog_drop_true() {
		$blog_id = $this->factory->blog->create();

		// Delete the site and force a table drop.
		wpmu_delete_blog( $blog_id, true );

		// update the blog count cache to use get_blog_count()
		wp_update_network_counts();
		$this->assertEquals( 1, get_blog_count() );
	}

	/**
	 * When a site is deleted with wpmu_delete_blog(), only the files associated with
	 * that site should be removed. When wpmu_delete_blog() is run a second time, nothing
	 * should change with upload directories.
	 */
	function test_upload_directories_after_multiple_wpmu_delete_blog() {
		$filename = rand_str().'.jpg';
		$contents = rand_str();

		// Upload a file to the main site on the network.
		$file1 = wp_upload_bits( $filename, null, $contents );

		$blog_id = $this->factory->blog->create();

		switch_to_blog( $blog_id );
		$file2 = wp_upload_bits( $filename, null, $contents );
		restore_current_blog();

		wpmu_delete_blog( $blog_id, true );

		// The file on the main site should still exist. The file on the deleted site should not.
		$this->assertTrue( file_exists( $file1['file'] ) );
		$this->assertFalse( file_exists( $file2['file'] ) );

		wpmu_delete_blog( $blog_id, true );

		// The file on the main site should still exist. The file on the deleted site should not.
		$this->assertTrue( file_exists( $file1['file'] ) );
		$this->assertFalse( file_exists( $file2['file'] ) );
	}

	function test_wpmu_update_blogs_date() {
		global $wpdb;

		wpmu_update_blogs_date();

		// compare the update time with the current time, allow delta < 2
		$blog = get_blog_details( $wpdb->blogid );
		$current_time = time();
		$time_difference = $current_time - strtotime( $blog->last_updated );
		$this->assertLessThan( 2, $time_difference );
	}

	/**
	 * Provide a counter to determine that hooks are firing when intended.
	 */
	function _action_counter_cb() {
		global $test_action_counter;
		$test_action_counter++;
	}

	/**
	 * Test cached data for a site that does not exist and then again after it exists.
	 *
	 * @ticket 23405
	 */
	function test_get_blog_details_when_site_does_not_exist() {
		// Create an unused site so that we can then assume an invalid site ID.
		$blog_id = $this->factory->blog->create();
		$blog_id++;

		// Prime the cache for an invalid site.
		get_blog_details( $blog_id );

		// When the cache is primed with an invalid site, the value is set to -1.
		$this->assertEquals( -1, wp_cache_get( $blog_id, 'blog-details' ) );

		// Create a site in the invalid site's place.
		$this->factory->blog->create();

		// When a new site is created, its cache is cleared through refresh_blog_details.
		$this->assertFalse( wp_cache_get( $blog_id, 'blog-details' )  );

		$blog = get_blog_details( $blog_id );

		// When the cache is refreshed, it should now equal the site data.
		$this->assertEquals( $blog, wp_cache_get( $blog_id, 'blog-details' ) );
	}

	/**
	 * Updating a field returns the sme value that was passed.
	 */
	function test_update_blog_status() {
		$result = update_blog_status( 1, 'spam', 0 );
		$this->assertEquals( 0, $result );
	}

	/**
	 * Updating an invalid field returns the same value that was passed.
	 */
	function test_update_blog_status_invalid_status() {
		$result = update_blog_status( 1, 'doesnotexist', 'invalid' );
		$this->assertEquals( 'invalid', $result );
	}

	function test_update_blog_status_make_ham_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'spam' => 1 ) );

		add_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'spam', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'spam' stays the same.
		update_blog_status( $blog_id, 'spam', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_make_spam_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'spam', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'spam' stays the same.
		update_blog_status( $blog_id, 'spam', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_archive_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'archived', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'archived' stays the same.
		update_blog_status( $blog_id, 'archived', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_unarchive_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'archived' => 1 ) );

		add_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'archived', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'archived' stays the same.
		update_blog_status( $blog_id, 'archived', 0 );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_make_delete_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'deleted', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'deleted' stays the same.
		update_blog_status( $blog_id, 'deleted', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_make_undelete_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'deleted' => 1 ) );

		add_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'deleted', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'deleted' stays the same.
		update_blog_status( $blog_id, 'deleted', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_mature_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'mature', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'mature' stays the same.
		update_blog_status( $blog_id, 'mature', 1 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_unmature_blog_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();
		update_blog_details( $blog_id, array( 'mature' => 1 ) );

		add_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'mature', 0 );

		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'mature' stays the same.
		update_blog_status( $blog_id, 'mature', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10 );
	}

	function test_update_blog_status_update_blog_public_action() {
		global $test_action_counter;
		$test_action_counter = 0;

		$blog_id = $this->factory->blog->create();

		add_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10 );
		update_blog_status( $blog_id, 'public', 0 );

		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->public );
		$this->assertEquals( 1, $test_action_counter );

		// The action should fire if the status of 'mature' stays the same.
		update_blog_status( $blog_id, 'public', 0 );
		$blog = get_blog_details( $blog_id );

		$this->assertEquals( '0', $blog->public );
		$this->assertEquals( 2, $test_action_counter );

		remove_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10 );
	}

	/**
	 * Test the default arguments for wp_get_sites, which should return only
	 * public sites from the current network.
	 *
	 * @ticket 14511
	 */
	function test_wp_get_sites_with_default_arguments() {
		$this->factory->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 1, wp_get_sites() );
	}

	/**
	 * No sites should match a query that specifies an invalid network ID.
	 */
	function test_wp_get_sites_with_invalid_network_id() {
		$this->assertcount( 0, wp_get_sites( array( 'network_id' => 999 ) ) );
	}

	/**
	 * A network ID of null should query for all public sites on all networks.
	 */
	function test_wp_get_sites_with_network_id_null() {
		$this->factory->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 2, wp_get_sites( array( 'network_id' => null ) ) );
	}

	/**
	 * Expect only sites on the specified network ID to be returned.
	 */
	function test_wp_get_sites_with_specific_network_id() {
		$this->factory->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 1, wp_get_sites( array( 'network_id' => 2 ) ) );
	}

	/**
	 * Expect sites from both networks if both network IDs are specified.
	 */
	function test_wp_get_sites_with_multiple_network_ids() {
		$this->factory->blog->create( array( 'site_id' => 2 ) );

		$this->assertCount( 2, wp_get_sites( array( 'network_id' => array( 1, 2 ) ) ) );
	}

	/**
	 * Queries for public or non public sites should work across all networks if network ID is null.
	 */
	function test_wp_get_sites_with_public_meta_on_all_networks() {
		$this->factory->blog->create( array( 'site_id' => 2, 'meta' => array( 'public' => 0 ) ) );

		$this->assertCount( 1, wp_get_sites( array( 'public' => 1, 'network_id' => null ) ) );
		$this->assertcount( 1, wp_get_sites( array( 'public' => 0, 'network_id' => null ) ) );
	}

	/**
	 * If a network ID is specified, queries for public sites should be restricted to that network.
	 */
	function test_wp_get_sites_with_public_meta_restrict_to_one_network() {
		$this->factory->blog->create( array( 'site_id' => 1, 'meta' => array( 'public' => 0 ) ) );

		$this->assertCount( 1, wp_get_sites( array( 'public' => 1, 'network_id' => 1 ) ) );
		$this->assertCount( 0, wp_get_sites( array( 'public' => 1, 'network_id' => 2 ) ) );
	}

	/**
	 * Test the limit and offset arguments for wp_get_sites when multiple sites are available.
	 */
	function test_wp_get_sites_limit_offset() {
		// Create 2 more sites (in addition to the default one)
		$this->factory->blog->create_many( 2 );

		// Expect first 2 sites when using limit
		$this->assertCount( 2, wp_get_sites( array( 'limit' => 2 ) ) );

		// Expect only the last 2 sites when using offset of 1 (limit will default to 100)
		$this->assertCount( 2, wp_get_sites( array( 'offset' => 1 ) ) );

		// Expect only the last 1 site when using offset of 2 and limit of 2
		$this->assertCount( 1, wp_get_sites( array( 'limit' => 2, 'offset' => 2 ) ) );
	}

	/**
	 * Expect 0 sites when using an offset larger than the total number of sites.
	 */
	function test_wp_get_sites_offset_greater_than_available_sites() {
		$this->assertCount( 0, wp_get_sites( array( 'offset' => 20 ) ) );
	}

	/**
	 * @ticket 27952
	 */
	function test_posts_count() {
		$this->factory->post->create();
		$post2 = $this->factory->post->create();
		$this->assertEquals( 2, get_blog_details()->post_count );

		wp_delete_post( $post2 );
		$this->assertEquals( 1, get_blog_details()->post_count );
	}

	/**
	 * @ticket 26410
	 */
	function test_blog_details_cache_invalidation() {
		update_option( 'blogname', 'foo' );
		$details = get_blog_details( get_current_blog_id() );
		$this->assertEquals( 'foo', $details->blogname );

		update_option( 'blogname', 'bar' );
		$details = get_blog_details( get_current_blog_id() );
		$this->assertEquals( 'bar', $details->blogname );
	}

	/**
	 * @ticket 29845
	 */
	function test_get_blog_details() {
		$network_ids = array(
			'wordpress.org/'         => array( 'domain' => 'wordpress.org', 'path' => '/' ),
			'make.wordpress.org/'    => array( 'domain' => 'make.wordpress.org', 'path' => '/' ),
		);

		foreach ( $network_ids as &$id ) {
			$id = $this->factory->network->create( $id );
		}
		unset( $id );

		$ids = array(
			'wordpress.org/'              => array( 'domain' => 'wordpress.org',      'path' => '/',         'title' => 'Test 1', 'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/'          => array( 'domain' => 'wordpress.org',      'path' => '/foo/',     'title' => 'Test 2', 'site_id' => $network_ids['wordpress.org/'] ),
			'wordpress.org/foo/bar/'      => array( 'domain' => 'wordpress.org',      'path' => '/foo/bar/', 'title' => 'Test 3', 'site_id' => $network_ids['wordpress.org/'] ),
			'make.wordpress.org/'         => array( 'domain' => 'make.wordpress.org', 'path' => '/',         'title' => 'Test 4', 'site_id' => $network_ids['make.wordpress.org/'] ),
			'make.wordpress.org/foo/'     => array( 'domain' => 'make.wordpress.org', 'path' => '/foo/',     'title' => 'Test 5', 'site_id' => $network_ids['make.wordpress.org/'] ),
		);

		foreach ( $ids as &$id ) {
			$id = $this->factory->blog->create( $id );
		}
		unset( $id );

		// Retrieve site details by passing only a blog ID.
		$site = get_blog_details( $ids['wordpress.org/'] );
		$this->assertEquals( $ids['wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 1', $site->blogname );

		$site = get_blog_details( $ids['wordpress.org/foo/'] );
		$this->assertEquals( $ids['wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 2', $site->blogname );

		$site = get_blog_details( 999 );
		$this->assertFalse( $site );

		// Retrieve site details by passing an array containing blog_id.
		$site = get_blog_details( array( 'blog_id' => $ids['wordpress.org/foo/bar/'] ) );
		$this->assertEquals( $ids['wordpress.org/foo/bar/'], $site->blog_id );
		$this->assertEquals( 'Test 3', $site->blogname );

		$site = get_blog_details( array( 'blog_id' => $ids['make.wordpress.org/'] ) );
		$this->assertEquals( $ids['make.wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 4', $site->blogname );

		$site = get_blog_details( array( 'blog_id' => 999 ) );
		$this->assertFalse( $site );

		// Retrieve site details by passing an array containing domain and path.
		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/' ) );
		$this->assertEquals( $ids['wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 1', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/foo/' ) );
		$this->assertEquals( $ids['wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 2', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/foo/bar/' ) );
		$this->assertEquals( $ids['wordpress.org/foo/bar/'], $site->blog_id );
		$this->assertEquals( 'Test 3', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'make.wordpress.org', 'path' => '/' ) );
		$this->assertEquals( $ids['make.wordpress.org/'], $site->blog_id );
		$this->assertEquals( 'Test 4', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'make.wordpress.org', 'path' => '/foo/' ) );
		$this->assertEquals( $ids['make.wordpress.org/foo/'], $site->blog_id );
		$this->assertEquals( 'Test 5', $site->blogname );

		$site = get_blog_details( array( 'domain' => 'wordpress.org', 'path' => '/zxy/' ) );
		$this->assertFalse( $site );
	}

	/**
	 * Test the original and cached responses for a created and then deleted site when
	 * the blog ID is requested through get_blog_id_from_url().
	 */
	function test_get_blog_id_from_url() {
		$blog_id = $this->factory->blog->create();
		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );

		// Test the original response and cached response for the newly created site.
		$this->assertEquals( $blog_id, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * Test the case insensitivity of the site lookup.
	 */
	function test_get_blog_id_from_url_is_case_insensitive() {
		$blog_id = $this->factory->blog->create( array( 'domain' => 'example.com', 'path' => '/xyz' ) );
		$details = get_blog_details( $blog_id, false );

		$this->assertEquals( $blog_id, get_blog_id_from_url( strtoupper( $details->domain ), strtoupper( $details->path ) ) );
	}

	/**
	 * Test the first and cached responses for a site that does not exist.
	 */
	function test_get_blog_id_from_url_that_does_not_exist() {
		$blog_id = $this->factory->blog->create( array( 'path' => '/xyz' ) );
		$details = get_blog_details( $blog_id, false );

		$this->assertEquals( 0, get_blog_id_from_url( $details->domain, 'foo' ) );
		$this->assertEquals( -1, wp_cache_get( md5( $details->domain . 'foo' ), 'blog-id-cache' ) );
	}

	/**
	 * A blog ID is still available if only the `deleted` flag is set for a site. The same
	 * behavior would be expected if passing `false` explicitly to `wpmu_delete_blog()`.
	 */
	function test_get_blog_id_from_url_with_deleted_flag() {
		$blog_id = $this->factory->blog->create();
		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );
		wpmu_delete_blog( $blog_id );

		$this->assertEquals( $blog_id, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * When deleted with the drop parameter as true, the cache will first be false, then set to
	 * -1 after an attempt at `get_blog_id_from_url()` is made.
	 */
	function test_get_blog_id_from_url_after_dropped() {
		$blog_id = $this->factory->blog->create();
		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );
		wpmu_delete_blog( $blog_id, true );

		$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );
		$this->assertEquals( 0, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( -1, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	/**
	 * Test with default parameter of site_id as null.
	 */
	function test_is_main_site() {
		$this->assertTrue( is_main_site() );
	}

	/**
	 * Test with a site id of get_current_blog_id(), which should be the same as the
	 * default parameter tested above.
	 */
	function test_current_blog_id_is_main_site() {
		$this->assertTrue( is_main_site( get_current_blog_id() ) );
	}

	/**
	 * Test with a site ID other than the main site to ensure a false response.
	 */
	function test_is_main_site_is_false_with_other_blog_id() {
		$blog_id = $this->factory->blog->create();

		$this->assertFalse( is_main_site( $blog_id ) );
	}

	/**
	 * Test with no passed ID after switching to another site ID.
	 */
	function test_is_main_site_is_false_after_switch_to_blog() {
		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		$this->assertFalse( is_main_site() );

		restore_current_blog();
	}

	function test_switch_upload_dir() {
		$this->assertTrue( is_main_site() );

		$site = get_current_site();

		$info = wp_upload_dir();
		$this->assertEquals( 'http://' . $site->domain . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );

		$blog_id = $this->factory->blog->create();

		switch_to_blog( $blog_id );
		$info = wp_upload_dir();
		$this->assertEquals( 'http://' . $site->domain . '/wp-content/uploads/sites/' . get_current_blog_id() . '/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/sites/' . get_current_blog_id() . '/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
		restore_current_blog();

		$info = wp_upload_dir();
		$this->assertEquals( 'http://' . $site->domain . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	/**
	 * Tests to handle the possibilities provided for in `get_space_allowed()`,
	 * which is used when checking for upload quota limits. Originally part of
	 * ticket #18119.
	 */
	function test_get_space_allowed_default() {
		$this->assertEquals( 100, get_space_allowed() );
	}

	/**
	 * When an individual site's option is defined, it is used over the option
	 * defined at the network level.
	 */
	function test_get_space_allowed_from_blog_option() {
		update_option( 'blog_upload_space', 123 );
		update_site_option( 'blog_upload_space', 200 );
		$this->assertEquals( 123, get_space_allowed() );
	}

	/**
	 * If an individual site's option is not available, the default network
	 * level option is used as a fallback.
	 */
	function test_get_space_allowed_from_network_option() {
		update_option( 'blog_upload_space', false );
		update_site_option( 'blog_upload_space', 200 );
		$this->assertEquals( 200, get_space_allowed() );
	}

	/**
	 * If neither the site or network options are available, 100 is used as
	 * a hard coded fallback.
	 */
	function test_get_space_allowed_no_option_fallback() {
		update_option( 'blog_upload_space', false );
		update_site_option( 'blog_upload_space', false );
		$this->assertEquals( 100, get_space_allowed() );
	}

	function test_get_space_allowed_negative_blog_option() {
		update_option( 'blog_upload_space', -1 );
		update_site_option( 'blog_upload_space', 200 );
		$this->assertEquals( -1, get_space_allowed() );
	}

	function test_get_space_allowed_negative_site_option() {
		update_option( 'blog_upload_space', false );
		update_site_option( 'blog_upload_space', -1 );
		$this->assertEquals( -1, get_space_allowed() );
	}

	/**
	 * Provide a hardcoded amount for space used when testing upload quota,
	 * allowed space, and available space.
	 *
	 * @return int
	 */
	function _filter_space_used() {
		return 300;
	}

	function test_upload_is_user_over_quota_default() {
		$this->assertFalse( upload_is_user_over_quota( false ) );
	}

	function test_upload_is_user_over_quota_check_enabled() {
		update_site_option('upload_space_check_disabled', false);
		$this->assertFalse( upload_is_user_over_quota( false ) );
	}

	/**
	 * When the upload space check is disabled, using more than the available
	 * quota is allowed.
	 */
	function test_upload_is_user_over_check_disabled() {
		update_site_option( 'upload_space_check_disabled', true );
		update_site_option( 'blog_upload_space', 100 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertFalse( upload_is_user_over_quota( false ) );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	/**
	 * If 0 is set for `blog_upload_space`, a fallback of 100 is used.
	 */
	function test_upload_is_user_over_quota_upload_space_0() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 0 );
		$this->assertFalse( upload_is_user_over_quota( false ) );
	}

	/**
	 * Filter the space space used as 300 to trigger a true upload quota
	 * without requiring actual files.
	 */
	function test_upload_is_user_over_quota_upload_space_0_filter_space_used() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 0 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertTrue( upload_is_user_over_quota( false ) );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	function test_upload_is_user_over_quota_upload_space_200() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 200 );
		$this->assertFalse( upload_is_user_over_quota( false ) );
	}

	function test_upload_is_user_over_quota_upload_space_200_filter_space_used() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 200 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertTrue( upload_is_user_over_quota( false ) );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	/**
	 * If the space used is exactly the same as the available quota, an over
	 * quota response is not expected.
	 */
	function test_upload_is_user_over_quota_upload_space_exact() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 300 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertFalse( upload_is_user_over_quota( false ) );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	function test_upload_is_user_over_quota_upload_space_negative() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', -1 );
		$this->assertTrue( upload_is_user_over_quota( false ) );
	}

	function test_is_upload_space_available_default() {
		$this->assertTrue( is_upload_space_available() );
	}

	function test_is_upload_space_available_check_disabled() {
		update_site_option( 'upload_space_check_disabled', true );
		$this->assertTrue( is_upload_space_available() );
	}

	function test_is_upload_space_available_space_used_is_less() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 350 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertTrue( is_upload_space_available() );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	function test_is_upload_space_available_space_used_is_more() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 250 );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertFalse( is_upload_space_available() );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	function test_is_upload_space_available_upload_space_0() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', 0 );
		$this->assertTrue( is_upload_space_available() );
	}

	function test_is_upload_space_available_upload_space_negative() {
		update_site_option( 'upload_space_check_disabled', false );
		update_site_option( 'blog_upload_space', -1 );
		$this->assertFalse( is_upload_space_available() );
	}

	/**
	 * Test the primary purpose of get_blog_post(), to retrieve a post from
	 * another site on the network.
	 */
	function test_get_blog_post_from_another_site_on_network() {
		$blog_id = $this->factory->blog->create();
		$post_id = $this->factory->post->create(); // Create a post on the primary site, ID 1.
		$post = get_post( $post_id );
		switch_to_blog( $blog_id );

		// The post created and retrieved on the main site should match the one retrieved "remotely".
		$this->assertEquals( $post, get_blog_post( 1, $post_id ) );

		restore_current_blog();
	}

	/**
	 * If get_blog_post() is used on the same site, it should still work.
	 */
	function test_get_blog_post_from_same_site() {
		$post_id = $this->factory->post->create();

		$this->assertEquals( get_blog_post( 1, $post_id ), get_post( $post_id ) );
	}

	/**
	 * A null response should be returned if an invalid post is requested.
	 */
	function test_get_blog_post_invalid_returns_null() {
		$this->assertNull( get_blog_post( 1, 999999 ) );
	}

	/**
	 * Added as a callback to the domain_exists filter to provide manual results for
	 * the testing of the filter and for a test which does not need the database.
	 */
	function _domain_exists_cb( $exists, $domain, $path, $site_id ) {
		if ( 'foo' == $domain && 'bar/' == $path )
			return 1234;
		else
			return null;
	}

	function test_domain_exists_with_default_site_id() {
		$details = get_blog_details( 1, false );

		$this->assertEquals( 1, domain_exists( $details->domain, $details->path ) );
	}

	function test_domain_exists_with_specified_site_id() {
		$details = get_blog_details( 1, false );

		$this->assertEquals( 1, domain_exists( $details->domain, $details->path, $details->site_id ) );
	}

	/**
	 * When the domain is valid, but the resulting site does not belong to the specified network,
	 * it is marked as not existing.
	 */
	function test_domain_does_not_exist_with_invalid_site_id() {
		$details = get_blog_details( 1, false );

		$this->assertEquals( null, domain_exists( $details->domain, $details->path, 999 ) );
	}

	function test_invalid_domain_does_not_exist_with_default_site_id() {
		$this->assertEquals( null, domain_exists( 'foo', 'bar' ) );
	}

	function test_domain_filtered_to_exist() {
		add_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );

		$this->assertEquals( 1234, domain_exists( 'foo', 'bar' ) );

		remove_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );
	}

	/**
	 * When a path is passed to domain_exists, it is immediately trailing slashed. A path
	 * value with or without the slash should result in the same return value.
	 */
	function test_slashed_path_in_domain_exists() {
		add_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );

		// Make sure the same result is returned with or without a trailing slash
		$this->assertEquals( domain_exists( 'foo', 'bar' ), domain_exists( 'foo', 'bar/' ) );

		remove_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );
	}

	/**
	 * Tests returning an address for a given valid id.
	 */
	function test_get_blogaddress_by_id_with_valid_id() {
		$blogaddress = get_blogaddress_by_id( 1 );
		$this->assertEquals( 'http://' . WP_TESTS_DOMAIN . '/', $blogaddress );
	}

	/**
	 * Tests returning the appropriate response for a invalid id given.
	 */
	function test_get_blogaddress_by_id_with_invalid_id() {
		$blogaddress = get_blogaddress_by_id( 42 );
		$this->assertEquals( '', $blogaddress );
	}
}

endif;
