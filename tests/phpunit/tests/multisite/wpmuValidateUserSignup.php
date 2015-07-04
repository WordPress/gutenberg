<?php

if ( is_multisite() ) :

/**
 * @group multisite
 */
class Tests_Multisite_WpmuValidateUserSignup extends WP_UnitTestCase {
	/**
	 * @dataProvider data_user_name
	 */
	public function test_user_name( $user_name, $error_message ) {
		$v = wpmu_validate_user_signup( $user_name, 'foo@example.com' );
		$this->assertContains( 'user_name', $v['errors']->get_error_codes(), $error_message );
	}

	public function data_user_name() {
		return array(
			array( 'contains spaces', 'User names with spaces are not allowed.' ),
			array( 'ContainsCaps', 'User names with capital letters are not allowed.'  ),
			array( 'contains_underscores', 'User names with underscores are not allowed.'  ),
			array( 'contains%^*()junk', 'User names with non-alphanumeric characters are not allowed.'  ),
			array( '', 'Empty user names are not allowed.'  ),
			array( 'foo', 'User names of 3 characters are not allowed.'  ),
			array( 'fo', 'User names of 2 characters are not allowed.'  ),
			array( 'f', 'User names of 1 characters are not allowed.'  ),
			array( 'f', 'User names of 1 characters are not allowed.'  ),
			array( '12345', 'User names consisting only of numbers are not allowed.'  ),
			array( 'thisusernamecontainsenoughcharacterstobelongerthan60characters', 'User names longer than 60 characters are not allowed.' ),
		);
	}

	public function test_should_fail_for_illegal_names() {
		$illegal = array( 'foo123', 'bar123' );
		update_site_option( 'illegal_names', $illegal );

		foreach ( $illegal as $i ) {
			$v = wpmu_validate_user_signup( $i, 'foo@example.com' );
			$this->assertContains( 'user_name', $v['errors']->get_error_codes() );
		}
	}

	public function test_should_fail_for_unsafe_email_address() {
		add_filter( 'is_email_address_unsafe', '__return_true' );
		$v = wpmu_validate_user_signup( 'foo123', 'foo@example.com' );
		$this->assertContains( 'user_email', $v['errors']->get_error_codes() );
		remove_filter( 'is_email_address_unsafe', '__return_true' );
	}

	public function test_should_fail_for_invalid_email_address() {
		add_filter( 'is_email', '__return_false' );
		$v = wpmu_validate_user_signup( 'foo123', 'foo@example.com' );
		$this->assertContains( 'user_email', $v['errors']->get_error_codes() );
		remove_filter( 'is_email', '__return_false' );
	}

	public function test_should_fail_for_emails_from_non_whitelisted_domains() {
		$domains = array( 'foo.com', 'bar.org' );
		update_site_option( 'limited_email_domains', $domains );

		$v = wpmu_validate_user_signup( 'foo123', 'foo@example.com' );
		$this->assertContains( 'user_email', $v['errors']->get_error_codes() );
	}

	public function test_should_fail_for_existing_user_name() {
		$u = $this->factory->user->create( array( 'user_login' => 'foo123' ) );
		$v = wpmu_validate_user_signup( 'foo123', 'foo@example.com' );
		$this->assertContains( 'user_name', $v['errors']->get_error_codes() );
	}

	public function test_should_fail_for_existing_user_email() {
		$u = $this->factory->user->create( array( 'user_email' => 'foo@example.com' ) );
		$v = wpmu_validate_user_signup( 'foo123', 'foo@example.com' );
		$this->assertContains( 'user_email', $v['errors']->get_error_codes() );
	}

	public function test_should_fail_for_existing_signup_with_same_username() {
		// Don't send notifications.
		add_filter( 'wpmu_signup_user_notification', '__return_true' );
		wpmu_signup_user( 'foo123', 'foo@example.com' );
		remove_filter( 'wpmu_signup_user_notification', '__return_true' );

		$v = wpmu_validate_user_signup( 'foo123', 'foo2@example.com' );
		$this->assertContains( 'user_name', $v['errors']->get_error_codes() );
	}

	public function test_should_not_fail_for_existing_signup_with_same_username_if_signup_is_old() {
		// Don't send notifications.
		add_filter( 'wpmu_signup_user_notification', '__return_true' );
		wpmu_signup_user( 'foo123', 'foo@example.com' );
		remove_filter( 'wpmu_signup_user_notification', '__return_true' );

		global $wpdb;
		$date = date( 'Y-m-d H:i:s', time() - ( 2 * DAY_IN_SECONDS ) - 60 );
		$wpdb->update( $wpdb->signups, array( 'registered' => $date ), array( 'user_login' => 'foo123' ) );

		$v = wpmu_validate_user_signup( 'foo123', 'foo2@example.com' );
		$this->assertNotContains( 'user_name', $v['errors']->get_error_codes() );
	}

	public function test_should_fail_for_existing_signup_with_same_email() {
		// Don't send notifications.
		add_filter( 'wpmu_signup_user_notification', '__return_true' );
		wpmu_signup_user( 'foo123', 'foo@example.com' );
		remove_filter( 'wpmu_signup_user_notification', '__return_true' );

		$v = wpmu_validate_user_signup( 'foo2', 'foo@example.com' );
		$this->assertContains( 'user_email', $v['errors']->get_error_codes() );
	}

	public function test_should_not_fail_for_existing_signup_with_same_email_if_signup_is_old() {
		// Don't send notifications.
		add_filter( 'wpmu_signup_user_notification', '__return_true' );
		wpmu_signup_user( 'foo123', 'foo@example.com' );
		remove_filter( 'wpmu_signup_user_notification', '__return_true' );

		global $wpdb;
		$date = date( 'Y-m-d H:i:s', time() - ( 2 * DAY_IN_SECONDS ) - 60 );
		$wpdb->update( $wpdb->signups, array( 'registered' => $date ), array( 'user_login' => 'foo123' ) );

		$v = wpmu_validate_user_signup( 'foo2', 'foo2@example.com' );
		$this->assertNotContains( 'user_email', $v['errors']->get_error_codes() );
	}

}

endif;
