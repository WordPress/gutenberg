<?php

/**
 * @group pluggable
 * @group auth
 */
class Tests_Auth extends WP_UnitTestCase {
	protected $user;
	protected static $_user;
	protected static $user_id;
	protected static $wp_hasher;

	/**
	 * action hook
	 */
	protected $nonce_failure_hook = 'wp_verify_nonce_failed';

	public static function wpSetUpBeforeClass( $factory ) {
		self::$_user = $factory->user->create_and_get( array(
			'user_login' => 'password-tests'
		) );

		self::$user_id = self::$_user->ID;

		require_once( ABSPATH . WPINC . '/class-phpass.php' );
		self::$wp_hasher = new PasswordHash( 8, true );
	}

	function setUp() {
		parent::setUp();

		$this->user = clone self::$_user;
		wp_set_current_user( self::$user_id );
	}

	function test_auth_cookie_valid() {
		$cookie = wp_generate_auth_cookie( self::$user_id, time() + 3600, 'auth' );
		$this->assertEquals( self::$user_id, wp_validate_auth_cookie( $cookie, 'auth' ) );
	}

	function test_auth_cookie_invalid() {
		// 3600 or less and +3600 may occur in wp_validate_auth_cookie(),
		// as an ajax test may have defined DOING_AJAX, failing the test.

		$cookie = wp_generate_auth_cookie( self::$user_id, time() - 7200, 'auth' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'auth' ), 'expired cookie' );

