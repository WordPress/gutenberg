<?php
/**
 * Tests functions in get-global-styles-and-settings-test.php.
 *
 * @package Gutenberg
 */

class WP_Get_Global_Styles_And_Settings_Test extends WP_UnitTestCase {

	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	private static $administrator_id;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$administrator_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$administrator_id );
	}

	public function test_wp_theme_use_persistent_cache() {
		$expected_default = ! in_array( wp_get_environment_type(), array( 'local', 'development' ), true );

		$this->assertSame( $expected_default, wp_theme_use_persistent_cache() );

		add_filter( 'wp_theme_use_persistent_cache', '__return_true' );
		$this->assertTrue( wp_theme_use_persistent_cache() );

		add_filter( 'wp_theme_use_persistent_cache', '__return_false' );
		$this->assertFalse( wp_theme_use_persistent_cache() );
	}

	public function test_global_styles_user_cpt_change_invalidates_cached_stylesheet() {
		$this->override_theme_root( realpath( DIR_TESTDATA . '/themedir1' ) );
		add_filter( 'wp_theme_use_persistent_cache', '__return_true' );
		switch_theme( 'block-theme' );
		wp_set_current_user( self::$administrator_id );

		$styles = gutenberg_get_global_stylesheet();
		$this->assertStringNotContainsString( 'background-color: hotpink;', $styles );

		$user_cpt                                = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		$config                                  = json_decode( $user_cpt['post_content'], true );
		$config['styles']['color']['background'] = 'hotpink';
		$user_cpt['post_content']                = wp_json_encode( $config );

		wp_update_post( $user_cpt, true, false );

		$styles = gutenberg_get_global_stylesheet();
		$this->assertStringContainsString( 'background-color: hotpink;', $styles );
	}

	public function override_theme_root( $theme_root ) {
		$override = function() use ( $theme_root ) {
			return $theme_root;
		};
		add_filter( 'theme_root', $override );
		add_filter( 'stylesheet_root', $override );
		add_filter( 'template_root', $override );
	}
}
