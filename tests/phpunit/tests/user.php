<?php

// test functions in wp-includes/user.php
/**
 * @group user
 */
class Tests_User extends WP_UnitTestCase {
	protected static $admin_id;
	protected static $editor_id;
	protected static $author_id;
	protected static $contrib_id;
	protected static $sub_id;

	protected static $user_ids = array();

	protected static $_author;
	protected $author;
	protected $user_data;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_ids[] = self::$contrib_id = $factory->user->create( array(
			'user_login' => 'user1',
			'user_nicename' => 'userone',
			'user_pass'  => 'password',
			'first_name' => 'John',
			'last_name'  => 'Doe',
			'display_name' => 'John Doe',
			'user_email' => 'blackburn@battlefield3.com',
			'user_url' => 'http://tacos.com',
			'role' => 'contributor'
		) );

		self::$user_ids[] = self::$author_id = $factory->user->create( array(
			'user_login' => 'author_login',
			'user_email' => 'author@email.com',
			'role' => 'author'
		) );

		self::$user_ids[] = self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$user_ids[] = self::$editor_id = $factory->user->create( array(
			'role' => 'editor',
			'user_email' => 'test@test.com',
		) );
		self::$user_ids[] = self::$sub_id = $factory->user->create( array( 'role' => 'subscriber' ) );

