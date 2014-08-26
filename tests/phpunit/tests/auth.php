<?php

/**
 * @group pluggable
 */
class Tests_Auth extends WP_UnitTestCase {
	var $user_id;

	function setUp() {
		parent::setUp();
		$this->user_id = $this->factory->user->create();

		$_SERVER['REQUEST_METHOD'] = null;
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
}
