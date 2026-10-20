<?php
/**
 * Tests for offering the patterns of other installed themes in the editor.
 *
 * @package gutenberg
 */

class Gutenberg_Installed_Theme_Patterns_Test extends WP_UnitTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	private $theme_root;

	/**
	 * Original theme directories.
	 *
	 * @var string[]
	 */
	private $orig_theme_dir;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id  = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
	}

	public function set_up() {
		parent::set_up();
		$this->theme_root     = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as these tests use the twenty* themes too.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		switch_theme( 'block-theme-child' );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * Returns the stylesheets of the installed themes whose patterns the
	 * editor offers.
	 *
	 * @return string[] The stylesheets.
	 */
	private function get_offered_stylesheets() {
		return array_map(
			static function ( $theme ) {
				return $theme->get_stylesheet();
			},
			gutenberg_get_installed_theme_pattern_sources()
		);
	}

	/**
	 * Returns the slugs of the pattern views in the site editor.
	 *
	 * @return string[] The slugs.
	 */
	private function get_pattern_view_slugs() {
		$config = gutenberg_get_entity_view_config( 'postType', 'wp_block' );
		return wp_list_pluck( $config['view_list'], 'slug' );
	}

	/**
	 * @covers ::gutenberg_get_installed_theme_pattern_sources
	 */
	public function test_lists_installed_themes_other_than_the_active_theme_and_its_parent() {
		wp_set_current_user( self::$admin_id );

		$stylesheets = $this->get_offered_stylesheets();

		$this->assertNotContains( 'block-theme-child', $stylesheets, 'The active theme should not be listed.' );
		$this->assertNotContains( 'block-theme', $stylesheets, 'The parent of the active theme should not be listed.' );
		$this->assertContains( 'default-child-no-theme-json', $stylesheets, 'Other installed themes should be listed.' );
	}

	/**
	 * @covers ::gutenberg_get_installed_theme_pattern_sources
	 */
	public function test_leaves_out_themes_the_should_load_filter_rejects() {
		wp_set_current_user( self::$admin_id );
		add_filter(
			'should_load_installed_theme_block_patterns',
			static function ( $should_load, $theme ) {
				return 'default-child-no-theme-json' === $theme->get_stylesheet() ? false : $should_load;
			},
			10,
			2
		);

		$stylesheets = $this->get_offered_stylesheets();

		$this->assertNotContains( 'default-child-no-theme-json', $stylesheets, 'A theme the filter rejects should not be listed.' );
		$this->assertContains( 'block-theme-child-with-fluid-layout', $stylesheets, 'Themes the filter accepts should still be listed.' );
	}

	/**
	 * @covers ::gutenberg_get_installed_theme_pattern_sources
	 */
	public function test_lists_no_themes_for_users_who_cannot_switch_themes() {
		wp_set_current_user( self::$editor_id );

		$this->assertSame( array(), gutenberg_get_installed_theme_pattern_sources() );
	}

	/**
	 * @covers ::gutenberg_add_installed_theme_patterns_to_editor_settings
	 */
	public function test_tells_the_editor_to_offer_patterns_from_other_themes_to_users_who_can_switch_themes() {
		wp_set_current_user( self::$admin_id );
		$this->assertTrue( gutenberg_add_installed_theme_patterns_to_editor_settings( array() )['hasInstalledThemePatterns'], 'Users who can switch themes should get patterns from other themes.' );

		wp_set_current_user( self::$editor_id );
		$this->assertFalse( gutenberg_add_installed_theme_patterns_to_editor_settings( array() )['hasInstalledThemePatterns'], 'Users who cannot switch themes should not get patterns from other themes.' );
	}

	/**
	 * @covers ::gutenberg_add_other_categories_to_pattern_views
	 */
	public function test_adds_other_categories_to_the_pattern_views_for_users_who_can_switch_themes() {
		wp_set_current_user( self::$admin_id );
		$this->assertContains( 'other-categories', $this->get_pattern_view_slugs(), 'Other categories should be listed for users who can switch themes.' );

		wp_set_current_user( self::$editor_id );
		$this->assertNotContains( 'other-categories', $this->get_pattern_view_slugs(), 'Other categories should not be listed for users who cannot switch themes.' );
	}
}
