<?php
/**
 * Unit tests covering Gutenberg_REST_Installed_Theme_Patterns_Controller.
 *
 * @package gutenberg
 *
 * @covers Gutenberg_REST_Installed_Theme_Patterns_Controller
 */
class Gutenberg_REST_Installed_Theme_Patterns_Controller_Test extends WP_UnitTestCase {

	const ROUTE = '/wp/v2/block-patterns/installed-theme-patterns';

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

		switch_theme( 'block-theme' );
	}

	public function tear_down() {
		if ( WP_Block_Patterns_Registry::get_instance()->is_registered( 'block-theme-with-patterns/banner' ) ) {
			unregister_block_pattern( 'block-theme-with-patterns/banner' );
		}
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
	 * Requests the patterns of the other installed themes.
	 *
	 * @return WP_REST_Response The response.
	 */
	private function request_patterns() {
		return rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );
	}

	/**
	 * Returns the patterns of the other installed themes, by name.
	 *
	 * @return array[] The patterns.
	 */
	private function get_patterns() {
		return array_column( $this->request_patterns()->get_data(), null, 'name' );
	}

	public function test_lists_the_patterns_in_the_patterns_folder_of_other_installed_themes() {
		wp_set_current_user( self::$admin_id );

		$patterns = $this->get_patterns();

		$this->assertArrayHasKey( 'block-theme-with-patterns/banner', $patterns, 'Patterns in the folder of another theme should be listed.' );
		$this->assertSame( 'Banner', $patterns['block-theme-with-patterns/banner']['title'] );
		$this->assertSame( array( 'banner' ), $patterns['block-theme-with-patterns/banner']['categories'] );
		$this->assertSame( 'block-theme-with-patterns', $patterns['block-theme-with-patterns/banner']['theme'], 'The theme the pattern comes from should be included.' );
		$this->assertSame( 'Block Theme With Patterns', $patterns['block-theme-with-patterns/banner']['theme_name'], 'The name of the theme should be included.' );
	}

	public function test_leaves_out_patterns_hidden_from_the_inserter() {
		wp_set_current_user( self::$admin_id );

		$this->assertArrayNotHasKey( 'block-theme-with-patterns/heading', $this->get_patterns() );
	}

	public function test_includes_the_theme_patterns_a_pattern_uses() {
		wp_set_current_user( self::$admin_id );

		$content = $this->get_patterns()['block-theme-with-patterns/banner']['content'];

		$this->assertStringContainsString( 'Heading from a hidden pattern', $content, 'A pattern the theme hides from the inserter should be included where it is used.' );
		$this->assertStringNotContainsString( 'wp:pattern', $content, 'No pattern block should be left to resolve.' );
	}

	public function test_loads_files_from_the_theme_the_pattern_comes_from() {
		wp_set_current_user( self::$admin_id );
		$theme_url  = wp_get_theme( 'block-theme-with-patterns' )->get_stylesheet_directory_uri();
		$active_url = get_template_directory_uri();

		$content = $this->get_patterns()['block-theme-with-patterns/banner']['content'];

		$this->assertStringContainsString( $theme_url . '/assets/image.png', $content, 'Files should load from the theme the pattern comes from.' );
		$this->assertStringNotContainsString( $active_url . '/assets/image.png', $content, 'Files should not load from the active theme.' );
	}

	public function test_lists_a_child_theme_patterns_with_the_child_and_its_parent_patterns_with_the_parent() {
		wp_set_current_user( self::$admin_id );

		$data     = $this->request_patterns()->get_data();
		$patterns = array_column( $data, null, 'name' );

		$this->assertSame( 'block-theme-with-patterns-child', $patterns['block-theme-with-patterns-child/child']['theme'], 'A child theme pattern should be listed with the child theme.' );
		$this->assertSame( 'block-theme-with-patterns', $patterns['block-theme-with-patterns/banner']['theme'], 'A parent theme pattern should be listed with the parent.' );
		$this->assertCount( 1, wp_list_filter( $data, array( 'name' => 'block-theme-with-patterns/banner' ) ), 'A parent theme pattern should not be listed again for its child.' );
		$this->assertStringContainsString( 'Heading from a hidden pattern', $patterns['block-theme-with-patterns-child/child']['content'], 'A child theme pattern can use its parent theme patterns.' );
		$this->assertStringContainsString( wp_get_theme( 'block-theme-with-patterns-child' )->get_stylesheet_directory_uri() . '/assets/child.png', $patterns['block-theme-with-patterns-child/child']['content'], 'Files should load from the child theme.' );
	}

	public function test_leaves_out_patterns_the_editor_already_offers() {
		wp_set_current_user( self::$admin_id );
		register_block_pattern(
			'block-theme-with-patterns/banner',
			array(
				'title'   => 'Banner from the active theme',
				'content' => '<!-- wp:paragraph --><p>Active</p><!-- /wp:paragraph -->',
			)
		);

		$this->assertArrayNotHasKey( 'block-theme-with-patterns/banner', $this->get_patterns() );
		$this->assertSame( 'Banner from the active theme', WP_Block_Patterns_Registry::get_instance()->get_registered( 'block-theme-with-patterns/banner' )['title'], 'The registered pattern should be kept.' );
	}

	public function test_leaves_out_patterns_whose_file_fails() {
		wp_set_current_user( self::$admin_id );

		$response = $this->request_patterns();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayNotHasKey( 'block-theme-with-patterns/broken', array_column( $response->get_data(), null, 'name' ) );
	}

	public function test_leaves_out_patterns_that_use_patterns_only_their_active_theme_loads() {
		wp_set_current_user( self::$admin_id );

		$this->assertArrayNotHasKey( 'block-theme-with-patterns/uses-directory-pattern', $this->get_patterns() );
	}

	public function test_leaves_the_registry_and_the_active_theme_as_they_were() {
		wp_set_current_user( self::$admin_id );

		$this->request_patterns();

		$this->assertFalse( WP_Block_Patterns_Registry::get_instance()->is_registered( 'block-theme-with-patterns/banner' ), 'Patterns of other themes should not stay registered.' );
		$this->assertFalse( WP_Block_Patterns_Registry::get_instance()->is_registered( 'block-theme-with-patterns/heading' ), 'Hidden patterns of other themes should not stay registered.' );
		$this->assertSame( 'block-theme', get_stylesheet(), 'The active theme should not change.' );
		$this->assertSame( 'block-theme', get_template(), 'The active template should not change.' );
	}

	public function test_applies_the_installed_theme_block_patterns_filter() {
		wp_set_current_user( self::$admin_id );
		$filtered_themes = array();
		add_filter(
			'installed_theme_block_patterns',
			static function ( $patterns, $theme ) use ( &$filtered_themes ) {
				$filtered_themes[] = $theme->get_stylesheet();
				return array_values(
					array_filter(
						$patterns,
						static function ( $pattern ) {
							return 'block-theme-with-patterns/banner' !== $pattern['name'];
						}
					)
				);
			},
			10,
			2
		);

		$patterns = $this->get_patterns();

		$this->assertContains( 'block-theme-with-patterns', $filtered_themes, 'The filter should receive each theme.' );
		$this->assertArrayNotHasKey( 'block-theme-with-patterns/banner', $patterns, 'Patterns the filter removes should not be listed.' );
		$this->assertArrayHasKey( 'block-theme-with-patterns-child/child', $patterns, 'Patterns the filter keeps should be listed.' );
	}

	public function test_rejects_users_who_cannot_switch_themes() {
		wp_set_current_user( self::$editor_id );

		$this->assertSame( 403, $this->request_patterns()->get_status() );
	}
}
