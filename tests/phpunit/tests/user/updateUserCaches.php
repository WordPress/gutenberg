<?php

/**
 * @group user
 */
class Tests_User_UpdateUserCaches extends WP_UnitTestCase {
	public function test_should_store_entire_database_row_in_users_bucket() {
		global $wpdb;

		$u = self::factory()->user->create();
		$raw_userdata = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->users WHERE ID = %d", $u ) );

		update_user_caches( $raw_userdata );

		$this->assertEquals( $raw_userdata, wp_cache_get( $u, 'users' ) );
	}

	public function test_should_store_user_id_in_userlogins_bucket() {
		$data = new stdClass();
		$data->ID = 12345;
		$data->user_login = 'foo';
		$data->user_email = 'foo@example.com';
		$data->user_nicename = 'bar';

		update_user_caches( $data );

		$this->assertEquals( 12345, wp_cache_get( 'foo', 'userlogins' ) );
	}

	public function test_should_store_user_id_in_useremail_bucket() {
		$data = new stdClass();
		$data->ID = 12345;
		$data->user_login = 'foo';
		$data->user_email = 'foo@example.com';
		$data->user_nicename = 'bar';

		update_user_caches( $data );

		$this->assertEquals( 12345, wp_cache_get( 'foo@example.com', 'useremail' ) );
	}

	public function test_should_store_user_id_in_userslugs_bucket() {
		$data = new stdClass();
		$data->ID = 12345;
		$data->user_login = 'foo';
		$data->user_email = 'foo@example.com';
		$data->user_nicename = 'bar';

		update_user_caches( $data );

		$this->assertEquals( 12345, wp_cache_get( 'bar', 'userslugs' ) );
	}

	/**
	 * @ticket 24635
	 */
	public function test_should_store_raw_data_in_users_bucket_when_passed_a_wp_user_object() {
		global $wpdb;

		$u = self::factory()->user->create();
		$raw_userdata = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->users WHERE ID = %d", $u ) );
		$user_object = new WP_User( $u );

		update_user_caches( $user_object );

		$cached = wp_cache_get( $u, 'users' );
		$this->assertFalse( $cached instanceof WP_User );
		$this->assertEquals( $raw_userdata, $cached );
	}
}
