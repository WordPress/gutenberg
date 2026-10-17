<?php
/**
 * Tests script and style loading.
 *
 * @package gutenberg
 */

class WP_Script_Loader_Test extends WP_UnitTestCase {
	/**
	 * Original registered theme directories.
	 *
	 * @var array
	 */
	private $original_theme_directories;

	public function set_up() {
		parent::set_up();
		$this->original_theme_directories = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories']  = array( WP_CONTENT_DIR . '/themes', __DIR__ . '/data/themedir1' );
		add_filter( 'theme_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_theme_root' ) );
		wp_clean_themes_cache();
		_gutenberg_clean_theme_json_caches();
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->original_theme_directories;
		wp_clean_themes_cache();
		_gutenberg_clean_theme_json_caches();
		parent::tear_down();
	}

	/**
	 * Uses the bundled theme fixtures.
	 *
	 * @return string Theme root.
	 */
	public function filter_theme_root() {
		return __DIR__ . '/data/themedir1';
	}

	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_styles; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::clean_up_global_scope();
		$wp_styles = null;
	}
	/**
	 * Tests that stored CSS is enqueued.
	 *
	 * @covers ::wp_enqueue_stored_styles
	 */
	public function test_should_enqueue_stored_styles() {
		$core_styles_to_enqueue = array(
			array(
				'selector'     => '.saruman',
				'declarations' => array(
					'color'        => 'white',
					'height'       => '100px',
					'border-style' => 'solid',
				),
			),
		);

		// Enqueues a block supports (core styles).
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$core_styles_to_enqueue,
			array(
				'context' => 'block-supports',
			)
		);

		$my_styles_to_enqueue = array(
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
		);

		// Enqueues some other styles.
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$my_styles_to_enqueue,
			array(
				'context' => 'my-styles',
			)
		);

		gutenberg_enqueue_stored_styles(
			array( 'prettify' => false )
		);

		$this->assertSame(
			array( '.saruman{color:white;height:100px;border-style:solid;}' ),
			wp_styles()->registered['core-block-supports']->extra['after'],
			'Registered styles with handle of "core-block-supports" do not match expected value from Style Engine store.'
		);

		$this->assertSame(
			array( '.gandalf{color:grey;height:90px;border-style:dotted;}' ),
			wp_styles()->registered['wp-style-engine-my-styles']->extra['after'],
			'Registered styles with handle of "wp-style-engine-my-styles" do not match expected value from the Style Engine store.'
		);
	}

	/**
	 * Tests global custom CSS and the Customizer cascade through both frontend hooks.
	 *
	 * @dataProvider data_theme_types_and_asset_loading
	 * @covers ::gutenberg_enqueue_global_styles
	 *
	 * @param string $theme            Theme stylesheet.
	 * @param bool   $assets_on_demand Whether block assets load on demand.
	 */
	public function test_should_enqueue_theme_json_custom_css( $theme, $assets_on_demand ) {
		switch_theme( $theme );
		$this->assertSame( 'block-theme' === $theme, wp_is_block_theme(), 'The fixture should match the expected theme type.' );
		$custom_css     = '.theme-json-custom-css{color:red;}';
		$customizer_css = '.customizer-custom-css{color:blue;}';
		$theme_data     = static function ( $theme_json ) use ( $custom_css ) {
			return $theme_json->update_with(
				array(
					'version' => 3,
					'styles'  => array( 'css' => $custom_css ),
				)
			);
		};
		add_filter( 'wp_theme_json_data_theme', $theme_data );
		add_filter( 'should_load_block_assets_on_demand', $assets_on_demand ? '__return_true' : '__return_false' );
		add_filter(
			'wp_get_custom_css',
			static function () use ( $customizer_css ) {
				return $customizer_css;
			}
		);
		add_action( 'wp_head', 'wp_custom_css_cb', 101 );

		ob_start();
		do_action( 'wp_enqueue_scripts' );
		$head_css = implode( '', (array) wp_styles()->get_data( 'global-styles', 'after' ) );
		do_action( 'wp_footer' );
		ob_end_clean();
		$stylesheet = implode( '', (array) wp_styles()->get_data( 'global-styles', 'after' ) );

		if ( 'default' === $theme && $assets_on_demand ) {
			$this->assertStringNotContainsString( $custom_css, $head_css, 'Classic on-demand styles should be deferred to the footer.' );
		} else {
			$this->assertStringContainsString( $custom_css, $head_css, 'Global custom CSS should be enqueued in the head.' );
		}
		$this->assertSame( 1, substr_count( $stylesheet, $custom_css ), 'The global custom CSS should appear exactly once.' );

		if ( 'default' === $theme ) {
			$this->assertSame( 101, has_action( 'wp_head', 'wp_custom_css_cb' ), 'Classic themes should retain the Customizer callback at priority 101.' );
			$this->assertStringNotContainsString( $customizer_css, $stylesheet, 'Classic themes should print Customizer CSS separately.' );
			ob_start();
			wp_custom_css_cb();
			$this->assertStringContainsString( $customizer_css, ob_get_clean() );
		} else {
			$this->assertFalse( has_action( 'wp_head', 'wp_custom_css_cb' ), 'Block themes should merge Customizer CSS into global styles.' );
			$this->assertSame( 1, substr_count( $stylesheet, $customizer_css ) );
			$this->assertLessThan( strpos( $stylesheet, $custom_css ), strpos( $stylesheet, $customizer_css ), 'Customizer CSS should precede global custom CSS.' );
		}
	}

	/**
	 * Provides theme types and asset-loading modes.
	 *
	 * @return array Test cases.
	 */
	public static function data_theme_types_and_asset_loading() {
		return array(
			'classic, all assets' => array( 'default', false ),
			'classic, on demand'  => array( 'default', true ),
			'block, all assets'   => array( 'block-theme', false ),
			'block, on demand'    => array( 'block-theme', true ),
		);
	}

	/**
	 * Tests that block-theme Customizer preview milestones remain intact.
	 *
	 * @dataProvider data_customizer_css
	 * @covers ::gutenberg_enqueue_global_styles
	 *
	 * @param string $customizer_css Customizer CSS, including existing milestones.
	 */
	public function test_should_preserve_customizer_preview_milestones( $customizer_css ) {
		global $wp_customize;
		$original_customize = $wp_customize;
		switch_theme( 'block-theme' );
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->start_previewing_theme();
		add_filter(
			'wp_get_custom_css',
			static function () use ( $customizer_css ) {
				return $customizer_css;
			}
		);

		try {
			gutenberg_enqueue_global_styles();
			$stylesheet = implode( '', (array) wp_styles()->get_data( 'global-styles', 'after' ) );
			$this->assertSame( 1, substr_count( $stylesheet, '/*BEGIN_CUSTOMIZER_CUSTOM_CSS*/' ) );
			$this->assertSame( 1, substr_count( $stylesheet, '/*END_CUSTOMIZER_CUSTOM_CSS*/' ) );
			$this->assertFalse( has_action( 'wp_head', 'wp_custom_css_cb' ) );
		} finally {
			$wp_customize->stop_previewing_theme();
			$wp_customize = $original_customize;
		}
	}

	/**
	 * Provides empty Customizer CSS and CSS containing preview milestones.
	 *
	 * @return array Test cases.
	 */
	public static function data_customizer_css() {
		return array(
			'empty'               => array( '' ),
			'existing milestones' => array( '/*BEGIN_CUSTOMIZER_CUSTOM_CSS*/.customizer-custom-css{color:blue;}/*END_CUSTOMIZER_CUSTOM_CSS*/' ),
		);
	}
}
