<?php

/**
 * Test WP_Theme_JSON_Resolver_Gutenberg class.
 *
 * @package Gutenberg
 */

class Tests_Fonts_WpFontFaceResolver_EnqueueUserSelectedFonts extends WP_UnitTestCase {
	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	protected static $administrator_id;

	/**
	 * WP_Theme_JSON_Resolver::$blocks_cache property.
	 *
	 * @var ReflectionProperty
	 */
	private static $property_blocks_cache;

	/**
	 * Original value of the WP_Theme_JSON_Resolver::$blocks_cache property.
	 *
	 * @var array
	 */
	private static $property_blocks_cache_orig_value;

	/**
	 * WP_Theme_JSON_Resolver::$core property.
	 *
	 * @var ReflectionProperty
	 */
	private static $property_core;

	/**
	 * Original value of the WP_Theme_JSON_Resolver::$core property.
	 *
	 * @var WP_Theme_JSON
	 */
	private static $property_core_orig_value;

	/**
	 * @var string|null
	 */
	private $theme_root;

	/**
	 * @var array|null
	 */
	private $orig_theme_dir;

	/**
	 * @var array|null
	 */
	private $queries;

	public static function set_up_before_class() {
		parent::set_up_before_class();

		self::$administrator_id = self::factory()->user->create(
			array(
				'role'       => 'administrator',
				'user_email' => 'administrator@example.com',
			)
		);

		static::$property_blocks_cache = new ReflectionProperty( WP_Theme_JSON_Resolver_Gutenberg::class, 'blocks_cache' );
		static::$property_blocks_cache->setAccessible( true );
		static::$property_blocks_cache_orig_value = static::$property_blocks_cache->getValue();

		static::$property_core = new ReflectionProperty( WP_Theme_JSON_Resolver_Gutenberg::class, 'core' );
		static::$property_core->setAccessible( true );
		static::$property_core_orig_value = static::$property_core->getValue();
	}

