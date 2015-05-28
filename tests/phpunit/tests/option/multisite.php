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
		$user_id = $this->factory->user->create();
		$this->assertInternalType( 'integer', $user_id );

		$blog_id = $this->factory->blog->create( array(
			'user_id' => $user_id,
			'meta'    => array(
				'public' => 1,
			),
		) );
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
	 * @dataProvider data_illegal_names
	 */
	function test_sanitize_network_option_illegal_names( $option_value, $sanitized_option_value ) {
		update_site_option( 'illegal_names', $option_value );
		$this->assertEquals( $sanitized_option_value, get_site_option( 'illegal_names' ) );
	}

	function data_illegal_names() {
		return array(
			array( array( '', 'Woo', '' ), array( 'Woo' ) ),
			array( 'foo bar', array( 'foo', 'bar' ) ),
			array( array(), '' ),
		);
	}

	/**
	 * @dataProvider data_email_domains
	 *
	 * @param $option_value
	 * @param $sanitized_option_value
	 */
	function test_sanitize_network_option_limited_email_domains( $option_value, $sanitized_option_value ) {
		update_site_option( 'limited_email_domains', $option_value );
		$this->assertEquals( $sanitized_option_value, get_site_option( 'limited_email_domains' ) );
	}

	/**
	 * @dataProvider data_email_domains
	 *
	 * @param $option_value
	 * @param $sanitized_option_value
	 */
	function test_sanitize_network_option_banned_email_domains( $option_value, $sanitized_option_value ) {
		update_site_option( 'banned_email_domains', $option_value );
		$this->assertEquals( $sanitized_option_value, get_site_option( 'banned_email_domains' ) );
	}

	function data_email_domains() {
		return array(
			array( array( 'woo', '', 'boo.com', 'foo.net.biz..' ), array( 'woo', 'boo.com' ) ),
			array( "foo\nbar", array( 'foo', 'bar' ) ),
			array( "foo\n\nbar", array( 'foo', 'bar' ) ),
			array( "\nfoo\nbar\n", array( 'foo', 'bar' ) ),
			array( "foo\nfoo.net.biz..", array( 'foo' ) ),
			array( "foo\nfoo.net.biz..\nbar.com", array( 'foo', 'bar.com' ) ),
			array( 'foo.', array( 'foo.' ) ),
			array( '.foo', array( '.foo' ) ),
			array( 'foo^net', '' ),
			array( array(), '' ),
		);
	}
}

endif;
