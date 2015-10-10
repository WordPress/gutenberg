<?php

if ( is_multisite() ) :

/**
 * Tests specific to `upload_is_user_over_quota()` in multisite.
 *
 * These tests filter `get_space_allowed` and `pre_get_space_used` in
 * most cases as those are tested elsewhere.
 *
 * @group multisite
 */
class Tests_Multisite_Upload_Is_User_Over_Quota extends WP_UnitTestCase {
	protected $suppress = false;

	public function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		update_site_option( 'upload_space_check_disabled', false );
	}

	public function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	public function test_upload_is_user_over_quota_allowed_0_used_5() {
		add_filter( 'get_space_allowed', '__return_zero' );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_5' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', '__return_zero' );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_5' ) );

		$this->assertTrue( $result );
	}

	public function test_upload_is_user_over_quota_allowed_0_used_0() {
		add_filter( 'get_space_allowed', '__return_zero' );
		add_filter( 'pre_get_space_used', '__return_zero' );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', '__return_zero' );
		remove_filter( 'pre_get_space_used', '__return_zero' );

		$this->assertFalse( $result );
	}

	public function test_upload_is_user_over_quota_allowed_0_used_100() {
		add_filter( 'get_space_allowed', '__return_zero' );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', '__return_zero' );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );

		$this->assertTrue( $result );
	}

	public function test_upload_is_user_over_quota_allowed_100_used_0() {
		add_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		add_filter( 'pre_get_space_used', '__return_zero' );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		remove_filter( 'pre_get_space_used', '__return_zero' );

		$this->assertFalse( $result );
	}

	public function test_upload_is_user_over_quota_allowed_100_used_100() {
		add_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );

		$this->assertFalse( $result );
	}

	public function test_upload_is_user_over_quota_allowed_100_used_200() {
		add_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_200' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_200' ) );

		$this->assertTrue( $result );
	}

	public function test_upload_is_user_over_quota_allowed_negative_used_100() {
		add_filter( 'get_space_allowed', array( $this, '_filter_space_negative' ) );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', array( $this, '_filter_space_negative' ) );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_100' ) );

		$this->assertTrue( $result );
	}

	/**
	 * When the upload space check is disabled, using more than the available
	 * quota is allowed.
	 */
	public function test_upload_is_user_over_check_disabled() {
		update_site_option( 'upload_space_check_disabled', true );

		add_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_200' ) );
		$result = upload_is_user_over_quota( false );
		remove_filter( 'get_space_allowed', array( $this, '_filter_space_100' ) );
		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_200' ) );

		$this->assertFalse( $result );
	}

	public function _filter_space_5() {
		return 5;
	}

	public function _filter_space_100() {
		return 100;
	}

	public function _filter_space_200() {
		return 200;
	}

	public function _filter_space_negative() {
		return -1;
	}
}

endif;