<?php

if ( is_multisite() ) :

/**
 * A set of unit tests for WordPress Multisite
 *
 * @group multisite
 */
class Tests_Multisite extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER['REMOTE_ADDR'] = '';
	}

	function tearDown() {
		global $wpdb;
		parent::tearDown();
		$wpdb->suppress_errors( $this->suppress );
	}

	function test_wpmu_log_new_registrations() {
		global $wpdb;

		$user = new WP_User( 1 );
		$ip = preg_replace( '/[^0-9., ]/', '',$_SERVER['REMOTE_ADDR'] );

		wpmu_log_new_registrations(1,1);

		// currently there is no wrapper function for the registration_log
		$reg_blog = $wpdb->get_col( "SELECT email FROM {$wpdb->registration_log} WHERE {$wpdb->registration_log}.blog_id = 1 AND IP LIKE '" . $ip . "'" );
		$this->assertEquals( $user->user_email, $reg_blog[ count( $reg_blog )-1 ] );
	}

	/**
	 * @ticket 21570
	 */
	function test_aggressiveness_of_is_email_address_unsafe() {
		update_site_option( 'banned_email_domains', array( 'bar.com', 'foo.co' ) );

		foreach ( array( 'test@bar.com', 'test@foo.bar.com', 'test@foo.co', 'test@subdomain.foo.co' ) as $email_address ) {
			$this->assertTrue( is_email_address_unsafe( $email_address ), "$email_address should be UNSAFE" );
		}

		foreach ( array( 'test@foobar.com', 'test@foo-bar.com', 'test@foo.com', 'test@subdomain.foo.com' ) as $email_address ) {
			$this->assertFalse( is_email_address_unsafe( $email_address ), "$email_address should be SAFE" );
		}
	}

	/**
	 * @ticket 25046
	 */
	function test_case_sensitivity_of_is_email_address_unsafe() {
		update_site_option( 'banned_email_domains', array( 'baR.com', 'Foo.co', 'barfoo.COM', 'BAZ.com' ) );

		foreach ( array( 'test@Bar.com', 'tEst@bar.com', 'test@barFoo.com', 'tEst@foo.bar.com', 'test@baz.Com' ) as $email_address ) {
			$this->assertTrue( is_email_address_unsafe( $email_address ), "$email_address should be UNSAFE" );
		}

		foreach ( array( 'test@Foobar.com', 'test@Foo-bar.com', 'tEst@foobar.com', 'test@Subdomain.Foo.com', 'test@fooBAz.com' ) as $email_address ) {
			$this->assertFalse( is_email_address_unsafe( $email_address ), "$email_address should be SAFE" );
		}

	}
}

endif;