	public function set_up() {
		parent::set_up();
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

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	public function filter_set_locale_to_polish() {
		return 'pl_PL';
	}

	public function filter_db_query( $query ) {
		if ( preg_match( '#post_type = \'wp_global_styles\'#', $query ) ) {
			$this->queries[] = $query;
		}
		return $query;
	}

	public function test_translations_are_applied() {
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

	public function test_add_theme_supports_are_loaded_for_themes_without_theme_json() {
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

		$this->assertFalse( wp_theme_has_theme_json() );
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

	public function test_merges_child_theme_json_into_parent_theme_json() {
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

	public function test_get_user_data_from_wp_global_styles_does_not_use_uncached_queries() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		wp_set_current_user( self::$administrator_id );
		$theme = wp_get_theme();
		WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		add_filter( 'query', array( $this, 'filter_db_query' ) );
		$query_count = count( $this->queries );
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		$query_count = count( $this->queries ) - $query_count;
		$this->assertSame( 0, $query_count, 'Unexpected SQL queries detected for the wp_global_style post type prior to creation.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertNotEmpty( $user_cpt, 'User CPT is expected not to be empty.' );

		$query_count = count( $this->queries );
		for ( $i = 0; $i < 3; $i ++ ) {
			$new_user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
			$this->assertSameSets( $user_cpt, $new_user_cpt, "User CPTs do not match on run {$i}." );
		}
		$query_count = count( $this->queries ) - $query_count;
		$this->assertSame( 1, $query_count, 'Unexpected SQL queries detected for the wp_global_style post type after creation.' );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_does_not_use_uncached_queries_for_logged_out_users() {
		$theme = wp_get_theme();
		WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		add_filter( 'query', array( $this, 'filter_db_query' ) );
		$query_count = count( $this->queries );
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
		}
		$query_count = count( $this->queries ) - $query_count;
		$this->assertSame( 0, $query_count, 'Unexpected SQL queries detected for the wp_global_style post type prior to creation.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );
	}

	/**
	 * Test that get_merged_data returns the data merged up to the proper origin.
	 *
	 * @covers WP_Theme_JSON_Resolver::get_merged_data
	 *
	 * @dataProvider data_get_merged_data_returns_origin
	 *
	 * @param string $origin            What origin to get data from.
	 * @param bool   $core_palette      Whether the core palette is present.
	 * @param string $core_palette_text Message.
	 * @param string $block_styles      Whether the block styles are present.
	 * @param string $block_styles_text Message.
	 * @param bool   $theme_palette      Whether the theme palette is present.
	 * @param string $theme_palette_text Message.
	 * @param bool   $user_palette      Whether the user palette is present.
	 * @param string $user_palette_text Message.
	 */
	public function test_get_merged_data_returns_origin( $origin, $core_palette, $core_palette_text, $block_styles, $block_styles_text, $theme_palette, $theme_palette_text, $user_palette, $user_palette_text ) {
		// Make sure there is data from the blocks origin.
		register_block_type(
			'my/block-with-styles',
			array(
				'api_version' => 3,
				'attributes'  => array(
					'borderColor' => array(
						'type' => 'string',
					),
					'style'       => array(
						'type' => 'object',
					),
				),
				'supports'    => array(
					'__experimentalStyle' => array(
						'typography' => array(
							'fontSize' => '42rem',
						),
					),
				),
			)
		);

		// Make sure there is data from the theme origin.
		switch_theme( 'block-theme' );

		// Make sure there is data from the user origin.
		wp_set_current_user( self::$administrator_id );
		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		$config   = json_decode( $user_cpt['post_content'], true );
		$config['settings']['color']['palette']['custom'] = array(
			array(
				'color' => 'hotpink',
				'name'  => 'My color',
				'slug'  => 'my-color',
			),
		);
		$user_cpt['post_content']                         = wp_json_encode( $config );
		wp_update_post( $user_cpt, true, false );

		$theme_json = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $origin );
		$settings   = $theme_json->get_settings();
		$styles     = $theme_json->get_styles_block_nodes();
		$this->assertSame( $core_palette, isset( $settings['color']['palette']['default'] ), $core_palette_text );
		$styles = array_filter(
			$styles,
			static function( $element ) {
				return isset( $element['name'] ) && 'my/block-with-styles' === $element['name'];
			}
		);
		$this->assertSame( $block_styles, count( $styles ) === 1, $block_styles_text );
		$this->assertSame( $theme_palette, isset( $settings['color']['palette']['theme'] ), $theme_palette_text );
		$this->assertSame( $user_palette, isset( $settings['color']['palette']['custom'] ), $user_palette_text );

		unregister_block_type( 'my/block-with-styles' );
	}

	/**
	 * Data provider for test_get_merged_data_returns_origin
	 *
	 * @return array
	 */
	public function data_get_merged_data_returns_origin() {
		return array(
			'origin_default' => array(
				'origin'             => 'default',
				'core_palette'       => true,
				'core_palette_text'  => 'Core palette must be present',
				'block_styles'       => false,
				'block_styles_text'  => 'Block styles should not be present',
				'theme_palette'      => false,
				'theme_palette_text' => 'Theme palette should not be present',
				'user_palette'       => false,
				'user_palette_text'  => 'User palette should not be present',
			),
			'origin_blocks'  => array(
				'origin'             => 'blocks',
				'core_palette'       => true,
				'core_palette_text'  => 'Core palette must be present',
				'block_styles'       => true,
				'block_styles_text'  => 'Block styles must be present',
				'theme_palette'      => false,
				'theme_palette_text' => 'Theme palette should not be present',
				'user_palette'       => false,
				'user_palette_text'  => 'User palette should not be present',
			),
			'origin_theme'   => array(
				'origin'             => 'theme',
				'core_palette'       => true,
				'core_palette_text'  => 'Core palette must be present',
				'block_styles'       => true,
				'block_styles_text'  => 'Block styles must be present',
				'theme_palette'      => true,
				'theme_palette_text' => 'Theme palette must be present',
				'user_palette'       => false,
				'user_palette_text'  => 'User palette should not be present',
			),
			'origin_custom'  => array(
				'origin'             => 'custom',
				'core_palette'       => true,
				'core_palette_text'  => 'Core palette must be present',
				'block_styles'       => true,
				'block_styles_text'  => 'Block styles must be present',
				'theme_palette'      => true,
				'theme_palette_text' => 'Theme palette must be present',
				'user_palette'       => true,
				'user_palette_text'  => 'User palette must be present',
			),
		);
	}


	/**
	 * Test that get_style_variations returns all variations, including parent theme variations if the theme is a child,
	 * and that the child variation overwrites the parent variation of the same name.
	 *
	 * @covers WP_Theme_JSON_Resolver::get_style_variations
	 **/
	public function test_get_style_variations_returns_all_variations() {
		// Switch to a child theme.
		switch_theme( 'block-theme-child' );
		wp_set_current_user( self::$administrator_id );

		$actual_settings   = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();
		$expected_settings = array(
			array(
				'version'  => 2,
				'title'    => 'variation-a',
				'settings' => array(
					'blocks' => array(
						'core/paragraph' => array(
							'color' => array(
								'palette' => array(
									'theme' => array(
										array(
											'slug'  => 'dark',
											'name'  => 'Dark',
											'color' => '#010101',
										),
									),
								),
							),
						),
					),
				),
			),
			array(
				'version'  => 2,
				'title'    => 'variation-b',
				'settings' => array(
					'blocks' => array(
						'core/post-title' => array(
							'color' => array(
								'palette' => array(
									'theme' => array(
										array(
											'slug'  => 'light',
											'name'  => 'Light',
											'color' => '#f1f1f1',
										),
									),
								),
							),
						),
					),
				),
			),
		);
		self::recursive_ksort( $actual_settings );
		self::recursive_ksort( $expected_settings );

		$this->assertSame(
			$expected_settings,
			$actual_settings
		);
	}
}
