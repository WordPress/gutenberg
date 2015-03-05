<?php

if ( is_multisite() ) :

/**
 * Tests specific to network and site options in Multisite.
 *
 * @group option
 * @group ms-option
 * @group multisite
 */
class Tests_Multisite_Option extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER['REMOTE_ADDR'] = null;
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	function test_from_same_site() {
		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( 1, 'doesnotexist' ) );
		$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( 1, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( 1, $key ) );
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_blog_option( '1', $key ) );
		$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( 1, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( 1, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( 1, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( 1, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( 1, $key ) );
		$this->assertFalse( get_blog_option( 1, $key ) );
		$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( 1, $key ) );
		$this->assertTrue( update_blog_option( 1, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( 1, $key2 ) );
		$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( 1, $key2 ) );
		$this->assertFalse( get_blog_option( 1, $key2 ) );
		$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}

	function test_from_same_site_with_null_blog_id() {
		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( null, 'doesnotexist' ) );
		$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( null, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_blog_option( null, $key ) );
		$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( null, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( null, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( null, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( null, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( null, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( null, $key ) );
		$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( null, $key ) );
		$this->assertFalse( get_blog_option( null, $key ) );
		$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( null, $key ) );
		$this->assertTrue( update_blog_option( null, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( null, $key2 ) );
		$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( null, $key2 ) );
		$this->assertFalse( get_blog_option( null, $key2 ) );
		$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}

	function test_with_another_site() {
		global $current_site, $base;

		$title = 'Fooblog';
		$domain = 'blogoptiontest';

		if ( is_subdomain_install() ) {
			$newdomain = $domain . '.' . preg_replace( '|^www\.|', '', $current_site->domain );
			$path = $base;
		} else {
			$newdomain = $current_site->domain;
			$path = $base . $domain . '/';
		}

		$email = 'foo@foo.foo';
		$password = wp_generate_password( 12, false );
		$user_id = wpmu_create_user( $domain, $password, $email );
		$this->assertInternalType( 'integer', $user_id );

		$blog_id = wpmu_create_blog( $newdomain, $path, $title, $user_id , array( 'public' => 1 ), $current_site->id );
		$this->assertInternalType( 'integer', $blog_id );

		$key = rand_str();
		$key2 = rand_str();
		$value = rand_str();
		$value2 = rand_str();

		$this->assertFalse( get_blog_option( $blog_id, 'doesnotexist' ) );
		//$this->assertFalse( get_option( 'doesnotexist' ) ); // check get_option()

		$this->assertTrue( add_blog_option( $blog_id, $key, $value ) );
		// Assert all values of $blog_id that means the current or main blog (the same here).
		$this->assertEquals( $value, get_blog_option( $blog_id, $key ) );
		$this->assertEquals( $value, get_blog_option( "$blog_id", $key ) );
		//$this->assertEquals( $value, get_option( $key ) ); // check get_option()

		$this->assertFalse( add_blog_option( $blog_id, $key, $value ) );  // Already exists
		$this->assertFalse( update_blog_option( $blog_id, $key, $value ) );  // Value is the same
		$this->assertTrue( update_blog_option( $blog_id, $key, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key ) );
		//$this->assertEquals( $value2, get_option( $key ) ); // check get_option()
		$this->assertFalse( add_blog_option( $blog_id, $key, $value ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key ) );
		//$this->assertEquals( $value2, get_option( $key ) ); // check get_option()

		$this->assertTrue( delete_blog_option( $blog_id, $key ) );
		$this->assertFalse( get_blog_option( $blog_id, $key ) );
		//$this->assertFalse( get_option( $key ) ); // check get_option()
		$this->assertFalse( delete_blog_option( $blog_id, $key ) );
		$this->assertTrue( update_blog_option( $blog_id, $key2, $value2 ) );
		$this->assertEquals( $value2, get_blog_option( $blog_id, $key2 ) );
		//$this->assertEquals( $value2, get_option( $key2 ) ); // check get_option()
		$this->assertTrue( delete_blog_option( $blog_id, $key2 ) );
		$this->assertFalse( get_blog_option( $blog_id, $key2 ) );
		//$this->assertFalse( get_option( $key2 ) ); // check get_option()
	}

	/**
	 * @group multisite
	 */
	function test_site_notoptions() {
		global $wpdb;
		$notoptions_key = "{$wpdb->siteid}:notoptions";

		$_notoptions = wp_cache_get( 'notoptions', 'site-options' );
		$this->assertEmpty( $_notoptions );
		$_notoptions1 = wp_cache_get( $notoptions_key, 'site-options' );
		$this->assertEmpty( $_notoptions1 );

		get_site_option( 'burrito' );

		$notoptions = wp_cache_get( 'notoptions', 'site-options' );
		$this->assertEmpty( $notoptions );
		$notoptions1 = wp_cache_get( $notoptions_key, 'site-options' );
		$this->assertNotEmpty( $notoptions1 );
	}

	function test_users_can_register_signup_filter() {

		$registration = get_site_option('registration');
		$this->assertFalse( users_can_register_signup_filter() );

		update_site_option('registration', 'all');
		$this->assertTrue( users_can_register_signup_filter() );

		update_site_option('registration', 'user');
		$this->assertTrue( users_can_register_signup_filter() );

		update_site_option('registration', 'none');
		$this->assertFalse( users_can_register_signup_filter() );
	}

	/**
	 * @ticket 21552
	 * @ticket 23418
	 */
	function test_sanitize_ms_options() {
		update_site_option( 'illegal_names', array( '', 'Woo', '' ) );
		update_site_option( 'limited_email_domains', array(  'woo', '', 'boo.com', 'foo.net.biz..'  ) );
		update_site_option( 'banned_email_domains', array(  'woo', '', 'boo.com', 'foo.net.biz..'  ) );

		$this->assertEquals( array( 'Woo' ), get_site_option( 'illegal_names' ) );
		$this->assertEquals( array( 'woo', 'boo.com' ), get_site_option( 'limited_email_domains' ) );
		$this->assertEquals( array( 'woo', 'boo.com' ), get_site_option( 'banned_email_domains' ) );

		update_site_option( 'illegal_names', 'foo bar' );
		update_site_option( 'limited_email_domains', "foo\nbar" );
		update_site_option( 'banned_email_domains', "foo\nbar" );

		$this->assertEquals( array( 'foo', 'bar' ), get_site_option( 'illegal_names' ) );
		$this->assertEquals( array( 'foo', 'bar' ), get_site_option( 'limited_email_domains' ) );
		$this->assertEquals( array( 'foo', 'bar' ), get_site_option( 'banned_email_domains' ) );

		foreach ( array( 'illegal_names', 'limited_email_domains', 'banned_email_domains' ) as $option ) {
			update_site_option( $option, array() );
			$this->assertSame( '', get_site_option( $option ) );
		}
	}
}

endif;
