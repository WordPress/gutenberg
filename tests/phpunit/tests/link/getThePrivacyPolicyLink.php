<?php
/**
 * Define a class to test the `get_the_privacy_policy_link()` function.
 *
 * @package WordPress
 * @subpackage UnitTests
 * @since 4.9.6
 */

/**
 * Test cases for the `get_the_privacy_policy_link()` function.
 *
 * @group link
 * @group privacy
 * @covers get_the_privacy_policy_link
 *
 * @since 4.9.6
 */
class Tests_Link_GetThePrivacyPolicyLink extends WP_UnitTestCase {
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
	 * The text that gets prepended to the `get_the_privacy_policy_link()` output.
	 *
	 * @since 4.9.6
	 * @var string $before
	 */
	protected static $before;

	/**
	 * The text that gets appended to the `get_the_privacy_policy_link()` output.
	 *
	 * @since 4.9.6
	 * @var string $after
	 */
	protected static $after;

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

		// `esc_url()` is added for consistency with `get_the_privacy_policy_link()`.
		self::$privacy_policy_url = esc_url( get_permalink( self::$privacy_policy_page_id ) );

		self::$before = '<span class="privacy-policy-link-wrapper">';
		self::$after  = '</span>';
	}

	/**
	 * The function should return a valid link if a privacy policy page has been
	 * created and set as the `wp_page_for_privacy_policy`. The post title should
	 * be used as the link text.
	 */
	public function test_get_the_privacy_policy_link_should_return_valid_link_when_privacy_page_set() {
		update_option( 'wp_page_for_privacy_policy', self::$privacy_policy_page_id );

		$actual_link = get_the_privacy_policy_link();

		$this->assertStringStartsWith( '<a', $actual_link );
		$this->assertContains( self::$privacy_policy_url, $actual_link );
		$this->assertStringEndsWith( '>' . WP_TESTS_DOMAIN . ' Privacy Policy</a>', $actual_link );
	}

	/**
	 * The function should prepend the supplied `$before` markup and append the
	 * supplied `$after` markup when the `wp_page_for_privacy_policy` is configured.
	 */
	public function test_get_the_privacy_policy_link_should_prepend_and_append_supplied_markup_when_privacy_page_set() {
		update_option( 'wp_page_for_privacy_policy', self::$privacy_policy_page_id );

		$actual_link = get_the_privacy_policy_link( self::$before, self::$after );

		$this->assertStringStartsWith( self::$before . '<a', $actual_link );
		$this->assertContains( self::$privacy_policy_url, $actual_link );
		$this->assertStringEndsWith( '</a>' . self::$after, $actual_link );
	}

	/**
	 * The function should _not_ prepend the supplied `$before` markup and append
	 * the supplied `$after` markup when the `wp_page_for_privacy_policy` is _not_ configured.
	 */
	public function test_get_the_privacy_policy_link_should_not_prepend_and_append_supplied_markup_when_privacy_page_not_set() {
		$actual_link = get_the_privacy_policy_link( self::$before, self::$after );

		$this->assertSame( '', $actual_link );
	}

	/**
	 * The function should return an empty string when there is an empty page title
	 * for the privacy policy.
	 *
	 * @ticket 44192
	 */
	public function test_function_should_return_empty_string_when_privacy_page_title_empty() {
		$nameless_page_id = $this->factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => '',
			)
		);

		update_option( 'wp_page_for_privacy_policy', $nameless_page_id );

		$this->assertSame( '', get_the_privacy_policy_link( self::$before, self::$after ) );
	}

	/**
	 * The function should return an empty string when `wp_page_for_privacy_policy` is _not_ configured.
	 */
	public function test_get_the_privacy_policy_link_should_return_empty_string_when_privacy_page_not_set() {
		$this->assertSame( '', get_the_privacy_policy_link() );
	}

	/**
	 * The output of the get_the_privacy_policy_link() function should be filterable with the 'privacy_policy_link' filter.
	 */
	public function test_get_the_privacy_policy_link_should_be_filterable() {
		update_option( 'wp_page_for_privacy_policy', self::$privacy_policy_page_id );
		$expected_url = get_privacy_policy_url();

		$this->assertNotEmpty( $expected_url );

		add_filter( 'the_privacy_policy_link', array( $this, 'modify_link_markup' ), 10, 2 );
		$this->assertSame( 'Policy: ' . $expected_url, get_the_privacy_policy_link() );
		remove_filter( 'the_privacy_policy_link', array( $this, 'modify_link_markup' ), 10 );
	}

	/**
	 * Return modified `the_privacy_policy_link` content in order to test the filter.
	 *
	 * @param string $link               The privacy policy link. Empty string if it
	 *                                   doesn't exist.
	 * @param string $privacy_policy_url The URL of the privacy policy. Empty string
	 *                                   if it doesn't exist.
	 * @return string
	 */
	public static function modify_link_markup( $link, $privacy_policy_url ) {
		return 'Policy: ' . $privacy_policy_url;
	}
}
