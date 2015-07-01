<?php

/**
 * @group pluggable
 * @group auth
 */
class Tests_Auth extends WP_UnitTestCase {
	var $user_id;
	var $wp_hasher;

	function setUp() {
		parent::setUp();
		$this->user_id = $this->factory->user->create();

		require_once ABSPATH . WPINC . '/class-phpass.php';
		$this->wp_hasher = new PasswordHash( 8, true );
	}

	function test_auth_cookie_valid() {
		$cookie = wp_generate_auth_cookie( $this->user_id, time() + 3600, 'auth' );
		$this->assertEquals( $this->user_id, wp_validate_auth_cookie( $cookie, 'auth' ) );
	}

	function test_auth_cookie_invalid() {
		// 3600 or less and +3600 may occur in wp_validate_auth_cookie(),
		// as an ajax test may have defined DOING_AJAX, failing the test.

		$cookie = wp_generate_auth_cookie( $this->user_id, time() - 7200, 'auth' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'auth' ), 'expired cookie' );

		$cookie = wp_generate_auth_cookie( $this->user_id, time() + 3600, 'auth' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'logged_in' ), 'wrong auth scheme' );

		$cookie = wp_generate_auth_cookie( $this->user_id, time() + 3600, 'auth' );
		list($a, $b, $c) = explode('|', $cookie);
		$cookie = $a . '|' . ($b + 1) . '|' . $c;
		$this->assertEquals( false, wp_validate_auth_cookie( $this->user_id, 'auth' ), 'altered cookie' );
	}

	function test_auth_cookie_scheme() {
		// arbitrary scheme name
		$cookie = wp_generate_auth_cookie( $this->user_id, time() + 3600, 'foo' );
		$this->assertEquals( $this->user_id, wp_validate_auth_cookie( $cookie, 'foo' ) );

		// wrong scheme name - should fail
		$cookie = wp_generate_auth_cookie( $this->user_id, time() + 3600, 'foo' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'bar' ) );
	}

	/**
	 * @ticket 23494
	 */
	function test_password_trimming() {
		$another_user = $this->factory->user->create( array( 'user_login' => 'password-triming-tests' ) );

		$passwords_to_test = array(
			'a password with no trailing or leading spaces',
			'a password with trailing spaces ',
			' a password with leading spaces',
			' a password with trailing and leading spaces ',
		);

		foreach( $passwords_to_test as $password_to_test ) {
			wp_set_password( $password_to_test, $another_user );
			$authed_user = wp_authenticate( 'password-triming-tests', $password_to_test );

			$this->assertInstanceOf( 'WP_User', $authed_user );
			$this->assertEquals( $another_user, $authed_user->ID );
		}
	}

	/**
	 * Test wp_hash_password trims whitespace
	 *
	 * This is similar to test_password_trimming but tests the "lower level"
	 * wp_hash_password function
	 *
	 * @ticket 24973
	 */
	function test_wp_hash_password_trimming() {

		$password = ' pass with leading whitespace';
		$this->assertTrue( wp_check_password( 'pass with leading whitespace', wp_hash_password( $password ) ) );

		$password = 'pass with trailing whitespace ';
		$this->assertTrue( wp_check_password( 'pass with trailing whitespace', wp_hash_password( $password ) ) );

		$password = ' pass with whitespace ';
		$this->assertTrue( wp_check_password( 'pass with whitespace', wp_hash_password( $password ) ) );

		$password = "pass with new line \n";
		$this->assertTrue( wp_check_password( 'pass with new line', wp_hash_password( $password ) ) );

		$password = "pass with vertial tab o_O\x0B";
		$this->assertTrue( wp_check_password( 'pass with vertial tab o_O', wp_hash_password( $password ) ) );
	}

	/**
	 * @ticket 29217
	 */
	function test_wp_verify_nonce_with_empty_arg() {
		$this->assertFalse( wp_verify_nonce( '' ) );
		$this->assertFalse( wp_verify_nonce( null ) );
	}

	/**
	 * @ticket 29542
	 */
	function test_wp_verify_nonce_with_integer_arg() {
		$this->assertFalse( wp_verify_nonce( 1 ) );
	}

	function test_password_length_limit() {
		$passwords = array(
			str_repeat( 'a', 4095 ), // short
			str_repeat( 'a', 4096 ), // limit
			str_repeat( 'a', 4097 ), // long
		);

		$user_id = $this->factory->user->create( array( 'user_login' => 'password-length-test' ) );

		wp_set_password( $passwords[1], $user_id );
		$user = get_user_by( 'id', $user_id );
		// phpass hashed password
		$this->assertStringStartsWith( '$P$', $user->data->user_pass );

		$user = wp_authenticate( 'password-length-test', $passwords[0] );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', $passwords[1] );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertEquals( $user_id, $user->ID );

		$user = wp_authenticate( 'password-length-test', $passwords[2] );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );


		wp_set_password( $passwords[2], $user_id );
		$user = get_user_by( 'id', $user_id );
		// Password broken by setting it to be too long.
		$this->assertEquals( '*', $user->data->user_pass );

		$user = wp_authenticate( 'password-length-test', '*' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', '*0' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', '*1' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', $passwords[0] );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', $passwords[1] );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( 'password-length-test', $passwords[2] );
		// Password broken by setting it to be too long.
		$this->assertInstanceOf( 'WP_Error', $user );
	}

	/**
	 * @ticket 32429
	 */
	function test_user_activation_key_is_checked() {
		global $wpdb;

		$key  = wp_generate_password( 20, false );
		$user = $this->factory->user->create_and_get();
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => strtotime( '-1 hour' ) . ':' . $this->wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $user->ID,
		) );

		// A valid key should be accepted
		$check = check_password_reset_key( $key, $user->user_login );
		$this->assertInstanceOf( 'WP_User', $check );
		$this->assertSame( $user->ID, $check->ID );

		// An invalid key should be rejected
		$check = check_password_reset_key( 'key', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty key should be rejected
		$check = check_password_reset_key( '', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// A truncated key should be rejected
		$partial = substr( $key, 0, 10 );
		$check = check_password_reset_key( $partial, $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_expired_user_activation_key_is_rejected() {
		global $wpdb;

		$key  = wp_generate_password( 20, false );
		$user = $this->factory->user->create_and_get();
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => strtotime( '-48 hours' ) . ':' . $this->wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $user->ID,
		) );

		// An expired but otherwise valid key should be rejected
		$check = check_password_reset_key( $key, $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_empty_user_activation_key_fails_key_check() {
		global $wpdb;

		$user = $this->factory->user->create_and_get();

		// An empty user_activation_key should not allow any key to be accepted
		$check = check_password_reset_key( 'key', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty user_activation_key should not allow an empty key to be accepted
		$check = check_password_reset_key( '', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_legacy_user_activation_key_is_rejected() {
		global $wpdb;

		// A legacy user_activation_key is one without the `time()` prefix introduced in WordPress 4.3.

		$key  = wp_generate_password( 20, false );
		$user = $this->factory->user->create_and_get();
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => $this->wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $user->ID,
		) );

		// A legacy user_activation_key should not be accepted
		$check = check_password_reset_key( $key, $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty key with a legacy user_activation_key should be rejected
		$check = check_password_reset_key( '', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 * @ticket 24783
	 */
	function test_plaintext_user_activation_key_is_rejected() {
		global $wpdb;

		// A plaintext user_activation_key is one stored before hashing was introduced in WordPress 3.7.

		$key  = wp_generate_password( 20, false );
		$user = $this->factory->user->create_and_get();
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => $key,
		), array(
			'ID' => $user->ID,
		) );

		// A plaintext user_activation_key should not allow an otherwise valid key to be accepted
		$check = check_password_reset_key( $key, $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// A plaintext user_activation_key should not allow an empty key to be accepted
		$check = check_password_reset_key( '', $user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}
}