		self::$_author = get_user_by( 'ID', self::$author_id );
	}

	function setUp() {
		parent::setUp();

		$this->author = clone self::$_author;
	}

	function test_get_users_of_blog() {
		// add one of each user role
		$nusers = array(
			self::$contrib_id,
			self::$author_id,
			self::$admin_id,
			self::$editor_id,
			self::$sub_id,
		);

		$user_list = get_users();

		// find the role of each user as returned by get_users_of_blog
		$found = array();
		foreach ( $user_list as $user ) {
			// only include the users we just created - there might be some others that existed previously
			if ( in_array( $user->ID, $nusers ) ) {
				$found[] = $user->ID;
			}
		}

		// make sure every user we created was returned
		$this->assertEqualSets( $nusers, $found );
	}

	// simple get/set tests for user_option functions
	function test_user_option() {
		$key = rand_str();
		$val = rand_str();

		// get an option that doesn't exist
		$this->assertFalse( get_user_option( $key, self::$author_id ) );

		// set and get
		update_user_option( self::$author_id, $key, $val );
		$this->assertEquals( $val, get_user_option( $key, self::$author_id ) );

		// change and get again
		$val2 = rand_str();
		update_user_option( self::$author_id, $key, $val2 );
		$this->assertEquals( $val2, get_user_option( $key, self::$author_id ) );
	}

	// simple tests for usermeta functions
	function test_usermeta() {
		$key = 'key';
		$val = 'value1';

		// get a meta key that doesn't exist
		$this->assertEquals( '', get_user_meta( self::$author_id, $key, true ) );

		// set and get
		update_user_meta( self::$author_id, $key, $val );
		$this->assertEquals( $val, get_user_meta( self::$author_id, $key, true ) );

		// change and get again
		$val2 = 'value2';
		update_user_meta( self::$author_id, $key, $val2 );
		$this->assertEquals( $val2, get_user_meta( self::$author_id, $key, true ) );

		// delete and get
		delete_user_meta( self::$author_id, $key );
		$this->assertEquals( '', get_user_meta( self::$author_id, $key, true ) );

		// delete by key AND value
		update_user_meta( self::$author_id, $key, $val );
		// incorrect key: key still exists
		delete_user_meta( self::$author_id, $key, rand_str() );
		$this->assertEquals( $val, get_user_meta( self::$author_id, $key, true ) );
		// correct key: deleted
		delete_user_meta( self::$author_id, $key, $val );
		$this->assertEquals( '', get_user_meta( self::$author_id, $key, true ) );

	}

	// test usermeta functions in array mode
	function test_usermeta_array() {
		// some values to set
		$vals = array(
			rand_str() => 'val-'.rand_str(),
			rand_str() => 'val-'.rand_str(),
			rand_str() => 'val-'.rand_str(),
		);

		// there is already some stuff in the array
		$this->assertTrue( is_array( get_user_meta( self::$author_id ) ) );

		foreach ( $vals as $k => $v ) {
			update_user_meta( self::$author_id, $k, $v );
		}
		// get the complete usermeta array
		$out = get_user_meta( self::$author_id );

		// for reasons unclear, the resulting array is indexed numerically; meta keys are not included anywhere.
		// so we'll just check to make sure our values are included somewhere.
		foreach ( $vals as $k => $v ) {
			$this->assertTrue( isset( $out[$k] ) && $out[$k][0] == $v );
		}
		// delete one key and check again
		$keys = array_keys( $vals );
		$key_to_delete = array_pop( $keys );
		delete_user_meta( self::$author_id, $key_to_delete );
		$out = get_user_meta( self::$author_id );
		// make sure that key is excluded from the results
		foreach ($vals as $k=>$v) {
			if ($k == $key_to_delete) {
				$this->assertFalse( isset( $out[$k] ) );
			} else {
				$this->assertTrue( isset( $out[$k] ) && $out[$k][0] == $v );
			}
		}
	}

	// Test property magic functions for property get/set/isset.
	function test_user_properties() {
		$user = new WP_User( self::$author_id );

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

	/**
	 * Test the magic __unset method
	 *
	 * @ticket 20043
	 */
	public function test_user_unset() {
		$user = new WP_User( self::$author_id );

		// Test custom fields
		$user->customField = 123;
		$this->assertEquals( $user->customField, 123 );
		unset( $user->customField );
		$this->assertFalse( isset( $user->customField ) );
		return $user;
	}

	/**
	 * @depends test_user_unset
	 * @expectedDeprecated WP_User->id
	 * @ticket 20043
	 */
	function test_user_unset_lowercase_id( $user ) {
		// Test 'id' (lowercase)
		$id = $user->id;
		unset( $user->id );
		$this->assertSame( $id, $user->id );
		return $user;
	}

	/**
	 * @depends test_user_unset_lowercase_id
	 * @ticket 20043
	 */
	function test_user_unset_uppercase_id( $user ) {
		// Test 'ID'
		$this->assertNotEmpty( $user->ID );
		unset( $user->ID );
		$this->assertNotEmpty( $user->ID );
	}

	// Test meta property magic functions for property get/set/isset.
	function test_user_meta_properties() {
		$user = new WP_User( self::$author_id );

		update_user_option( self::$author_id, 'foo', 'foo', true );

		$this->assertTrue( isset( $user->foo ) );

		$this->assertEquals( 'foo', $user->foo );
	}

	/**
	 * @expectedDeprecated WP_User->id
	 */
	function test_id_property_back_compat() {
		$user = new WP_User( self::$author_id );

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
			self::$admin_id => 10,
			self::$editor_id => 7,
			self::$author_id => 2,
			self::$contrib_id => 1,
			self::$sub_id => 0,
		);

		foreach ( $roles as $user_id => $level ) {
			$user = new WP_User( $user_id );

			$this->assertTrue( isset( $user->user_level ) );
			$this->assertEquals( $level, $user->user_level );
		}
	}

	function test_construction() {
		$user = new WP_User( self::$author_id );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertEquals( self::$author_id, $user->ID );

		$user2 = new WP_User( 0,  $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user2 );
		$this->assertEquals( self::$author_id, $user2->ID );
		$this->assertEquals( $user->user_login, $user2->user_login );

		$user3 = new WP_User();
		$this->assertInstanceOf( 'WP_User', $user3 );
		$this->assertEquals( 0, $user3->ID );
		$this->assertFalse( isset( $user3->user_login ) );

		$user3->init( $user->data );
		$this->assertEquals( self::$author_id, $user3->ID );

		$user4 = new WP_User( $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user4 );
		$this->assertEquals( self::$author_id, $user4->ID );
		$this->assertEquals( $user->user_login, $user4->user_login );

		$user5 = new WP_User( null, $user->user_login );
		$this->assertInstanceOf( 'WP_User', $user5 );
		$this->assertEquals( self::$author_id, $user5->ID );
		$this->assertEquals( $user->user_login, $user5->user_login );

		$user6 = new WP_User( $user );
		$this->assertInstanceOf( 'WP_User', $user6 );
		$this->assertEquals( self::$author_id, $user6->ID );
		$this->assertEquals( $user->user_login, $user6->user_login );

		$user7 = new WP_User( $user->data );
		$this->assertInstanceOf( 'WP_User', $user7 );
		$this->assertEquals( self::$author_id, $user7->ID );
		$this->assertEquals( $user->user_login, $user7->user_login );
	}

	function test_get() {
		$user = new WP_User( self::$author_id );
		$this->assertEquals( 'author_login', $user->get( 'user_login' ) );
		$this->assertEquals( 'author@email.com', $user->get( 'user_email' ) );
		$this->assertEquals( 0, $user->get( 'use_ssl' ) );
		$this->assertEquals( '', $user->get( 'field_that_does_not_exist' ) );

		update_user_meta( self::$author_id, 'dashed-key', 'abcdefg' );
		$this->assertEquals( 'abcdefg', $user->get( 'dashed-key' ) );
	}

	function test_has_prop() {
		$user = new WP_User( self::$author_id );
		$this->assertTrue( $user->has_prop( 'user_email') );
		$this->assertTrue( $user->has_prop( 'use_ssl' ) );
		$this->assertFalse( $user->has_prop( 'field_that_does_not_exist' ) );

		update_user_meta( self::$author_id, 'dashed-key', 'abcdefg' );
		$this->assertTrue( $user->has_prop( 'dashed-key' ) );
	}

	function test_update_user() {
		$user = new WP_User( self::$author_id );

		update_user_meta( self::$author_id, 'description', 'about me' );
		$this->assertEquals( 'about me', $user->get( 'description' ) );

		$user_data = array( 'ID' => self::$author_id, 'display_name' => 'test user' );
		wp_update_user( $user_data );

		$user = new WP_User( self::$author_id );
		$this->assertEquals( 'test user', $user->get( 'display_name' ) );

		// Make sure there is no collateral damage to fields not in $user_data
		$this->assertEquals( 'about me', $user->get( 'description' ) );

		// Pass as stdClass
		$user_data = array( 'ID' => self::$author_id, 'display_name' => 'a test user' );
		wp_update_user( (object) $user_data );

		$user = new WP_User( self::$author_id );
		$this->assertEquals( 'a test user', $user->get( 'display_name' ) );

		$user->display_name = 'some test user';
		wp_update_user( $user );

		$this->assertEquals( 'some test user', $user->get( 'display_name' ) );

		// Test update of fields in _get_additional_user_keys()
		$user_data = array(
			'ID' => self::$author_id, 'use_ssl' => 1, 'show_admin_bar_front' => 1,
			'rich_editing' => 1, 'first_name' => 'first', 'last_name' => 'last',
			'nickname' => 'nick', 'comment_shortcuts' => 'true', 'admin_color' => 'classic',
			'description' => 'describe'
		);
		wp_update_user( $user_data );

		$user = new WP_User( self::$author_id );
		foreach ( $user_data as $key => $value ) {
			$this->assertEquals( $value, $user->get( $key ), $key );
		}
	}

	/**
	 * ticket 19595
	 */
	function test_global_userdata() {
		global $userdata, $wpdb;

		wp_set_current_user( self::$sub_id );

		$this->assertNotEmpty( $userdata );
		$this->assertInstanceOf( 'WP_User', $userdata );
		$this->assertEquals( $userdata->ID, self::$sub_id );
		$prefix = $wpdb->get_blog_prefix();
		$cap_key = $prefix . 'capabilities';
		$this->assertTrue( isset( $userdata->$cap_key ) );
	}

	/**
	 * ticket 19769
	 */
	function test_global_userdata_is_null_when_logged_out() {
		global $userdata;
		wp_set_current_user( 0 );
		$this->assertNull( $userdata );
	}

	function test_exists() {
		$user = new WP_User( self::$author_id );

		$this->assertTrue( $user->exists() );

		$user = new WP_User( 123456789 );

		$this->assertFalse( $user->exists() );

		$user = new WP_User( 0 );

		$this->assertFalse( $user->exists() );
	}

	function test_global_authordata() {
		global $authordata, $id;

		$old_post_id = $id;

		$user = new WP_User( self::$author_id );

		$post = array(
			'post_author' => self::$author_id,
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
		$this->assertEquals( $authordata->ID, self::$author_id );

		if ( $old_post_id ) {
			setup_postdata( get_post( $old_post_id ) );
		}
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
		$user = WP_User::get_data_by( 'id', self::$author_id );
		$this->assertInstanceOf( 'stdClass', $user );
		$this->assertEquals( self::$author_id, $user->ID );

		// @ticket 23480
		$user1 = WP_User::get_data_by( 'id', -1 );
		$this->assertEquals( false, $user1 );

		$user2 = WP_User::get_data_by( 'id', 0 );
		$this->assertEquals( false, $user2 );

		$user3 = WP_User::get_data_by( 'id', null );
		$this->assertEquals( false, $user3 );

		$user4 = WP_User::get_data_by( 'id', '' );
		$this->assertEquals( false, $user4 );

		$user5 = WP_User::get_data_by( 'id', false );
		$this->assertEquals( false, $user5 );

		$user6 = WP_User::get_data_by( 'id', $user->user_nicename );
		$this->assertEquals( false, $user6 );

		$user7 = WP_User::get_data_by( 'id', 99999 );
		$this->assertEquals( false, $user7 );
	}

	/**
	 * @ticket 33869
	 */
	public function test_user_get_data_by_ID_should_alias_to_id() {
		$user = WP_User::get_data_by( 'ID', self::$author_id );
		$this->assertEquals( self::$author_id, $user->ID );
	}

	/**
	 * @ticket 21431
	 */
	function test_count_many_users_posts() {
		$user_id_b = self::factory()->user->create( array( 'role' => 'author' ) );
		$post_id_a = self::factory()->post->create( array( 'post_author' => self::$author_id ) );
		$post_id_b = self::factory()->post->create( array( 'post_author' => $user_id_b ) );
		$post_id_c = self::factory()->post->create( array( 'post_author' => $user_id_b, 'post_status' => 'private' ) );

		wp_set_current_user( self::$author_id );
		$counts = count_many_users_posts( array( self::$author_id, $user_id_b ), 'post', false );
		$this->assertEquals( 1, $counts[self::$author_id] );
		$this->assertEquals( 1, $counts[$user_id_b] );

		$counts = count_many_users_posts( array( self::$author_id, $user_id_b ), 'post', true );
		$this->assertEquals( 1, $counts[self::$author_id] );
		$this->assertEquals( 1, $counts[$user_id_b] );

		wp_set_current_user( $user_id_b );
		$counts = count_many_users_posts( array( self::$author_id, $user_id_b ), 'post', false );
		$this->assertEquals( 1, $counts[self::$author_id] );
		$this->assertEquals( 2, $counts[$user_id_b] );

		$counts = count_many_users_posts( array( self::$author_id, $user_id_b ), 'post', true );
		$this->assertEquals( 1, $counts[self::$author_id] );
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
	 * @ticket 28435
	 */
	function test_wp_update_user_should_not_change_password_when_passed_WP_User_instance() {
		$testuserid = 1;
		$user = get_userdata( $testuserid );
		$pwd_before = $user->user_pass;
		wp_update_user( $user );

		// Reload the data
		$pwd_after = get_userdata( $testuserid )->user_pass;
		$this->assertEquals( $pwd_before, $pwd_after );
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
			'user_login' => 'blackburn',
			'user_pass'  => 'password',
			'user_email' => 'blackburn@battlefield4.com',
		) );
		$this->assertEquals( $id1, email_exists( 'blackburn@battlefield4.com' ) );

		$id2 = wp_insert_user( array(
			'user_login' => 'miller',
			'user_pass'  => 'password',
			'user_email' => 'miller@battlefield4.com',
		) );
		$this->assertEquals( $id2, email_exists( 'miller@battlefield4.com' ) );

		if ( ! is_wp_error( $id2 ) ){
			wp_update_user( array(
				'ID'         => $id2,
				'user_email' => 'david@battlefield4.com',
			) );
			$this->assertEquals( $id2, email_exists( 'david@battlefield4.com' ) );

			$return = wp_update_user( array(
				'ID'         => $id2,
				'user_email' => 'blackburn@battlefield4.com',
			) );

			if ( ! defined( 'WP_IMPORTING' ) ) {
				$this->assertWPError( $return );
			}
		}
	}

	/**
	 * @ticket 27317
	 * @dataProvider _illegal_user_logins_data
	 */
	function test_illegal_user_logins_single( $user_login ) {
		$user_data = array(
			'user_login' => $user_login,
			'user_email' => 'testuser@example.com',
			'user_pass'  => wp_generate_password(),
		);

		add_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$response = wp_insert_user( $user_data );
		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'invalid_username', $response->get_error_code() );

		remove_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$user_id = wp_insert_user( $user_data );
		$user = get_user_by( 'id', $user_id );
		$this->assertInstanceOf( 'WP_User', $user );
	}

	/**
	 * @ticket 27317
	 * @dataProvider _illegal_user_logins_data
	 */
	function test_illegal_user_logins_single_wp_create_user( $user_login ) {
		$user_email = 'testuser-' . $user_login . '@example.com';

		add_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$response = register_new_user( $user_login, $user_email );
		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'invalid_username', $response->get_error_code() );

		remove_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$response = register_new_user( $user_login, $user_email );
		$user = get_user_by( 'id', $response );
		$this->assertInstanceOf( 'WP_User', $user );
	}

	/**
	 * @ticket 27317
	 * @group ms-required
	 */
	function test_illegal_user_logins_multisite() {
		$user_data = array(
			'user_login' => 'testuser',
			'user_email' => 'testuser@example.com',
		);

		add_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$response = wpmu_validate_user_signup( $user_data['user_login'], $user_data['user_email'] );
		$this->assertInstanceOf( 'WP_Error', $response['errors'] );
		$this->assertEquals( 'user_name', $response['errors']->get_error_code() );

		remove_filter( 'illegal_user_logins', array( $this, '_illegal_user_logins' ) );

		$response = wpmu_validate_user_signup( $user_data['user_login'], $user_data['user_email'] );
		$this->assertInstanceOf( 'WP_Error', $response['errors'] );
		$this->assertEquals( 0, count( $response['errors']->get_error_codes() ) );
	}

	function _illegal_user_logins_data() {
		$data = array(
			array( 'testuser' )
		);

		// Multisite doesn't allow mixed case logins ever
		if ( ! is_multisite() ) {
			$data[] = array( 'TestUser' );
		}
		return $data;
	}

	function _illegal_user_logins() {
		return array( 'testuser' );
	}

	/**
	 * @ticket 24618
	 */
	public function test_validate_username_string() {
		$this->assertTrue( validate_username( 'johndoe' ) );
		$this->assertTrue( validate_username( 'test@test.com' ) );
	}

	/**
	 * @ticket 24618
	 */
	public function test_validate_username_contains_uppercase_letters() {
		if ( is_multisite() ) {
			$this->assertFalse( validate_username( 'JohnDoe' ) );
		} else {
			$this->assertTrue( validate_username( 'JohnDoe' ) );
		}
	}

	/**
	 * @ticket 24618
	 */
	public function test_validate_username_empty() {
		$this->assertFalse( validate_username( '' ) );
	}

	/**
	 * @ticket 24618
	 */
	public function test_validate_username_invalid() {
		$this->assertFalse( validate_username( '@#&99sd' ) );
	}

 	/**
	 * @ticket 29880
	 */
	public function test_wp_insert_user_should_not_wipe_existing_password() {
		$user_details = array(
			'user_login' => rand_str(),
			'user_pass' => 'password',
			'user_email' => rand_str() . '@example.com',
		);

		$user_id = wp_insert_user( $user_details );
		$this->assertEquals( $user_id, email_exists( $user_details['user_email'] ) );

		// Check that providing an empty password doesn't remove a user's password.
		$user_details['ID'] = $user_id;
		$user_details['user_pass'] = '';

		$user_id = wp_insert_user( $user_details );
		$user = WP_User::get_data_by( 'id', $user_id );
		$this->assertNotEmpty( $user->user_pass );
	}

	/**
	 * @ticket 29696
	 */
	public function test_wp_insert_user_should_sanitize_user_nicename_parameter() {
		$user = $this->author;

		$userdata = $user->to_array();
		$userdata['user_nicename'] = str_replace( '-', '.', $user->user_nicename );
		wp_insert_user( $userdata );

		$updated_user = new WP_User( $user->ID );

		$this->assertSame( $user->user_nicename, $updated_user->user_nicename );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_accept_user_login_with_60_characters() {
		$user_login = str_repeat( 'a', 60 );
		$u = wp_insert_user( array(
			'user_login' => $user_login,
			'user_email' => $user_login . '@example.com',
			'user_pass' => 'password',
			'user_nicename' => 'something-short',
		) );

		$this->assertInternalType( 'int', $u );
		$this->assertGreaterThan( 0, $u );

		$user = new WP_User( $u );
		$this->assertSame( $user_login, $user->user_login );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_reject_user_login_over_60_characters() {
		$user_login = str_repeat( 'a', 61 );
		$u = wp_insert_user( array(
			'user_login' => $user_login,
			'user_email' => $user_login . '@example.com',
			'user_pass' => 'password',
			'user_nicename' => 'something-short',
		) );

		$this->assertWPError( $u );
		$this->assertSame( 'user_login_too_long', $u->get_error_code() );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_reject_user_nicename_over_50_characters() {
		$user_nicename = str_repeat( 'a', 51 );
		$u = wp_insert_user( array(
			'user_login' => 'mynicenamehas50chars',
			'user_email' => $user_nicename . '@example.com',
			'user_pass' => 'password',
			'user_nicename' => $user_nicename,
		) );

		$this->assertWPError( $u );
		$this->assertSame( 'user_nicename_too_long', $u->get_error_code() );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_not_generate_user_nicename_longer_than_50_chars() {
		$user_login = str_repeat( 'a', 55 );
		$u = wp_insert_user( array(
			'user_login' => $user_login,
			'user_email' => $user_login . '@example.com',
			'user_pass' => 'password',
		) );

		$this->assertNotEmpty( $u );
		$user = new WP_User( $u );
		$expected = str_repeat( 'a', 50 );
		$this->assertSame( $expected, $user->user_nicename );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_not_truncate_to_a_duplicate_user_nicename() {
		$u1 = self::factory()->user->create( array(
			'user_nicename' => str_repeat( 'a', 50 ),
		) );

		$user1 = new WP_User( $u1 );

		$expected = str_repeat( 'a', 50 );
		$this->assertSame( $expected, $user1->user_nicename );

		$user_login = str_repeat( 'a', 55 );
		$u = wp_insert_user( array(
			'user_login' => $user_login,
			'user_email' => $user_login . '@example.com',
			'user_pass' => 'password',
		) );

		$this->assertNotEmpty( $u );
		$user2 = new WP_User( $u );
		$expected = str_repeat( 'a', 48 ) . '-2';
		$this->assertSame( $expected, $user2->user_nicename );
	}

	/**
	 * @ticket 33793
	 */
	public function test_wp_insert_user_should_not_truncate_to_a_duplicate_user_nicename_when_suffix_has_more_than_one_character() {
		$user_ids = self::factory()->user->create_many( 4, array(
			'user_nicename' => str_repeat( 'a', 50 ),
		) );

		foreach ( $user_ids as $i => $user_id ) {
			$user = new WP_User( $user_id );
			if ( 0 === $i ) {
				$expected = str_repeat( 'a', 50 );
			} else {
				$expected = str_repeat( 'a', 48 ) . '-' . ( $i + 1 );
			}
			$this->assertSame( $expected, $user->user_nicename );
		}

		$user_login = str_repeat( 'a', 55 );
		$u = wp_insert_user( array(
			'user_login' => $user_login,
			'user_email' => $user_login . '@example.com',
			'user_pass' => 'password',
		) );

		$this->assertNotEmpty( $u );
		$user = new WP_User( $u );
		$expected = str_repeat( 'a', 48 ) . '-5';
		$this->assertSame( $expected, $user->user_nicename );
	}

	/**
	 * @ticket 28004
	 */
	public function test_wp_insert_user_with_invalid_user_id() {
		global $wpdb;
		$max_user = $wpdb->get_var( "SELECT MAX(ID) FROM $wpdb->users" );

		$u = wp_insert_user( array(
			'ID' => $max_user + 1,
			'user_login' => 'whatever',
			'user_email' => 'whatever@example.com',
			'user_pass' => 'password',
		) );

		$this->assertWPError( $u );
	}

	/**
	 * @ticket 35750
	 */
	public function test_wp_update_user_should_delete_userslugs_cache() {
		$u = self::factory()->user->create();
		$user = get_userdata( $u );

		wp_update_user( array(
			'ID' => $u,
			'user_nicename' => 'newusernicename',
		) );
		$updated_user = get_userdata( $u );

		$this->assertFalse( wp_cache_get( $user->user_nicename, 'userslugs' ) );
		$this->assertEquals( $u, wp_cache_get( $updated_user->user_nicename, 'userslugs' ) );
	}

	function test_changing_email_invalidates_password_reset_key() {
		global $wpdb;

		$user = $this->author;
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
		$users = get_users( array( 'search' => 'user1', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( self::$contrib_id, $users ) );
	}

	public function test_search_users_url() {
		$users = get_users( array( 'search' => '*tacos*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( self::$contrib_id, $users ) );
	}

	public function test_search_users_email() {
		$users = get_users( array( 'search' => '*battle*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( self::$contrib_id, $users ) );
	}

	public function test_search_users_nicename() {
		$users = get_users( array( 'search' => '*one*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( self::$contrib_id, $users ) );
	}

	public function test_search_users_display_name() {
		$users = get_users( array( 'search' => '*Doe*', 'fields' => 'ID' ) );

		$this->assertTrue( in_array( self::$contrib_id, $users ) );
	}

	/**
	 * @ticket 32158
	 */
	function test_email_case() {
		// Alter the case of the email address (which stays the same).
		$userdata = array(
			'ID' => self::$editor_id,
			'user_email' => 'test@TEST.com',
		);
		$update = wp_update_user( $userdata );

		$this->assertEquals( self::$editor_id, $update );
	}

	/**
	 * @ticket 32158
	 */
	function test_email_change() {
		// Change the email address.
		$userdata = array(
			'ID' => self::$editor_id,
			'user_email' => 'test2@test.com',
		);
		$update = wp_update_user( $userdata );

		// Was this successful?
		$this->assertEquals( self::$editor_id, $update );

		// Verify that the email address has been updated.
		$user = get_userdata( self::$editor_id );
		$this->assertEquals( $user->user_email, 'test2@test.com' );
	}

	/**
	 * Testing wp_new_user_notification email statuses.
	 *
	 * @dataProvider data_wp_new_user_notifications
	 * @ticket 33654
	 * @ticket 36009
	 */
	function test_wp_new_user_notification( $notify, $admin_email_sent_expected, $user_email_sent_expected ) {
		reset_phpmailer_instance();

		$was_admin_email_sent = false;
		$was_user_email_sent = false;

		wp_new_user_notification( self::$contrib_id, null, $notify );

		$mailer = tests_retrieve_phpmailer_instance();

		/*
		 * Check to see if a notification email was sent to the
		 * post author `blackburn@battlefield3.com` and and site admin `admin@example.org`.
		 */
		$first_recipient = $mailer->get_recipient( 'to' );
		if ( $first_recipient ) {
			$was_admin_email_sent = WP_TESTS_EMAIL === $first_recipient->address;
			$was_user_email_sent = 'blackburn@battlefield3.com' === $first_recipient->address;
		}

		$second_recipient = $mailer->get_recipient( 'to', 1 );
		if ( $second_recipient ) {
			$was_user_email_sent = 'blackburn@battlefield3.com' === $second_recipient->address;
		}


		$this->assertSame( $admin_email_sent_expected, $was_admin_email_sent, 'Admin email result was not as expected in test_wp_new_user_notification' );
		$this->assertSame( $user_email_sent_expected , $was_user_email_sent, 'User email result was not as expected in test_wp_new_user_notification' );
	}

	/**
	 * Data provider for test_wp_new_user_notification().
	 *
	 * Passes the three available options for the $notify parameter and the expected email
	 * emails sent status as a bool.
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $post_args               The arguments that will merged with the $_POST array.
	 *         @type bool $admin_email_sent_expected The expected result of whether an email was sent to the admin.
	 *         @type bool $user_email_sent_expected  The expected result of whether an email was sent to the user.
	 *     }
	 * }
	 */
	function data_wp_new_user_notifications() {
		return array(
			array(
				'',
				true,
				false,
			),
			array(
				'admin',
				true,
				false,
			),
			array(
				'user',
				false,
				true,
			),
			array(
				'both',
				true,
				true,
			),
		);
	}

	/**
	 * Set up a user and try sending a notification using the old, deprecated
	 * function signature `wp_new_user_notification( $user, 'plaintext_password' );`.
	 *
	 * @ticket 33654
	 * @expectedDeprecated wp_new_user_notification
	 */
	function test_wp_new_user_notification_old_signature_throws_deprecated_warning_but_sends() {
		reset_phpmailer_instance();

		$was_admin_email_sent = false;
		$was_user_email_sent = false;
		wp_new_user_notification( self::$contrib_id, 'this_is_a_test_password' );

		/*
		 * Check to see if a notification email was sent to the
		 * post author `blackburn@battlefield3.com` and and site admin `admin@example.org`.
		 */
		if ( ! empty( $GLOBALS['phpmailer']->mock_sent ) ) {
			$was_admin_email_sent = ( isset( $GLOBALS['phpmailer']->mock_sent[0] ) && WP_TESTS_EMAIL == $GLOBALS['phpmailer']->mock_sent[0]['to'][0][0] );
			$was_user_email_sent = ( isset( $GLOBALS['phpmailer']->mock_sent[1] ) && 'blackburn@battlefield3.com' == $GLOBALS['phpmailer']->mock_sent[1]['to'][0][0] );
		}

		$this->assertTrue( $was_admin_email_sent );
		$this->assertTrue( $was_user_email_sent );
	}

	/**
	 * Set up a user and try sending a notification using `wp_new_user_notification( $user );`.
	 *
	 * @ticket 34377
	 */
	function test_wp_new_user_notification_old_signature_no_password() {
		reset_phpmailer_instance();

		$was_admin_email_sent = false;
		$was_user_email_sent = false;
		wp_new_user_notification( self::$contrib_id );

		/*
		 * Check to see if a notification email was sent to the
		 * post author `blackburn@battlefield3.com` and and site admin `admin@example.org`.
		 */
		if ( ! empty( $GLOBALS['phpmailer']->mock_sent ) ) {
			$was_admin_email_sent = ( isset( $GLOBALS['phpmailer']->mock_sent[0] ) && WP_TESTS_EMAIL == $GLOBALS['phpmailer']->mock_sent[0]['to'][0][0] );
			$was_user_email_sent = ( isset( $GLOBALS['phpmailer']->mock_sent[1] ) && 'blackburn@battlefield3.com' == $GLOBALS['phpmailer']->mock_sent[1]['to'][0][0] );
		}

		$this->assertTrue( $was_admin_email_sent );
		$this->assertFalse( $was_user_email_sent );
	}

	/**
	 * Checks that calling edit_user() with no password returns an error when adding, and doesn't when updating.
	 *
	 * @ticket 35715
	 */
	function test_edit_user_blank_pw() {
		$_POST = $_GET = $_REQUEST = array();
		$_POST['role'] = 'subscriber';
		$_POST['email'] = 'user1@example.com';
		$_POST['user_login'] = 'user_login1';
		$_POST['first_name'] = 'first_name1';
		$_POST['last_name'] = 'last_name1';
		$_POST['nickname'] = 'nickname1';
		$_POST['display_name'] = 'display_name1';

		// Check new user with missing password.
		$response = edit_user();

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'pass', $response->get_error_code() );

		// Check new user with password set.
		$_POST['pass1'] = $_POST['pass2'] = 'password';

		$user_id = edit_user();
		$user = get_user_by( 'ID', $user_id );

		$this->assertInternalType( 'int', $user_id );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertEquals( 'nickname1', $user->nickname );

		// Check updating user with empty password.
		$_POST['nickname'] = 'nickname_updated';
		$_POST['pass1'] = $_POST['pass2'] = '';

		$user_id = edit_user( $user_id );

		$this->assertInternalType( 'int', $user_id );
		$this->assertEquals( 'nickname_updated', $user->nickname );

		// Check updating user with missing second password.
		$_POST['nickname'] = 'nickname_updated2';
		$_POST['pass1'] = 'blank_pass2';
		$_POST['pass2'] = '';

		$response = edit_user( $user_id );

		$this->assertInstanceOf( 'WP_Error', $response );
		$this->assertEquals( 'pass', $response->get_error_code() );
		$this->assertEquals( 'nickname_updated', $user->nickname );

		// Check updating user with empty password via `check_passwords` action.
		add_action( 'check_passwords', array( $this, 'action_check_passwords_blank_pw' ), 10, 2 );
		$user_id = edit_user( $user_id );
		remove_action( 'check_passwords', array( $this, 'action_check_passwords_blank_pw' ) );

		$this->assertInternalType( 'int', $user_id );
		$this->assertEquals( 'nickname_updated2', $user->nickname );
	}

	/**
	 * Check passwords action for test_edit_user_blank_pw().
	 */
	function action_check_passwords_blank_pw( $user_login, &$pass1 ) {
		$pass1 = '';
	}
}
