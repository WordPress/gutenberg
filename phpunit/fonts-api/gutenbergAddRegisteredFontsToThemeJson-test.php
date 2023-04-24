<?php

require_once __DIR__ . '/wp-fonts-testcase.php';

/**
 * Test gutenberg_add_registered_fonts_to_theme_json().
 *
 * @package WordPress
 * @subpackage Fonts API
 *
 * @since X.X.X
 * @group fontsapi
 * @covers ::gutenberg_add_registered_fonts_to_theme_json
 */
class Tests_Fonts_GutenbergAddRegisteredFontsToThemeJson extends WP_Fonts_TestCase {
	const FONTS_THEME = 'fonts-block-theme';

	private static $theme_json_data = array();

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	private static $theme_root;

	/**
	 * Original theme directory.
	 *
	 * @var string
	 */
	private $orig_theme_dir;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$theme_root = realpath( __DIR__ . '/../data/themedir1' );

		$themes = array(
			'block-theme',
			'fonts-block-theme',
		);
		foreach ( $themes as $theme ) {
			$file                            = self::$theme_root . "/{$theme}/theme.json";
			self::$theme_json_data[ $theme ] = json_decode( file_get_contents( $file ), true );
		}
	}

	public function set_up() {
		parent::set_up();

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', self::$theme_root );

		// Set up the new root.
		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	public function tear_down() {
		// Clear up the filters to modify the theme root.
		remove_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		WP_Theme_JSON_Resolver::clean_cached_data();

		parent::tear_down();
	}
	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		parent::clean_up_global_scope();

		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();

		if ( function_exists( 'wp_clean_theme_json_cache' ) ) {
			wp_clean_theme_json_cache();
		}

		if ( function_exists( '_gutenberg_clean_theme_json_caches' ) ) {
			_gutenberg_clean_theme_json_caches();
		}

		unset( $GLOBALS['wp_themes'] );
	}

	public function filter_set_theme_root() {
		return self::$theme_root;
	}

	/**
	 * @dataProvider data_themes
	 *
	 * @param string $theme Theme to use.
	 */
	public function test_should_return_instance( $theme ) {
		switch_theme( $theme );

		$data   = new WP_Theme_JSON_Gutenberg( self::$theme_json_data[ $theme ] );
		$actual = gutenberg_add_registered_fonts_to_theme_json( $data );

		$this->assertInstanceOf( WP_Theme_JSON_Gutenberg::class, $actual, 'Instance of WP_Theme_JSON_Gutenberg should be returned' );
	}

	/**
	 * @dataProvider data_themes
	 *
	 * @param string $theme Theme to use.
	 */
	public function test_should_bail_out_when_no_registered_fonts( $theme ) {
		switch_theme( $theme );

		$data   = new WP_Theme_JSON_Gutenberg( self::$theme_json_data[ $theme ] );
		$actual = gutenberg_add_registered_fonts_to_theme_json( $data );

		$this->assertEmpty( wp_fonts()->get_registered_font_families(), 'No fonts should be registered in Fonts API' );
		$this->assertSame( $data, $actual, 'Same instance of WP_Theme_JSON_Gutenberg should be returned' );
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_themes() {
		return array(
			'no fonts defined'    => array( 'block-theme' ),
			'no fonts registered' => array( static::FONTS_THEME ),
		);
	}

	/**
	 * @dataProvider data_should_add_non_theme_json_fonts
	 *
	 * @param string $theme    Theme to use.
	 * @param array  $fonts    Fonts to register.
	 * @param array  $expected Expected fonts to be added.
	 */
	public function test_should_add_non_theme_json_fonts( $theme, $fonts, $expected ) {
		switch_theme( static::FONTS_THEME );

		// Register the fonts.
		wp_register_fonts( $fonts );

		$data   = new WP_Theme_JSON_Gutenberg( self::$theme_json_data[ $theme ] );
		$actual = gutenberg_add_registered_fonts_to_theme_json( $data );

		$this->assertNotSame( $data, $actual, 'New instance of WP_Theme_JSON_Gutenberg should be returned' );
		$actual_raw_data = $actual->get_raw_data();

		$this->assertArrayHasKey( 'typography', $actual_raw_data['settings'] );
		$this->assertArrayHasKey( 'fontFamilies', $actual_raw_data['settings']['typography'] );
		$this->assertArrayHasKey( 'theme', $actual_raw_data['settings']['typography']['fontFamilies'] );

		$this->assertContains(
			$expected,
			$actual_raw_data['settings']['typography']['fontFamilies']['theme'],
			'Fonts should be added after running gutenberg_add_registered_fonts_to_theme_json()'
		);
	}

	/**
	 * Data Provider.
	 *
	 * @return array
	 */
	public function data_should_add_non_theme_json_fonts() {
		$lato = array(
			'Lato' => array(
				array(
					'font-family' => 'Lato',
					'font-style'  => 'normal',
					'font-weight' => '400',
					'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular.woff2',
				),
				array(
					'font-family' => 'Lato',
					'font-style'  => 'italic',
					'font-weight' => '400',
					'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular-Italic.woff2',
				),
			),
		);

		$expected_lato = array(
			'fontFamily' => 'Lato',
			'name'       => 'Lato',
			'slug'       => 'lato',
			'fontFace'   => array(
				'lato-400-normal' => array(
					'origin'      => 'gutenberg_wp_fonts_api',
					'provider'    => 'local',
					'fontFamily'  => 'Lato',
					'fontStyle'   => 'normal',
					'fontWeight'  => '400',
					'fontDisplay' => 'fallback',
					'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular.woff2',
				),
				'lato-400-italic' => array(
					'origin'      => 'gutenberg_wp_fonts_api',
					'provider'    => 'local',
					'fontFamily'  => 'Lato',
					'fontStyle'   => 'italic',
					'fontWeight'  => '400',
					'fontDisplay' => 'fallback',
					'src'         => 'https://example.com/tests/assets/fonts/lato/Lato-Regular-Italic.woff2',
				),
			),
		);

		return array(
			'theme with no fonts defined'              => array(
				'theme'    => 'block-theme',
				'fonts'    => $lato,
				'expected' => $expected_lato,
			),
			'theme with fonts: new fonts not in theme' => array(
				'theme'    => static::FONTS_THEME,
				'fonts'    => $lato,
				'expected' => $expected_lato,
			),

			/*
			 * @TODO Add these tests fixing https://github.com/WordPress/gutenberg/issues/50047.
			 *
			'theme with fonts: new variations registered' => array(
				'theme'    => static::FONTS_THEME,
				'fonts'    => array(
					'DM Sans' => array(
						'dm-sans-500-normal' => array(
							'font-family' => 'DM Sans',
							'font-style'  => 'normal',
							'font-weight' => '500',
							'src'         => 'https://example.com/tests/assets/fonts/dm-sans/DMSans-Medium.woff2',
						),
						'dm-sans-500-italic' => array(
							'font-family' => 'DM Sans',
							'font-style'  => 'italic',
							'font-weight' => '500',
							'src'         => 'https://example.com/tests/assets/fonts/dm-sans/DMSans-Medium.woff2',
						),
					),
				),
				'expected' => array(
					'fontFace'   => array(
						array(
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'normal',
							'fontWeight'  => '400',
							'src'         => array( 'file:./assets/fonts/dm-sans/DMSans-Regular.woff2' ),
						),
						array(
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'italic',
							'fontWeight'  => '400',
							'src'         => array( 'file:./assets/fonts/dm-sans/DMSans-Regular-Italic.woff2' ),
						),
						'dm-sans-500-normal' => array(
							'origin'      => 'gutenberg_wp_fonts_api',
							'provider'    => 'local',
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'normal',
							'fontWeight'  => '500',
							'fontDisplay' => 'fallback',
							'src'         => array( get_stylesheet_directory_uri() . 'assets/fonts/dm-sans/DMSans-Medium.woff2' ),
						),
						'dm-sans-500-italic' => array(
							'origin'      => 'gutenberg_wp_fonts_api',
							'provider'    => 'local',
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'italic',
							'fontWeight'  => '500',
							'fontDisplay' => 'fallback',
							'src'         => array( get_stylesheet_directory_uri() . 'assets/fonts/dm-sans/DMSans-Medium-Italic.woff2' ),
						),
						array(
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'normal',
							'fontWeight'  => '700',
							'src'         => array( 'file:./assets/fonts/dm-sans/DMSans-Bold.woff2' ),
						),
						array(
							'fontFamily'  => 'DM Sans',
							'fontStretch' => 'normal',
							'fontStyle'   => 'italic',
							'fontWeight'  => '700',
							'src'         => array( 'file:./assets/fonts/dm-sans/DMSans-Bold-Italic.woff2' ),
						),
					),
					'fontFamily' => '"DM Sans", sans-serif',
					'name'       => 'DM Sans',
					'slug'       => 'dm-sans',
				),
			),
			*/
		);
	}
}
