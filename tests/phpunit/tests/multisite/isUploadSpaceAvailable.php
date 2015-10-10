<?php

if ( is_multisite() ) :

/**
 * Tests specific to `is_upload_space_available()` in multisite.
 *
 * These tests filter `pre_get_space_used` so that we can ignore the local
 * environment. Tests for `get_space_used()` are handled elsewhere.
 *
 * @group multisite
 */
class Tests_Multisite_Is_Upload_Space_Available extends WP_UnitTestCase {
	protected $suppress = false;

	protected static $original_site_blog_upload_space;
	protected static $original_blog_upload_space;

	public static function setUpBeforeClass() {
		parent::setUpBeforeClass();

		self::$original_site_blog_upload_space = get_site_option( 'blog_upload_space' );
		self::$original_blog_upload_space = get_option( 'blog_upload_space' );
	}

	public function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		update_site_option( 'upload_space_check_disabled', false );
	}

	public function tearDown() {
		global $wpdb;

		/**
		 * Reset the two `blog_upload_space` options to their original values so
		 * they can be relied on in other test classes.
		 */
		update_site_option( 'blog_upload_space', self::$original_site_blog_upload_space );
		update_option( 'blog_upload_space', self::$original_blog_upload_space );

		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	/**
	 * A default of 100MB is used when no `blog_upload_space` option
	 * exists at the site or network level.
	 */
	public function test_is_upload_space_available_default() {
		delete_option( 'blog_upload_space' );
		delete_site_option( 'blog_upload_space' );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );

		$this->assertTrue( $available );
	}

	public function test_is_upload_space_available_check_disabled() {
		update_site_option( 'blog_upload_space', 10 );
		update_site_option( 'upload_space_check_disabled', true );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_large' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_large' ) );

		$this->assertTrue( $available );
	}

	public function test_is_upload_space_available_space_used_is_less_then_allowed() {
		update_option( 'blog_upload_space', 350 );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );

		$this->assertTrue( $available );
	}

	function test_is_upload_space_available_space_used_is_more_than_allowed() {
		update_option( 'blog_upload_space', 350 );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_large' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_large' ) );

		$this->assertFalse( $available );
	}

	/**
	 * More comprehensive testing a 0 condition is handled in the tests
	 * for `get_space_allowed()`. We cover one scenario here.
	 */
	function test_is_upload_space_available_upload_space_0_defaults_to_100() {
		update_option( 'blog_upload_space', 0 );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );

		$this->assertFalse( $available );
	}

	function test_is_upload_space_available_upload_space_negative() {
		update_site_option( 'blog_upload_space', -1 );

		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );
		$available = is_upload_space_available();
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used_small' ) );

		$this->assertFalse( $available );
	}

	function _filter_space_used_large() {
		return 10000000;
	}

	function _filter_space_used_small() {
		return 10;
	}
}

endif;