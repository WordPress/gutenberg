<?php
if ( is_multisite() ) :
/**
 * Tests specific to the filtering of `WP_Theme::get_allowed()` and related functions.
 *
 * @group themes
 * @group multisite
 */
class Tests_WP_Theme_Get_Allowed_Filters extends WP_UnitTestCase {
	/**
	 * @array List of themes allowed before filters are applied.
	 */
	protected $default_allowed;

	protected $filter_network_allowed_themes_args;

	public function test_network_allowed_themes_filter_sends_blog_id() {
		$blog_id = 1;

		add_filter( 'network_allowed_themes', array( $this, 'filter_network_allowed_themes' ), 10, 2 );
		WP_Theme::get_allowed( $blog_id );
		remove_filter( 'network_allowed_themes', array( $this, 'filter_network_allowed_themes' ) );

		$this->assertEquals( 2, count( $this->filter_network_allowed_themes_args ) );
		$this->assertEquals( $blog_id, $this->filter_network_allowed_themes_args[1] );
	}

	/**
	 * Test the `allowed_themes` filter, which filters themes allowed on a network.
	 */
	public function test_wp_theme_get_allowed_with_allowed_themes_filter() {
		$blog_id = 1;

		$this->default_allowed = WP_Theme::get_allowed( $blog_id );

		add_filter( 'allowed_themes', array( $this, 'filter_allowed_themes' ), 10 );
		$allowed = WP_Theme::get_allowed( $blog_id );
		remove_filter( 'allowed_themes', array( $this, 'filter_allowed_themes' ), 10 );

		$expected = $this->default_allowed + array( 'allow-on-network' => true );

		$this->assertEquals( $expected, $allowed );
	}

	/**
	 * Test the `network_allowed_themes` filter, which filters allowed themes on the network and provides `$blog_id`.
	 */
	public function test_wp_theme_get_allowed_with_network_allowed_themes_filter() {
		$blog_id = 1;

		$this->default_allowed = WP_Theme::get_allowed( $blog_id );

		add_filter( 'network_allowed_themes', array( $this, 'filter_network_allowed_themes' ), 10, 2 );
		$allowed = WP_Theme::get_allowed( $blog_id );
		remove_filter( 'network_allowed_themes', array( $this, 'filter_network_allowed_themes' ), 10 );

		$expected = $this->default_allowed + array( 'network-allowed-theme' => true );

		$this->assertEquals( $expected, $allowed );
	}

	/**
	 * Test the `site_allowed_themes` filter, which filters allowed themes for a site and provides `$blog_id`.
	 */
	public function test_wp_theme_get_allowed_with_site_allowed_themes_filter() {
		$blog_id = 1;

		$this->default_allowed = WP_Theme::get_allowed( $blog_id );

		add_filter( 'site_allowed_themes', array( $this, 'filter_site_allowed_themes' ), 10, 2 );
		$allowed = WP_Theme::get_allowed( $blog_id );
		remove_filter( 'site_allowed_themes', array( $this, 'filter_site_allowed_themes' ), 10 );

		$expected = $this->default_allowed + array( 'site-allowed-theme' => true );

		$this->assertEquals( $expected, $allowed );
	}

	public function filter_allowed_themes( $allowed_themes ) {
		$allowed_themes['allow-on-network'] = true;

		return $allowed_themes;
	}

	public function filter_network_allowed_themes( $allowed_themes, $blog_id ) {
		$this->filter_network_allowed_themes_args = func_get_args();

		$allowed_themes['network-allowed-theme'] = true;

		return $allowed_themes;
	}

	public function filter_site_allowed_themes( $allowed_themes, $blog_id ) {
		$allowed_themes['site-allowed-theme'] = true;

		return $allowed_themes;
	}
}
endif;