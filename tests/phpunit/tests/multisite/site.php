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
		parent::tearDown();
		$wpdb->suppress_errors( $this->suppress );
	}

	function test_switch_restore_blog() {
		global $_wp_switched_stack, $wpdb;

		$this->assertEquals( array(), $_wp_switched_stack );
		$this->assertFalse( ms_is_switched() );
		$current_blog_id = get_current_blog_id();
		$this->assertInternalType( 'integer', $current_blog_id );

		wp_cache_set( 'switch-test', $current_blog_id, 'switch-test' );
		$this->assertEquals( $current_blog_id, wp_cache_get( 'switch-test', 'switch-test' ) );

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/test_blogpath', 'title' => 'Test Title' ) );

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
	 * Test the deletion of a site, including a case where database tables are
	 * intentionally not deleted.
	 */
	function test_wpmu_delete_blog() {
		global $wpdb;

		$blog_ids = $this->factory->blog->create_many( 2 );

		$drop_tables = false;

		// Delete both sites, but keep the database tables for one.
		foreach ( $blog_ids as $blog_id ) {
			// drop tables for every second blog
			$drop_tables = ! $drop_tables;

			$details = get_blog_details( $blog_id, false );

			wpmu_delete_blog( $blog_id, $drop_tables );

			$this->assertEquals( false, wp_cache_get( 'get_id_from_blogname_' . trim( $details->path, '/' ), 'blog-details' ) );
			$this->assertEquals( false, wp_cache_get( $blog_id, 'blog-details' ) );
			$this->assertEquals( false, wp_cache_get( $blog_id . 'short', 'blog-details' ) );
			$key = md5( $details->domain . $details->path );
			$this->assertEquals( false, wp_cache_get( $key, 'blog-lookup' ) );
			$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );

			$prefix = $wpdb->get_blog_prefix( $blog_id );
			foreach ( $wpdb->tables( 'blog', false ) as $table ) {
				$suppress = $wpdb->suppress_errors();
				$table_fields = $wpdb->get_results( "DESCRIBE $prefix$table;" );
				$wpdb->suppress_errors( $suppress );
				if ( $drop_tables ) {
					$this->assertEmpty( $table_fields );
				} else {
					$this->assertNotEmpty( $table_fields, $prefix . $table );
				}
			}
		}

		// update the blog count cache to use get_blog_count()
		wp_update_network_counts();
		$this->assertEquals( 1, get_blog_count() );
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

	function test_update_blog_details() {
		global $test_action_counter;

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/test_blogpath', 'title' => 'Test Title' ) );
		$this->assertInternalType( 'int', $blog_id );

		$result = update_blog_details( $blog_id, array('domain' => 'example.com', 'path' => 'my_path/') );
		$this->assertTrue( $result );

		$blog = get_blog_details( $blog_id );
		$this->assertEquals( 'example.com', $blog->domain );
		$this->assertEquals( 'my_path/', $blog->path );
		$this->assertEquals( '0', $blog->spam );

		$result = update_blog_details( $blog_id, array('domain' => 'example2.com','spam' => 1) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( 'example2.com', $blog->domain );
		$this->assertEquals( 'my_path/', $blog->path );
		$this->assertEquals( '1', $blog->spam );

		$result = update_blog_details( $blog_id );
		$this->assertFalse( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( 'example2.com', $blog->domain );
		$this->assertEquals( 'my_path/', $blog->path );
		$this->assertEquals( '1', $blog->spam );

		$test_action_counter = 0;

		add_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'spam' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'spam' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( 1, $test_action_counter );
		remove_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'spam' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 2, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'spam' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( 2, $test_action_counter );
		remove_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'archived' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 3, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'archived' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( 3, $test_action_counter );
		remove_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'archived' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 4, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'archived' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( 4, $test_action_counter );
		remove_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'deleted' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 5, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'deleted' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( 5, $test_action_counter );
		remove_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'deleted' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 6, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'deleted' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( 6, $test_action_counter );
		remove_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'mature' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 7, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'mature' => 1 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( 7, $test_action_counter );
		remove_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_details( $blog_id, array( 'mature' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 8, $test_action_counter );

		// Same again
		$result = update_blog_details( $blog_id, array( 'mature' => 0 ) );
		$this->assertTrue( $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( 8, $test_action_counter );
		remove_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10, 1 );
	}

	function _action_counter_cb( $blog_id ) {
		global $test_action_counter;
		$test_action_counter++;
	}

	/**
	 * Test fetching a blog that doesn't exist and again after it exists.
	 *
	 * @ticket 23405
	 */
	function test_get_blog_details_blog_does_not_exist() {
		global $wpdb;

		$blog_id = $wpdb->get_var( "SELECT MAX(blog_id) FROM $wpdb->blogs" );

		// An idosyncrancy of the unit tests is that the max blog_id gets reset
		// to 1 in between test cases but picks up where it previously left off
		// on the next insert. If 1 is reported, burn a blog create to get
		// the max counter back in sync.
		if ( 1 == $blog_id ) {
			$blog_id = $this->factory->blog->create();
		}
		$blog_id++;

		$this->assertFalse( wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertFalse( get_blog_details( $blog_id ) );
		$this->assertEquals( -1, wp_cache_get( $blog_id, 'blog-details' ) );
		$this->assertFalse( get_blog_details( $blog_id ) );
		$this->assertEquals( -1, wp_cache_get( $blog_id, 'blog-details' ) );

		$this->assertEquals( $blog_id, $this->factory->blog->create() );
		$this->assertFalse( wp_cache_get( $blog_id, 'blog-details' )  );

		$blog = get_blog_details( $blog_id );
		$this->assertEquals( $blog_id, $blog->blog_id );
		$this->assertEquals( $blog, wp_cache_get( $blog_id, 'blog-details' ) );

		wpmu_delete_blog( $blog_id );
		$this->assertFalse( wp_cache_get( $blog_id, 'blog-details' ) );
		$blog->deleted = '1';
		$this->assertEQuals( $blog, get_blog_details( $blog_id ) );
		$this->assertEquals( $blog, wp_cache_get( $blog_id, 'blog-details' ) );

		wpmu_delete_blog( $blog_id, true );
		$this->assertFalse( get_blog_details( $blog_id ) );
		$this->assertEquals( -1, wp_cache_get( $blog_id, 'blog-details' ) );
	}

	function test_update_blog_status() {
		global $test_action_counter;

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/test_blogpath', 'title' => 'Test Title' ) );
		$this->assertInternalType( 'int', $blog_id );

		$test_action_counter = 0;
		$count = 1;

		add_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_status( $blog_id, 'spam', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'spam', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->spam );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'make_ham_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		$count++;
		add_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$result = update_blog_status( $blog_id, 'spam', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'spam', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->spam );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'make_spam_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'archived', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'archived', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->archived );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'archive_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'archived', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$result = update_blog_status( $blog_id, 'archived', 0 );
		$count++;
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->archived );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'unarchive_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'deleted', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'deleted', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->deleted );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'make_delete_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'deleted', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'deleted', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->deleted );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'make_undelete_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'mature', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'mature', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->mature );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'mature_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'mature', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'mature', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->mature );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'unmature_blog', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'public', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->public );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'public', 0 );
		$this->assertEquals( 0, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '0', $blog->public );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10, 1 );

		add_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10, 1 );
		$count++;
		$result = update_blog_status( $blog_id, 'public', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->public );
		$this->assertEquals( $count, $test_action_counter );

		// Same again
		$count++;
		$result = update_blog_status( $blog_id, 'public', 1 );
		$this->assertEquals( 1, $result );
		$blog = get_blog_details( $blog_id );
		$this->assertEquals( '1', $blog->public );
		$this->assertEquals( $count, $test_action_counter );
		remove_action( 'update_blog_public', array( $this, '_action_counter_cb' ), 10, 1 );

		// Updating a dummy field returns the value passed. Go fig.
		$result = update_blog_status( $blog_id, 'doesnotexist', 1 );
		$this->assertEquals( 1, $result );
	}

	/**
	 * @ticket 14511
	 */
	function test_wp_get_sites() {
		$this->factory->blog->create_many( 2, array( 'site_id' => 2, 'meta' => array( 'public' => 1 ) ) );
		$this->factory->blog->create_many( 3, array( 'site_id' => 3, 'meta' => array( 'public' => 0 ) ) );

		// Expect no sites when passed an invalid network_id
		$this->assertCount( 0, wp_get_sites( array( 'network_id' => 0 ) ) );
		$this->assertCount( 0, wp_get_sites( array( 'network_id' => 4 ) ) );

		// Expect 1 site when no network_id is specified - defaults to current network.
		$this->assertCount( 1, wp_get_sites() );
		// Expect 6 sites when network_id = null.
		$this->assertCount( 6, wp_get_sites( array( 'network_id' => null ) ) );

		// Expect 1 site with a network_id of 1, 2 for network_id 2, 3 for 3
		$this->assertCount( 1, wp_get_sites( array( 'network_id' => 1 ) ) );
		$this->assertCount( 2, wp_get_sites( array( 'network_id' => 2 ) ) );
		$this->assertCount( 3, wp_get_sites( array( 'network_id' => 3 ) ) );

		// Expect 6 sites when public is null (across all networks)
		$this->assertCount( 6, wp_get_sites( array( 'public' => null, 'network_id' => null ) ) );

		// Expect 3 sites when public is 1
		$this->assertCount( 3, wp_get_sites( array( 'public' => 1, 'network_id' => null ) ) );

		// Expect 2 sites when public is 1 and network_id is 2
		$this->assertCount( 2, wp_get_sites( array( 'network_id' => 2, 'public' => 1 ) ) );

		// Expect no sites when public is set to 0 and network_id is not 3
		$this->assertCount( 0, wp_get_sites( array( 'network_id' => 1, 'public' => 0 ) ) );

		// Test public + network_id = 3
		$this->assertCount( 0, wp_get_sites( array( 'network_id' => 3, 'public' => 1 ) ) );
		$this->assertCount( 3, wp_get_sites( array( 'network_id' => 3, 'public' => 0 ) ) );
	}

	/**
	 * @ticket 14511
	 */
	function test_wp_get_sites_limit_offset() {
		// Create 4 more sites (in addition to the default one)
		$this->factory->blog->create_many( 4, array( 'meta' => array( 'public' => 1 ) ) );

		// Expect all 5 sites when no limit/offset is specified
		$this->assertCount( 5, wp_get_sites() );

		// Expect first 2 sites when using limit
		$this->assertCount( 2, wp_get_sites( array( 'limit' => 2 ) ) );

		// Expect only the last 3 sites when using offset of 2 (limit will default to 100)
		$this->assertCount( 3, wp_get_sites( array( 'offset' => 2 ) ) );

		// Expect only the last 1 site when using offset of 4 and limit of 2
		$this->assertCount( 1, wp_get_sites( array( 'limit' => 2, 'offset' => 4 ) ) );

		// Expect 0 sites when using an offset larger than the number of sites
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
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/testdomainexists', 'title' => 'Test Title' ) );

		$details = get_blog_details( $blog_id, false );
		$key = md5( $details->domain . $details->path );

		// Test the original response and cached response for the newly created site.
		$this->assertEquals( $blog_id, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( $key, 'blog-id-cache' ) );

		// Test the case insensitivity of the site lookup.
		$this->assertEquals( $blog_id, get_blog_id_from_url( strtoupper( $details->domain ) , strtoupper( $details->path ) ) );

		// Test the first and cached responses for a non existent site.
		$this->assertEquals( 0, get_blog_id_from_url( $details->domain, 'foo' ) );
		$this->assertEquals( -1, wp_cache_get( md5( $details->domain . 'foo' ), 'blog-id-cache' ) );

		// A blog ID is still available if only the 'deleted' flag is set for a site.
		wpmu_delete_blog( $blog_id );
		$this->assertEquals( $blog_id, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( $key, 'blog-id-cache' ) );

		// Explicitly pass $drop = false (default), a blog ID will still be available.
		wpmu_delete_blog( $blog_id, false );
		$this->assertEquals( $blog_id, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, wp_cache_get( $key, 'blog-id-cache' ) );

		// When deleted with the drop parameter at true, the cache will first be false, and then
		// set to -1 after an attempt at get_blog_id_from_url() is made.
		wpmu_delete_blog( $blog_id, true );
		$this->assertEquals( false, wp_cache_get( $key, 'blog-id-cache' ) );
		$this->assertEquals( 0, get_blog_id_from_url( $details->domain, $details->path ) );
		$this->assertEquals( -1, wp_cache_get( $key, 'blog-id-cache' ) );
	}

	function test_is_main_site() {
		$this->assertTrue( is_main_site() );
		$this->assertTrue( is_main_site( get_current_blog_id() ) );

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id ) );

		switch_to_blog( $blog_id  );
		$this->assertFalse( is_main_site( $blog_id ) );
		$this->assertFalse( is_main_site( get_current_blog_id() ) );
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

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id ) );

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

		update_site_option( 'ms_files_rewriting', 1 );
		ms_upload_constants();

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id2 = $this->factory->blog->create( array( 'user_id' => $user_id ) );
		$info = wp_upload_dir();
		$this->assertEquals( 'http://' . $site->domain . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );

		switch_to_blog( $blog_id2 );
		$info2 = wp_upload_dir();
		$this->assertNotEquals( $info, $info2 );
		$this->assertEquals( get_option( 'siteurl' )  . '/wp-content/blogs.dir/' . get_current_blog_id() . '/files/' . gmstrftime('%Y/%m'), $info2['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/blogs.dir/' . get_current_blog_id() . '/files/' . gmstrftime('%Y/%m'), $info2['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info2['subdir'] );
		$this->assertEquals( '', $info2['error'] );
		restore_current_blog();
		update_site_option( 'ms_files_rewriting', 0 );
	}

	/**
	 * @ticket 18119
	 */
	function test_upload_is_user_over_quota() {
		$default_space_allowed = 100;
		$echo = false;

		$this->assertFalse( upload_is_user_over_quota( $echo ) );
		$this->assertTrue( is_upload_space_available() );

		update_site_option('upload_space_check_disabled', true);
		$this->assertFalse( upload_is_user_over_quota( $echo ) );
		$this->assertTrue( is_upload_space_available() );

		update_site_option( 'blog_upload_space', 0 );
		$this->assertFalse( upload_is_user_over_quota( $echo ) );
		$this->assertEquals( $default_space_allowed, get_space_allowed() );
		$this->assertTrue( is_upload_space_available() );

		update_site_option('upload_space_check_disabled', false);
		$this->assertFalse( upload_is_user_over_quota( $echo ) );
		$this->assertTrue( is_upload_space_available() );

		if ( defined( 'BLOGSUPLOADDIR' ) && ! file_exists( BLOGSUPLOADDIR ) )
			$this->markTestSkipped( 'This test is broken when blogs.dir does not exist. ');

		/*
		This is broken when blogs.dir does not exist, as get_upload_space_available()
		simply returns the value of blog_upload_space (converted to bytes), which would
		be negative but still not false. When blogs.dir does exist, < 0 is returned as 0.
		*/

		update_site_option( 'blog_upload_space', -1 );
		$this->assertTrue( upload_is_user_over_quota( $echo ) );
		$this->assertEquals( -1, get_space_allowed() );
		$this->assertFalse( is_upload_space_available() );

		update_option( 'blog_upload_space', 0 );
		$this->assertFalse( upload_is_user_over_quota( $echo ) );
		$this->assertEquals( $default_space_allowed, get_space_allowed() );
		$this->assertTrue( is_upload_space_available() );

		update_option( 'blog_upload_space', -1 );
		$this->assertTrue( upload_is_user_over_quota( $echo ) );
		$this->assertEquals( -1, get_space_allowed() );
		$this->assertFalse( is_upload_space_available() );
	}

	function test_get_blog_post() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/test_blogpath', 'title' => 'Test Title' ) );
		$current_blog_id = get_current_blog_id();

		$post_id = $this->factory->post->create();
		$this->assertInstanceOf( 'WP_Post', get_post( $post_id ) );
		switch_to_blog( $blog_id );
		$this->assertNull( get_post( $post_id ) );
		$post = get_blog_post( $current_blog_id, $post_id );
		$this->assertInstanceOf( 'WP_Post', $post );
		$this->assertEquals( $post_id, $post->ID );
		restore_current_blog();

		wp_update_post( array( 'ID' => $post_id, 'post_title' => 'A Different Title' ) );
		switch_to_blog( $blog_id );
		$post = get_blog_post( $current_blog_id, $post_id );
		// Make sure cache is good
		$this->assertEquals( 'A Different Title', $post->post_title );

		$post_id2 = $this->factory->post->create();
		// Test get_blog_post() with currently active blog ID.
		$post = get_blog_post( $blog_id, $post_id2 );
		$this->assertInstanceOf( 'WP_Post', $post );
		$this->assertEquals( $post_id2, $post->ID );
		restore_current_blog();
	}

	function _domain_exists_cb( $exists, $domain, $path, $site_id ) {
		if ( 'foo' == $domain && 'bar/' == $path )
			return 1234;
		else
			return null;
	}

	function test_domain_exists() {
		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id = $this->factory->blog->create( array( 'user_id' => $user_id, 'path' => '/testdomainexists', 'title' => 'Test Title' ) );

		$details = get_blog_details( $blog_id, false );

		$this->assertEquals( $blog_id, domain_exists( $details->domain, $details->path ) );
		$this->assertEquals( $blog_id, domain_exists( $details->domain, $details->path, $details->site_id ) );
		$this->assertEquals( null, domain_exists( $details->domain, $details->path, 999 ) );
		$this->assertEquals( null, domain_exists( 'foo', 'bar' ) );

		add_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );
		$this->assertEquals( 1234, domain_exists( 'foo', 'bar' ) );
		$this->assertEquals( null, domain_exists( 'foo', 'baz' ) );
		$this->assertEquals( null, domain_exists( 'bar', 'foo' ) );

		// Make sure the same result is returned with or without a trailing slash
		$this->assertEquals( domain_exists( 'foo', 'bar' ), domain_exists( 'foo', 'bar/' ) );

		remove_filter( 'domain_exists', array( $this, '_domain_exists_cb' ), 10, 4 );
		$this->assertEquals( null, domain_exists( 'foo', 'bar' ) );

		wpmu_delete_blog( $blog_id );
		$this->assertEquals( $blog_id, domain_exists( $details->domain, $details->path ) );
		wpmu_delete_blog( $blog_id, true );
		$this->assertEquals( null, domain_exists( $details->domain, $details->path ) );
	}
}

endif;