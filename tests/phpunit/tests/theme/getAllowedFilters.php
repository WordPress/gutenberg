<?php
/**
 * Tests specific to the filtering of `WP_Theme::get_allowed()` and related functions.
 *
 * @group themes
 */
class Tests_WP_Theme_Get_Allowed_Filters extends WP_UnitTestCase {
	/**
	 * @array List of themes allowed before filters are applied.
	 */
	protected $default_allowed;

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

	public function filter_allowed_themes( $allowed_themes ) {
		$allowed_themes['allow-on-network'] = true;

		return $allowed_themes;
	}
}