		$cookie = wp_generate_auth_cookie( self::$user_id, time() + 3600, 'auth' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'logged_in' ), 'wrong auth scheme' );

		$cookie = wp_generate_auth_cookie( self::$user_id, time() + 3600, 'auth' );
		list($a, $b, $c) = explode('|', $cookie);
		$cookie = $a . '|' . ($b + 1) . '|' . $c;
		$this->assertEquals( false, wp_validate_auth_cookie( self::$user_id, 'auth' ), 'altered cookie' );
	}

	function test_auth_cookie_scheme() {
		// arbitrary scheme name
		$cookie = wp_generate_auth_cookie( self::$user_id, time() + 3600, 'foo' );
		$this->assertEquals( self::$user_id, wp_validate_auth_cookie( $cookie, 'foo' ) );

		// wrong scheme name - should fail
		$cookie = wp_generate_auth_cookie( self::$user_id, time() + 3600, 'foo' );
		$this->assertEquals( false, wp_validate_auth_cookie( $cookie, 'bar' ) );
	}

	/**
	 * @ticket 23494
	 */
	function test_password_trimming() {
		$passwords_to_test = array(
			'a password with no trailing or leading spaces',
			'a password with trailing spaces ',
			' a password with leading spaces',
			' a password with trailing and leading spaces ',
		);

		foreach( $passwords_to_test as $password_to_test ) {
			wp_set_password( $password_to_test, $this->user->ID );
			$authed_user = wp_authenticate( $this->user->user_login, $password_to_test );

			$this->assertInstanceOf( 'WP_User', $authed_user );
			$this->assertEquals( $this->user->ID, $authed_user->ID );
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

	/**
	 * @ticket 24030
	 */
	function test_wp_nonce_verify_failed() {
		$nonce = substr( md5( uniqid() ), 0, 10 );
		$count = did_action( $this->nonce_failure_hook );

		wp_verify_nonce( $nonce, 'nonce_test_action' );

		$this->assertEquals( ( $count + 1 ), did_action( $this->nonce_failure_hook ) );
	}

	/**
	 * @ticket 24030
	 */
	function test_wp_nonce_verify_success() {
		$nonce = wp_create_nonce( 'nonce_test_action' );
		$count = did_action( $this->nonce_failure_hook );

		wp_verify_nonce( $nonce, 'nonce_test_action' );

		$this->assertEquals( $count, did_action( $this->nonce_failure_hook ) );
	}

	function test_password_length_limit() {
		$limit = str_repeat( 'a', 4096 );

		wp_set_password( $limit, self::$user_id );
		// phpass hashed password
		$this->assertStringStartsWith( '$P$', $this->user->data->user_pass );

		$user = wp_authenticate( $this->user->user_login, 'aaaaaaaa' );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, $limit );
		$this->assertInstanceOf( 'WP_User', $user );
		$this->assertEquals( self::$user_id, $user->ID );

		// one char too many
		$user = wp_authenticate( $this->user->user_login, $limit . 'a' );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		wp_set_password( $limit . 'a', self::$user_id );
		$user = get_user_by( 'id', self::$user_id );
		// Password broken by setting it to be too long.
		$this->assertEquals( '*', $user->data->user_pass );

		$user = wp_authenticate( $this->user->user_login, '*' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, '*0' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, '*1' );
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, 'aaaaaaaa' );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, $limit );
		// Wrong Password
		$this->assertInstanceOf( 'WP_Error', $user );

		$user = wp_authenticate( $this->user->user_login, $limit . 'a' );
		// Password broken by setting it to be too long.
		$this->assertInstanceOf( 'WP_Error', $user );
	}

	/**
	 * @ticket 32429
	 */
	function test_user_activation_key_is_checked() {
		global $wpdb;

		$key  = wp_generate_password( 20, false );
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => strtotime( '-1 hour' ) . ':' . self::$wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $this->user->ID,
		) );

		// A valid key should be accepted
		$check = check_password_reset_key( $key, $this->user->user_login );
		$this->assertInstanceOf( 'WP_User', $check );
		$this->assertSame( $this->user->ID, $check->ID );

		// An invalid key should be rejected
		$check = check_password_reset_key( 'key', $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty key should be rejected
		$check = check_password_reset_key( '', $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// A truncated key should be rejected
		$partial = substr( $key, 0, 10 );
		$check = check_password_reset_key( $partial, $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_expired_user_activation_key_is_rejected() {
		global $wpdb;

		$key  = wp_generate_password( 20, false );
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => strtotime( '-48 hours' ) . ':' . self::$wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $this->user->ID,
		) );

		// An expired but otherwise valid key should be rejected
		$check = check_password_reset_key( $key, $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_empty_user_activation_key_fails_key_check() {
		// An empty user_activation_key should not allow any key to be accepted
		$check = check_password_reset_key( 'key', $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty user_activation_key should not allow an empty key to be accepted
		$check = check_password_reset_key( '', $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * @ticket 32429
	 */
	function test_legacy_user_activation_key_is_rejected() {
		global $wpdb;

		// A legacy user_activation_key is one without the `time()` prefix introduced in WordPress 4.3.

		$key  = wp_generate_password( 20, false );
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => self::$wp_hasher->HashPassword( $key ),
		), array(
			'ID' => $this->user->ID,
		) );

		// A legacy user_activation_key should not be accepted
		$check = check_password_reset_key( $key, $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// An empty key with a legacy user_activation_key should be rejected
		$check = check_password_reset_key( '', $this->user->user_login );
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
		$wpdb->update( $wpdb->users, array(
			'user_activation_key' => $key,
		), array(
			'ID' => $this->user->ID,
		) );

		// A plaintext user_activation_key should not allow an otherwise valid key to be accepted
		$check = check_password_reset_key( $key, $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );

		// A plaintext user_activation_key should not allow an empty key to be accepted
		$check = check_password_reset_key( '', $this->user->user_login );
		$this->assertInstanceOf( 'WP_Error', $check );
	}

	/**
	 * Ensure users can log in using both their username and their email address.
	 *
	 * @ticket 9568
	 */
	function test_log_in_using_email() {
		$user_args = array(
			'user_login' => 'johndoe',
			'user_email' => 'mail@example.com',
			'user_pass'  => 'password',
		);
		$this->factory->user->create( $user_args );

		$this->assertInstanceOf( 'WP_User', wp_authenticate( $user_args['user_email'], $user_args['user_pass'] ) );
		$this->assertInstanceOf( 'WP_User', wp_authenticate( $user_args['user_login'], $user_args['user_pass'] ) );
	}
}
