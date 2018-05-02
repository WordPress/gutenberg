<?php
/**
 * Define a class to test `get_privacy_policy_url()`.
 *
 * @package WordPress
 * @subpackage UnitTests
 * @since 4.9.6
 */

/**
 * Test cases for `get_privacy_policy_url()`.
 *
 * @group url
 * @group privacy
 * @covers get_privacy_policy_url
 *
 * @since 4.9.6
 */
class Tests_Url_GetPrivacyPolicyUrl extends WP_UnitTestCase {
	/**
	 * The ID of the Privacy Policy page.
	 *
	 * @since 4.9.6
	 * @var int $privacy_policy_page_id
	 */
	protected static $privacy_policy_page_id;

	/**
	 * The URL of the Privacy Policy page.
	 *
	 * @since 4.9.6
	 * @var string $privacy_policy_url
	 */
	protected static $privacy_policy_url;

	/**
	 * Create fixtures that are shared by multiple test cases.
	 *
	 * @param WP_UnitTest_Factory $factory The base factory object.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$privacy_policy_page_id = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => WP_TESTS_DOMAIN . ' Privacy Policy',
			)
		);

		self::$privacy_policy_url = get_permalink( self::$privacy_policy_page_id );
	}

	/**
	 * The function should return an empty string when `wp_page_for_privacy_policy` is _not_ set.
	 */
	public function test_get_privacy_policy_url_should_return_empty_string_when_policy_page_not_set() {
		$this->assertSame( '', get_privacy_policy_url() );
	}

	/**
	 * The function should return the privacy policy URL when `wp_page_for_privacy_policy` is set.
	 */
	public function test_get_privacy_policy_url_should_return_valid_url_when_policy_page_set() {
		update_option( 'wp_page_for_privacy_policy', self::$privacy_policy_page_id );

		$this->assertSame( self::$privacy_policy_url, get_privacy_policy_url() );
	}

	/**
	 * The function should return an empty string when `wp_page_for_privacy_policy` is _not_ set.
	 */
	public function test_get_privacy_policy_url_should_return_empty_when_privacy_policy_page_not_set() {
		$this->assertSame( '', get_privacy_policy_url() );
	}

	/**
	 * The function should return an empty string for an invalid `wp_page_for_privacy_policy` value.
	 */
	public function test_get_privacy_policy_url_should_return_empty_for_non_existing_page() {
		update_option( 'wp_page_for_privacy_policy', PHP_INT_MAX );

		$this->assertSame( '', get_privacy_policy_url() );
	}

	/**
	 * The output of `get_privacy_policy_url()` should be filterable with the 'privacy_policy_url' filter.
	 */
	public function test_get_privacy_policy_url_should_be_filterable() {
		update_option( 'wp_page_for_privacy_policy', self::$privacy_policy_page_id );

		add_filter( 'privacy_policy_url', array( $this, 'modify_policy_url' ), 10, 2 );
		$this->assertSame( 'Page ID: ' . self::$privacy_policy_page_id, get_privacy_policy_url() );
		remove_filter( 'privacy_policy_url', array( $this, 'modify_policy_url' ), 10 );
	}

	/**
	 * Return modified `privacy_policy_url` content in order to test the filter.
	 *
	 * @param string $url            The URL to the privacy policy page. Empty string
	 *                               if it doesn't exist.
	 * @param int    $policy_page_id The ID of privacy policy page.
	 * @return string
	 */
	public static function modify_policy_url( $url, $policy_page_id ) {
		return 'Page ID: ' . $policy_page_id;
	}
}
