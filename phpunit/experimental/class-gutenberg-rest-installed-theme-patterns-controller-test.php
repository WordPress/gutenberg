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
	 * Patterns the tests register, by source.
	 *
	 * @var array
	 */
	const PATTERNS = array(
		'test/installed-theme-pattern' => null,
		'test/core-pattern'            => 'core',
		'test/directory-pattern'       => 'pattern-directory/featured',
	);

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

		switch_theme( 'default' );

		// Keeps the tests from requesting patterns from the Pattern Directory.
		add_filter( 'should_load_remote_block_patterns', '__return_false' );

		foreach ( self::PATTERNS as $name => $source ) {
			$pattern = array(
				'title'   => $name,
				'content' => '<!-- wp:paragraph --><p>Pattern</p><!-- /wp:paragraph -->',
			);
			if ( $source ) {
				$pattern['source'] = $source;
			}
			register_block_pattern( $name, $pattern );
		}
	}

	public function tear_down() {
		foreach ( array_keys( self::PATTERNS ) as $name ) {
			if ( WP_Block_Patterns_Registry::get_instance()->is_registered( $name ) ) {
				unregister_block_pattern( $name );
			}
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
	 * Previews a theme the way the `wp_theme_preview` query argument does.
	 */
	private function preview_block_theme() {
		$preview = static function () {
			return 'block-theme';
		};
		add_filter( 'stylesheet', $preview );
		add_filter( 'template', $preview );
	}

	/**
	 * Requests the patterns of the previewed theme.
	 *
	 * @return WP_REST_Response The response.
	 */
	private function request_patterns() {
		return rest_do_request( new WP_REST_Request( 'GET', self::ROUTE ) );
	}

	public function test_returns_the_previewed_theme_patterns_without_core_or_pattern_directory_patterns() {
		wp_set_current_user( self::$admin_id );
		$this->preview_block_theme();

		$names = wp_list_pluck( $this->request_patterns()->get_data(), 'name' );

		$this->assertContains( 'test/installed-theme-pattern', $names, 'Patterns the theme registers should be returned.' );
		$this->assertNotContains( 'test/core-pattern', $names, 'Core patterns should be left out.' );
		$this->assertNotContains( 'test/directory-pattern', $names, 'Pattern Directory patterns should be left out.' );
	}

	public function test_applies_the_installed_theme_block_patterns_filter() {
		wp_set_current_user( self::$admin_id );
		$this->preview_block_theme();
		$filtered_theme = null;
		add_filter(
			'installed_theme_block_patterns',
			static function ( $patterns, $theme ) use ( &$filtered_theme ) {
				$filtered_theme = $theme->get_stylesheet();
				return array_values(
					array_filter(
						$patterns,
						static function ( $pattern ) {
							return 'test/installed-theme-pattern' !== $pattern['name'];
						}
					)
				);
			},
			10,
			2
		);

		$names = wp_list_pluck( $this->request_patterns()->get_data(), 'name' );

		$this->assertSame( 'block-theme', $filtered_theme, 'The filter should receive the previewed theme.' );
		$this->assertNotContains( 'test/installed-theme-pattern', $names, 'Patterns the filter removes should not be returned.' );
	}

	public function test_returns_no_patterns_when_no_other_theme_is_previewed() {
		wp_set_current_user( self::$admin_id );

		$this->assertSame( array(), $this->request_patterns()->get_data() );
	}

	public function test_rejects_users_who_cannot_switch_themes() {
		wp_set_current_user( self::$editor_id );
		$this->preview_block_theme();

		$this->assertSame( 403, $this->request_patterns()->get_status() );
	}
}
