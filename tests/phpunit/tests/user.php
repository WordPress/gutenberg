<?php

// test functions in wp-includes/user.php
/**
 * @group user
 */
class Tests_User extends WP_UnitTestCase {

	protected $user_data;

	function setUp() {
		parent::setUp();

		$this->user_data = array(
			'user_login' => 'user1',
			'user_nicename' => 'userone',
			'user_pass'  => 'password',
			'first_name' => 'John',
			'last_name'  => 'Doe',
			'display_name' => 'John Doe',
			'user_email' => 'blackburn@battlefield3.com',
			'user_url' => 'http://tacos.com'
		);
	}

	function test_get_users_of_blog() {
		// add one of each user role
		$nusers = array();
		foreach ( array('administrator', 'editor', 'author', 'contributor', 'subscriber' ) as $role ) {
			$id = $this->factory->user->create( array( 'role' => $role ) );
			$nusers[ $id ] = $id;
		}

		$user_list = get_users();

		// find the role of each user as returned by get_users_of_blog
		$found = array();
		foreach ( $user_list as $user ) {
			// only include the users we just created - there might be some others that existed previously
			if ( isset( $nusers[$user->ID] ) ) {
				$found[ $user->ID] = $user->ID;
			}
		}

		// make sure every user we created was returned
		$this->assertEquals($nusers, $found);
	}

	// simple get/set tests for user_option functions
	function test_user_option() {
		$key = rand_str();
		$val = rand_str();

		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );

		// get an option that doesn't exist
		$this->assertFalse(get_user_option($key, $user_id));

		// set and get
		update_user_option( $user_id, $key, $val );
		$this->assertEquals( $val, get_user_option($key, $user_id) );

