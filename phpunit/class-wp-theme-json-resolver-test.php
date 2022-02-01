<?php

/**
 * Test WP_Theme_JSON_Resolver_Gutenberg class.
 *
 * @package Gutenberg
 */

class WP_Theme_JSON_Resolver_Gutenberg_Test extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		$this->theme_root = realpath( __DIR__ . '/data/themedir1' );

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		$this->queries = array();
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	function tearDown() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tearDown();
	}

	function filter_set_theme_root() {
		return $this->theme_root;
	}

	function filter_set_locale_to_polish() {
		return 'pl_PL';
	}

	function filter_db_query( $query ) {
		if ( preg_match( '#post_type = \'wp_global_styles\'#', $query ) ) {
			$this->queries[] = $query;
		}
		return $query;
	}

	function test_translations_are_applied() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );
		load_textdomain( 'block-theme', realpath( __DIR__ . '/data/languages/themes/block-theme-pl_PL.mo' ) );

		switch_theme( 'block-theme' );
		$actual = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();

		unload_textdomain( 'block-theme' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );

		$this->assertSame( wp_get_theme()->get( 'TextDomain' ), 'block-theme' );
		$this->assertSame(
			array(
				'color'      => array(
					'custom'         => false,
					'customGradient' => true,
					'palette'        => array(
						'theme' => array(
							array(
								'slug'  => 'light',
								'name'  => 'Jasny',
								'color' => '#f5f7f9',
							),
							array(
								'slug'  => 'dark',
								'name'  => 'Ciemny',
								'color' => '#000',
							),
						),
					),
				),
				'typography' => array(
					'customFontSize' => true,
					'lineHeight'     => false,
				),
				'spacing'    => array(
					'units'   => false,
					'padding' => false,
				),
				'blocks'     => array(
					'core/paragraph' => array(
						'color' => array(
							'palette' => array(
								'theme' => array(
									array(
										'slug'  => 'light',
										'name'  => 'Jasny',
										'color' => '#f5f7f9',
									),
								),
							),
						),
					),
				),
			),
			$actual->get_settings()
		);
		$this->assertSame(
			$actual->get_custom_templates(),
			array(
				'page-home' => array(
					'title'     => 'Szablon strony głównej',
					'postTypes' => array( 'page' ),
				),
			)
		);
		$this->assertSame(
			$actual->get_template_parts(),
			array(
				'small-header' => array(
					'title' => 'Mały nagłówek',
					'area'  => 'header',
				),
			)
		);
	}

	function test_switching_themes_recalculates_data() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$default = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$has_theme_json_support = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

		$this->assertFalse( $default );
		$this->assertTrue( $has_theme_json_support );
	}

	function test_add_theme_supports_are_loaded_for_themes_without_theme_json() {
		switch_theme( 'default' );
		$color_palette = array(
			array(
				'name'  => 'Primary',
				'slug'  => 'primary',
				'color' => '#F00',
			),
			array(
				'name'  => 'Secondary',
				'slug'  => 'secondary',
				'color' => '#0F0',
			),
			array(
				'name'  => 'Tertiary',
				'slug'  => 'tertiary',
				'color' => '#00F',
			),
		);
		add_theme_support( 'editor-color-palette', $color_palette );
		add_theme_support( 'custom-line-height' );

		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();

		remove_theme_support( 'custom-line-height' );
		remove_theme_support( 'editor-color-palette' );

		$this->assertFalse( WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() );
		$this->assertTrue( $settings['typography']['lineHeight'] );
		$this->assertSame( $color_palette, $settings['color']['palette']['theme'] );
	}

	/**
	 * Recursively applies ksort to an array.
	 */
	private static function recursive_ksort( &$array ) {
		foreach ( $array as &$value ) {
			if ( is_array( $value ) ) {
				self::recursive_ksort( $value );
			}
		}
		ksort( $array );
	}

	function test_merges_child_theme_json_into_parent_theme_json() {
		switch_theme( 'block-theme-child' );

		$actual_settings   = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();
		$expected_settings = array(
			'color'      => array(
				'custom'         => false,
				'customGradient' => true,
				'palette'        => array(
					'theme' => array(
						array(
							'slug'  => 'light',
							'name'  => 'Light',
							'color' => '#f3f4f6',
						),
						array(
							'slug'  => 'primary',
							'name'  => 'Primary',
							'color' => '#3858e9',
						),
						array(
							'slug'  => 'dark',
							'name'  => 'Dark',
							'color' => '#111827',
						),
					),
				),
				'link'           => true,
			),
			'typography' => array(
				'customFontSize' => true,
				'lineHeight'     => false,
			),
			'spacing'    => array(
				'units'   => false,
				'padding' => false,
			),
			'blocks'     => array(
				'core/paragraph'  => array(
					'color' => array(
						'palette' => array(
							'theme' => array(
								array(
									'slug'  => 'light',
									'name'  => 'Light',
									'color' => '#f5f7f9',
								),
							),
						),
					),
				),
				'core/post-title' => array(
					'color' => array(
						'palette' => array(
							'theme' => array(
								array(
									'slug'  => 'light',
									'name'  => 'Light',
									'color' => '#f3f4f6',
								),
							),
						),
					),
				),
			),
		);
		self::recursive_ksort( $actual_settings );
		self::recursive_ksort( $expected_settings );

		// Should merge settings.
		$this->assertSame(
			$expected_settings,
			$actual_settings
		);

		$this->assertSame(
			WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_custom_templates(),
			array(
				'page-home' => array(
					'title'     => 'Homepage',
					'postTypes' => array( 'page' ),
				),
			)
		);
	}

	function test_get_user_data_from_wp_global_styles_does_not_use_uncached_queries() {
		add_filter( 'query', array( $this, 'filter_db_query' ) );
		$query_count = count( $this->queries );
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme() );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		$query_count = count( $this->queries ) - $query_count;
		$this->assertEquals( 1, $query_count, 'Only one SQL query should be peformed for multiple invocations of WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles()' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme() );
		$this->assertEmpty( $user_cpt );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		$this->assertNotEmpty( $user_cpt );

		$query_count = count( $this->queries );
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme() );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		$query_count = count( $this->queries ) - $query_count;
		$this->assertEquals( 0, $query_count, 'Unexpected SQL queries detected for the wp_global_style post type' );
		remove_filter( 'query', array( $this, 'filter_db_query' ) );
	}
}