		// change and get again
		$val2 = rand_str();
		update_user_option( $user_id, $key, $val2 );
		$this->assertEquals( $val2, get_user_option($key, $user_id) );

	}

	// simple tests for usermeta functions
	function test_usermeta() {

		$key = rand_str();
		$val = rand_str();

		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );

		// get a meta key that doesn't exist
		$this->assertEquals( '', get_user_meta($user_id, $key, true));

		// set and get
		update_user_meta( $user_id, $key, $val );
		$this->assertEquals( $val, get_user_meta($user_id, $key, true) );

		// change and get again
		$val2 = rand_str();
		update_user_meta( $user_id, $key, $val2 );
		$this->assertEquals( $val2, get_user_meta($user_id, $key, true) );

		// delete and get
		delete_user_meta( $user_id, $key );
		$this->assertEquals( '', get_user_meta($user_id, $key, true) );

		// delete by key AND value
		update_user_meta( $user_id, $key, $val );
		// incorrect key: key still exists
		delete_user_meta( $user_id, $key, rand_str() );
		$this->assertEquals( $val, get_user_meta($user_id, $key, true) );
		// correct key: deleted
		delete_user_meta( $user_id, $key, $val );
		$this->assertEquals( '', get_user_meta($user_id, $key, true) );

	}

	// test usermeta functions in array mode
	function test_usermeta_array() {
		// some values to set
		$vals = array(
			rand_str() => 'val-'.rand_str(),
			rand_str() => 'val-'.rand_str(),
			rand_str() => 'val-'.rand_str(),
		);

		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );

		// there is already some stuff in the array
		$this->assertTrue(is_array(get_user_meta($user_id)));

		foreach ($vals as $k=>$v)
			update_user_meta( $user_id, $k, $v );

		// get the complete usermeta array
		$out = get_user_meta($user_id);

		// for reasons unclear, the resulting array is indexed numerically; meta keys are not included anywhere.
		// so we'll just check to make sure our values are included somewhere.
		foreach ($vals as $k=>$v)
			$this->assertTrue(isset($out[$k]) && $out[$k][0] == $v);

		// delete one key and check again
		$keys = array_keys( $vals );
		$key_to_delete = array_pop( $keys );
		delete_user_meta($user_id, $key_to_delete);
		$out = get_user_meta($user_id);
		// make sure that key is excluded from the results
		foreach ($vals as $k=>$v) {
			if ($k == $key_to_delete)
				$this->assertFalse(isset($out[$k]));
			else
			$this->assertTrue(isset($out[$k]) && $out[$k][0] == $v);
		}
	}

	// Test property magic functions for property get/set/isset.
	function test_user_properties() {
		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		foreach ( $user->data as $key => $data ) {
			$this->assertEquals( $data, $user->$key );
		}

		$this->assertTrue( isset( $user->$key ) );
		$this->assertFalse( isset( $user->fooooooooo ) );

		$user->$key = 'foo';
		$this->assertEquals( 'foo', $user->$key );
		$this->assertEquals( 'foo', $user->data->$key );  // This will fail with WP < 3.3

		foreach ( (array) $user as $key => $value ) {
			$this->assertEquals( $value, $user->$key );
		}
	}

	// Test meta property magic functions for property get/set/isset.
	function test_user_meta_properties() {
		global $wpdb;

		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		update_user_option( $user_id, 'foo', 'foo', true );

		$this->assertTrue( isset( $user->foo ) );

		$this->assertEquals( 'foo', $user->foo );
	}

	/**
	 * @expectedDeprecated WP_User->id
	 */
	function test_id_property_back_compat() {
		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		$this->assertTrue( isset( $user->id ) );
		$this->assertEquals( $user->ID, $user->id );
		$user->id = 1234;
		$this->assertEquals( $user->ID, $user->id );
	}

	/**
	 * ticket 19265
	 */
	function test_user_level_property_back_compat() {
		$roles = array(
			'administrator' => 10,
			'editor' => 7,
			'author' => 2,
			'contributor' => 1,
			'subscriber' => 0,
		);

		foreach ( $roles as $role => $level ) {
			$user_id = $this->factory->user->create( array( 'role' => $role ) );
			$user = new WP_User( $user_id );

			$this->assertTrue( isset( $user->user_level ) );
			$this->assertEquals( $level, $user->user_level );
		}
	}

	function test_construction() {
		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );

		$user = new WP_User( $user_id );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertEquals( $user_id, $user->ID );

		$user2 = new WP_User( 0,  $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user2 );
		$this->assertEquals( $user_id, $user2->ID );
		$this->assertEquals( $user->user_login, $user2->user_login );

		$user3 = new WP_User();
		$this->assertInstanceOf( 'WP_User', $user3 );
		$this->assertEquals( 0, $user3->ID );
		$this->assertFalse( isset( $user3->user_login ) );

		$user3->init( $user->data );
		$this->assertEquals( $user_id, $user3->ID );

		$user4 = new WP_User( $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user4 );
		$this->assertEquals( $user_id, $user4->ID );
		$this->assertEquals( $user->user_login, $user4->user_login );

		$user5 = new WP_User( null, $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user5 );
		$this->assertEquals( $user_id, $user5->ID );
		$this->assertEquals( $user->user_login, $user5->user_login );

		$user6 = new WP_User( $user );
		$this->assertInstanceOf( 'WP_User', $user6 );
		$this->assertEquals( $user_id, $user6->ID );
		$this->assertEquals( $user->user_login, $user6->user_login );

		$user7 = new WP_User( $user->data );
		$this->assertInstanceOf( 'WP_User', $user7 );
		$this->assertEquals( $user_id, $user7->ID );
		$this->assertEquals( $user->user_login, $user7->user_login );
	}

	function test_get() {
		$user_id = $this->factory->user->create( array(
			'role' => 'author',
			'user_login' => 'test_wp_user_get',
			'user_pass' => 'password',
			'user_email' => 'test@test.com',
		) );

		$user = new WP_User( $user_id );
		$this->assertEquals( 'test_wp_user_get', $user->get( 'user_login' ) );
		$this->assertEquals( 'test@test.com', $user->get( 'user_email' ) );
		$this->assertEquals( 0, $user->get( 'use_ssl' ) );
		$this->assertEquals( '', $user->get( 'field_that_does_not_exist' ) );

		update_user_meta( $user_id, 'dashed-key', 'abcdefg' );
		$this->assertEquals( 'abcdefg', $user->get( 'dashed-key' ) );
	}

	function test_has_prop() {
		$user_id = $this->factory->user->create( array(
			'role' => 'author',
			'user_login' => 'test_wp_user_has_prop',
			'user_pass' => 'password',
			'user_email' => 'test2@test.com',
		) );

		$user = new WP_User( $user_id );
		$this->assertTrue( $user->has_prop( 'user_email') );
		$this->assertTrue( $user->has_prop( 'use_ssl' ) );
		$this->assertFalse( $user->has_prop( 'field_that_does_not_exist' ) );

		update_user_meta( $user_id, 'dashed-key', 'abcdefg' );
		$this->assertTrue( $user->has_prop( 'dashed-key' ) );
	}

	function test_update_user() {
		$user_id = $this->factory->user->create( array(
			'role' => 'author',
			'user_login' => 'test_wp_update_user',
			'user_pass' => 'password',
			'user_email' => 'test3@test.com',
		) );
		$user = new WP_User( $user_id );

		update_user_meta( $user_id, 'description', 'about me' );
		$this->assertEquals( 'about me', $user->get( 'description' ) );

		$user_data = array( 'ID' => $user_id, 'display_name' => 'test user' );
		wp_update_user( $user_data );

		$user = new WP_User( $user_id );
		$this->assertEquals( 'test user', $user->get( 'display_name' ) );

		// Make sure there is no collateral damage to fields not in $user_data
		$this->assertEquals( 'about me', $user->get( 'description' ) );

		// Pass as stdClass
		$user_data = array( 'ID' => $user_id, 'display_name' => 'a test user' );
		wp_update_user( (object) $user_data );

		$user = new WP_User( $user_id );
		$this->assertEquals( 'a test user', $user->get( 'display_name' ) );

		// Pass as WP_User
		$user = new WP_User( $user_id );
		$user->display_name = 'some test user';
		wp_update_user( $user );

		$user = new WP_User( $user_id );
		$this->assertEquals( 'some test user', $user->get( 'display_name' ) );

		// Test update of fields in _get_additional_user_keys()
		$user_data = array( 'ID' => $user_id, 'use_ssl' => 1, 'show_admin_bar_front' => 1,
						   'rich_editing' => 1, 'first_name' => 'first', 'last_name' => 'last',
						   'nickname' => 'nick', 'comment_shortcuts' => 'true', 'admin_color' => 'classic',
						   'description' => 'describe' );
		wp_update_user( $user_data );

		$user = new WP_User( $user_id );
		foreach ( $user_data as $key => $value )
			$this->assertEquals( $value, $user->get( $key ), $key );
	}

	/**
	 * Test that usermeta cache is cleared after user deletion.
	 *
	 * @ticket 19500
	 */
	function test_get_blogs_of_user() {
		// Logged out users don't have blogs.
		$this->assertEquals( array(), get_blogs_of_user( 0 ) );

		$user_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		$blogs = get_blogs_of_user( $user_id );
		$this->assertEquals( array( 1 ), array_keys( $blogs ) );

		// Non-existent users don't have blogs.
		if ( is_multisite() )
			wpmu_delete_user( $user_id );
		else
			wp_delete_user( $user_id );

		$user = new WP_User( $user_id );
		$this->assertFalse( $user->exists(), 'WP_User->exists' );
		$this->assertEquals( array(), get_blogs_of_user( $user_id ) );
	}

	/**
	 * Test that usermeta cache is cleared after user deletion.
	 *
	 * @ticket 19500
	 */
	function test_is_user_member_of_blog() {
		$old_current = get_current_user_id();

		$user_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$this->assertTrue( is_user_member_of_blog() );
		$this->assertTrue( is_user_member_of_blog( 0, 0 ) );
		$this->assertTrue( is_user_member_of_blog( 0, get_current_blog_id() ) );
		$this->assertTrue( is_user_member_of_blog( $user_id ) );
		$this->assertTrue( is_user_member_of_blog( $user_id, get_current_blog_id() ) );

		// Will only remove the user from the current site in multisite; this is desired
		// and will achieve the desired effect with is_user_member_of_blog().
		wp_delete_user( $user_id );

		$this->assertFalse( is_user_member_of_blog( $user_id ) );
		$this->assertFalse( is_user_member_of_blog( $user_id, get_current_blog_id() ) );

		wp_set_current_user( $old_current );
	}

	/**
	 * ticket 19595
	 */
	function test_global_userdata() {
		global $userdata, $wpdb;

		$user_id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		wp_set_current_user( $user_id );

		$this->assertNotEmpty( $userdata );
		$this->assertInstanceOf( 'WP_User', $userdata );
		$this->assertEquals( $userdata->ID, $user_id );
		$prefix = $wpdb->get_blog_prefix();
		$cap_key = $prefix . 'capabilities';
		$this->assertTrue( isset( $userdata->$cap_key ) );
	}

	/**
	 * ticket 19769
	 */
	function test_global_userdata_is_null_when_logged_out() {
		global $userdata;
		wp_set_current_user(0);
		$this->assertNull( $userdata );
	}

	function test_exists() {
		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		$this->assertTrue( $user->exists() );

		$user = new WP_User( 123456789 );

		$this->assertFalse( $user->exists() );

		$user = new WP_User( 0 );

		$this->assertFalse( $user->exists() );
	}

	function test_global_authordata() {
		global $authordata, $id;

		$old_post_id = $id;

		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		$post = array(
			'post_author' => $user_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'post'
		);

		// insert a post and make sure the ID is ok
		$post_id = wp_insert_post( $post );
		$this->assertTrue( is_numeric( $post_id ) );

		setup_postdata( get_post( $post_id ) );

		$this->assertNotEmpty( $authordata );
		$this->assertInstanceOf( 'WP_User', $authordata );
		$this->assertEquals( $authordata->ID, $user_id );

		if ( $old_post_id )
			setup_postdata( get_post( $old_post_id ) );
	}

	function test_delete_user() {
		$user_id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User( $user_id );

		$post = array(
			'post_author' => $user_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'post',
		);

		// insert a post and make sure the ID is ok
		$post_id = wp_insert_post($post);
		$this->assertTrue(is_numeric($post_id));
		$this->assertTrue($post_id > 0);

		$post = get_post( $post_id );
		$this->assertEquals( $post_id, $post->ID );

		$post = array(
			'post_author' => $user_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
			'post_type' => 'nav_menu_item',
		);

		// insert a post and make sure the ID is ok
		$nav_id = wp_insert_post($post);
		$this->assertTrue(is_numeric($nav_id));
		$this->assertTrue($nav_id > 0);

		$post = get_post( $nav_id );
		$this->assertEquals( $nav_id, $post->ID );

		wp_delete_user( $user_id );
		$user = new WP_User( $user_id );
		if ( is_multisite() )
			$this->assertTrue( $user->exists() );
		else
			$this->assertFalse( $user->exists() );

		$this->assertNotNull( get_post( $post_id ) );
		$this->assertEquals( 'trash', get_post( $post_id )->post_status );
		// nav_menu_item is delete_with_user = false so the nav post should remain published.
		$this->assertNotNull( get_post( $nav_id ) );
		$this->assertEquals( 'publish', get_post( $nav_id )->post_status );
		wp_delete_post( $nav_id, true );
		$this->assertNull( get_post( $nav_id ) );
		wp_delete_post( $post_id, true );
		$this->assertNull( get_post( $post_id ) );
	}

	/**
	 * @ticket 13317
	 */
	function test_get_userdata() {
		$this->assertFalse( get_userdata( 0 ) );
		$this->assertFalse( get_userdata( '0' ) );
		$this->assertFalse( get_userdata( 'string' ) );
		$this->assertFalse( get_userdata( array( 'array' ) ) );
	}

	function test_user_get_data_by_id() {
		$user_id   = $this->factory->user->create();

		$user = WP_User::get_data_by( 'id', $user_id );
		$this->assertInstanceOf( 'stdClass', $user );
		$this->assertEquals( $user_id, $user->ID );

		// @ticket 23480
		$user = WP_User::get_data_by( 'id', -1 );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', 0 );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', null );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', '' );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', false );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', @$user->user_nicename );
		$this->assertEquals( false, $user );

		$user = WP_User::get_data_by( 'id', 99999 );
		$this->assertEquals( false, $user );
	}

	/**
	 * @ticket 20447
	 */
	function test_wp_delete_user_reassignment_clears_post_caches() {
		$user_id   = $this->factory->user->create();
		$reassign  = $this->factory->user->create();
		$post_id   = $this->factory->post->create( array( 'post_author' => $user_id ) );

		get_post( $post_id ); // Ensure this post is in the cache.

		wp_delete_user( $user_id, $reassign );

		$post = get_post( $post_id );
		$this->assertEquals( $reassign, $post->post_author );
	}

	/**
	 * @ticket 21431
	 */
	function test_count_many_users_posts() {
		$user_id_a = $this->factory->user->create( array( 'role' => 'author' ) );
		$user_id_b = $this->factory->user->create( array( 'role' => 'author' ) );
		$post_id_a = $this->factory->post->create( array( 'post_author' => $user_id_a ) );
		$post_id_b = $this->factory->post->create( array( 'post_author' => $user_id_b ) );
		$post_id_c = $this->factory->post->create( array( 'post_author' => $user_id_b, 'post_status' => 'private' ) );

		wp_set_current_user( $user_id_a );
		$counts = count_many_users_posts( array( $user_id_a, $user_id_b), 'post', false );
		$this->assertEquals( 1, $counts[$user_id_a] );
		$this->assertEquals( 1, $counts[$user_id_b] );

		$counts = count_many_users_posts( array( $user_id_a, $user_id_b), 'post', true );
		$this->assertEquals( 1, $counts[$user_id_a] );
		$this->assertEquals( 1, $counts[$user_id_b] );

		wp_set_current_user( $user_id_b );
		$counts = count_many_users_posts( array( $user_id_a, $user_id_b), 'post', false );
		$this->assertEquals( 1, $counts[$user_id_a] );
		$this->assertEquals( 2, $counts[$user_id_b] );

		$counts = count_many_users_posts( array( $user_id_a, $user_id_b), 'post', true );
		$this->assertEquals( 1, $counts[$user_id_a] );
		$this->assertEquals( 1, $counts[$user_id_b] );
	}

	/**
	 * @ticket 22858
	 */
	function test_wp_update_user_on_nonexistent_users() {
		$user_id = 1;
		// Find me a non-existent user ID.
		while ( get_userdata( $user_id ) )
			++$user_id;

		// If this test fails, it will error out for calling the to_array() method on a non-object.
		$this->assertInstanceOf( 'WP_Error', wp_update_user( array( 'ID' => $user_id ) ) );
	}

	/**
	 * @ticket 28315
	 */
	function test_user_meta_error() {
		$id1 = wp_insert_user( array(
			'user_login' => rand_str(),
			'user_pass' => 'password',
			'user_email' => 'taco@burrito.com',
		) );
		$this->assertEquals( $id1, email_exists( 'taco@burrito.com' ) );

		$id2 = wp_insert_user( array(
			'user_login' => rand_str(),
			'user_pass' => 'password',
			'user_email' => 'taco@burrito.com',
		) );

		if ( ! defined( 'WP_IMPORTING' ) ) {
			$this->assertWPError( $id2 );
		}

		@update_user_meta( $id2, 'key', 'value' );

		$metas = array_keys( get_user_meta( 1 ) );
		$this->assertNotContains( 'key', $metas );
	}

	/**
	 * @ticket 30647
	 */
	function test_user_update_email_error() {
		$id1 = wp_insert_user( array(
			'user_login' => rand_str(),
			'user_pass'  => 'password',
			'user_email' => 'blackburn@battlefield3.com',
		) );
		$this->assertEquals( $id1, email_exists( 'blackburn@battlefield3.com' ) );

		$id2 = wp_insert_user( array(
			'user_login' => rand_str(),
			'user_pass'  => 'password',
			'user_email' => 'miller@battlefield3.com',
		) );
		$this->assertEquals( $id2, email_exists( 'miller@battlefield3.com' ) );

		if( ! is_wp_error( $id2 ) ){
			$return = wp_update_user( array(
				'ID'         => $id2,
				'user_email' => 'david@battlefield3.com',
			) );
			$this->assertEquals( $id2, email_exists( 'david@battlefield3.com' ) );

			$return = wp_update_user( array(
				'ID'         => $id2,
				'user_email' => 'blackburn@battlefield3.com',
			) );
			if ( ! defined( 'WP_IMPORTING' ) ) {
				$this->assertWPError( $return );
			}
		}
	}

	/**
	 * @ticket 29696
	 */
	public function test_wp_insert_user_should_sanitize_user_nicename_parameter() {
		$user = $this->factory->user->create_and_get();

		$userdata = $user->to_array();
		$userdata['user_nicename'] = str_replace( '-', '.', $user->user_nicename );
		wp_insert_user( $userdata );

		$updated_user = new WP_User( $user->ID );

		$this->assertSame( $user->user_nicename, $updated_user->user_nicename );
	}

	function test_changing_email_invalidates_password_reset_key() {
		global $wpdb;

		$user = $this->factory->user->create_and_get();
		$wpdb->update( $wpdb->users, array( 'user_activation_key' => 'key' ), array( 'ID' => $user->ID ) );
		clean_user_cache( $user );

		$user = get_userdata( $user->ID );
		$this->assertEquals( 'key', $user->user_activation_key );

		// Check that changing something other than the email doesn't remove the key.
		$userdata = array(
			'ID'            => $user->ID,
			'user_nicename' => 'wat',
		);
		wp_update_user( $userdata );

		$user = get_userdata( $user->ID );
		$this->assertEquals( 'key', $user->user_activation_key );

		// Now check that changing the email does remove it.
		$userdata = array(
			'ID'            => $user->ID,
			'user_nicename' => 'cat',
			'user_email'    => 'foo@bar.dev',
		);
		wp_update_user( $userdata );

		$user = get_userdata( $user->ID );
		$this->assertEmpty( $user->user_activation_key );
	}

	public function test_search_users_login() {
		$id = $this->factory->user->create( $this->user_data );

		$users = get_users( array( 'search' => 'user1', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( $id, $users ) );
	}

	public function test_search_users_url() {
		$id = $this->factory->user->create( $this->user_data );

		$users = get_users( array( 'search' => '*tacos*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( $id, $users ) );
	}

	public function test_search_users_email() {
		$id = $this->factory->user->create( $this->user_data );

		$users = get_users( array( 'search' => '*battle*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( $id, $users ) );
	}

	public function test_search_users_nicename() {
		$id = $this->factory->user->create( $this->user_data );

		$users = get_users( array( 'search' => '*one*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( $id, $users ) );
	}

	public function test_search_users_display_name() {
		$id = $this->factory->user->create( $this->user_data );

		$users = get_users( array( 'search' => '*Doe*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( $id, $users ) );
	}

	/**
	 * @ticket 32158
	 */
	function test_email_case() {
		// Create a test user with a lower-case email address.
		$user_id = $this->factory->user->create( array(
			'user_email' => 'test@test.com',
		) );

		// Alter the case of the email address (which stays the same).
		$userdata = array(
			'ID' => $user_id,
			'user_email' => 'test@TEST.com',
		);
		$update = wp_update_user( $userdata );

		$this->assertEquals( $user_id, $update );
	}

	/**
	 * @ticket 32158
	 */
	function test_email_change() {
		// Create a test user.
		$user_id = $this->factory->user->create( array(
			'user_email' => 'test@test.com',
		) );

		// Change the email address.
		$userdata = array(
			'ID' => $user_id,
			'user_email' => 'test2@test.com',
		);
		$update = wp_update_user( $userdata );

		// Was this successful?
		$this->assertEquals( $user_id, $update );

		// Verify that the email address has been updated.
		$user = get_userdata( $user_id );
		$this->assertEquals( $user->user_email, 'test2@test.com' );
	}

}
