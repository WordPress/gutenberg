<?php

/**
 * Test WP_Theme_JSON_Resolver_Gutenberg class.
 *
 * @package Gutenberg
 *
 * @since 5.8.0
 */

class WP_Theme_JSON_Resolver_Gutenberg_Test extends WP_UnitTestCase {

	/**
	 * Administrator ID.
	 *
	 * @var int
	 */
	protected static $administrator_id;

	/**
	 * WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache property.
	 *
	 * @var ReflectionProperty
	 */
	private static $property_blocks_cache;

	/**
	 * Original value of the WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache property.
	 *
	 * @var array
	 */
	private static $property_blocks_cache_orig_value;

	/**
	 * WP_Theme_JSON_Resolver_Gutenberg::$core property.
	 *
	 * @var ReflectionProperty
	 */
	private static $property_core;

	/**
	 * Original value of the WP_Theme_JSON_Resolver_Gutenberg::$core property.
	 *
	 * @var WP_Theme_JSON_Gutenberg
	 */
	private static $property_core_orig_value;

	/**
	 * Theme root directory.
	 *
	 * @var string|null
	 */
	private $theme_root;

	/**
	 * Original theme directory.
	 *
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

	public static function tear_down_after_class() {
		static::$property_blocks_cache->setValue( null, static::$property_blocks_cache_orig_value );
		static::$property_core->setValue( null, static::$property_core_orig_value );
		parent::tear_down_after_class();
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

		// Reset data between tests.
		_gutenberg_clean_theme_json_caches();
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	public function filter_set_locale_to_polish() {
		return 'pl_PL';
	}

	public function test_translations_are_applied() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );
		load_textdomain( 'block-theme', realpath( __DIR__ . '/data/languages/themes/block-theme-pl_PL.mo' ) );

		switch_theme( 'block-theme' );
		$theme_data       = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();
		$style_variations = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();

		unload_textdomain( 'block-theme' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );

		$this->assertSame( 'block-theme', wp_get_theme()->get( 'TextDomain' ) );
		$this->assertSame( 'Motyw blokowy', $theme_data->get_data()['title'] );
		$this->assertSame(
			array(
				'color'      => array(
					'custom'         => false,
					'customGradient' => false,
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
					'gradients'      => array(
						'theme' => array(
							array(
								'name'     => 'Custom gradient',
								'gradient' => 'linear-gradient(135deg,rgba(0,0,0) 0%,rgb(0,0,0) 100%)',
								'slug'     => 'custom-gradient',
							),
						),
					),
					'duotone'        => array(
						'theme' => array(
							array(
								'colors' => array( '#333333', '#aaaaaa' ),
								'slug'   => 'custom-duotone',
								'name'   => 'Custom Duotone',
							),
						),
					),
				),
				'typography' => array(
					'customFontSize' => false,
					'lineHeight'     => true,
					'fontSizes'      => array(
						'theme' => array(
							array(
								'name' => 'Custom',
								'slug' => 'custom',
								'size' => '100px',
							),
						),
					),
				),
				'spacing'    => array(
					'units'    => array( 'rem' ),
					'padding'  => true,
					'blockGap' => true,
				),
				'shadow'     => array(
					'presets' => array(
						'theme' => array(
							array(
								'name'   => 'Natural',
								'slug'   => 'natural',
								'shadow' => '2px 2px 3px #000',
							),
							array(
								'name'   => 'Test',
								'slug'   => 'test',
								'shadow' => '2px 2px 3px #000',
							),
						),
					),
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
			$theme_data->get_settings()
		);

		$custom_templates = $theme_data->get_custom_templates();
		$this->assertArrayHasKey( 'page-home', $custom_templates );
		$this->assertSame(
			array(
				'title'     => 'Szablon strony głównej',
				'postTypes' => array( 'page' ),
			),
			$custom_templates['page-home']
		);

		$this->assertSameSets(
			array(
				'small-header' => array(
					'title' => 'Mały nagłówek',
					'area'  => 'header',
				),
			),
			$theme_data->get_template_parts()
		);

		$this->assertSame(
			'Wariant motywu blokowego',
			$style_variations[2]['title']
		);
	}

	private function get_registered_block_names( $hard_reset = false ) {
		static $expected_block_names;

		if ( ! $hard_reset && ! empty( $expected_block_names ) ) {
			return $expected_block_names;
		}

		$expected_block_names = array();
		$resolver             = WP_Block_Type_Registry::get_instance();
		$blocks               = $resolver->get_all_registered();
		foreach ( array_keys( $blocks ) as $block_name ) {
			$expected_block_names[ $block_name ] = true;
		}

		return $expected_block_names;
	}

	/**
	 * Tests when WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache is empty or
	 * does not match the all registered blocks.
	 *
	 * Though this is a non-public method, it is vital to other functionality.
	 * Therefore, tests are provided to validate it functions as expected.
	 *
	 * @dataProvider data_has_same_registered_blocks_when_all_blocks_not_cached
	 *
	 * @param string $origin The origin to test.
	 */
	public function test_has_same_registered_blocks_when_all_blocks_not_cached( $origin, array $cache = array() ) {
		$has_same_registered_blocks = new ReflectionMethod( WP_Theme_JSON_Resolver_Gutenberg::class, 'has_same_registered_blocks' );
		$has_same_registered_blocks->setAccessible( true );
		$expected_cache = $this->get_registered_block_names();

		// Set up the blocks cache for the origin.
		$blocks_cache            = static::$property_blocks_cache->getValue();
		$blocks_cache[ $origin ] = $cache;
		static::$property_blocks_cache->setValue( null, $blocks_cache );

		$this->assertFalse( $has_same_registered_blocks->invoke( null, $origin ), 'WP_Theme_JSON_Resolver_Gutenberg::has_same_registered_blocks() should return false when same blocks are not cached' );
		$blocks_cache = static::$property_blocks_cache->getValue();
		$this->assertSameSets( $expected_cache, $blocks_cache[ $origin ], 'WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache should contain all expected block names for the given origin' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_has_same_registered_blocks_when_all_blocks_not_cached() {
		return array(
			'origin: core; cache: empty'       => array(
				'origin' => 'core',
			),
			'origin: blocks; cache: empty'     => array(
				'origin' => 'blocks',
			),
			'origin: theme; cache: empty'      => array(
				'origin' => 'theme',
			),
			'origin: user; cache: empty'       => array(
				'origin' => 'user',
			),
			'origin: core; cache: not empty'   => array(
				'origin' => 'core',
				'cache'  => array(
					'core/block' => true,
				),
			),
			'origin: blocks; cache: not empty' => array(
				'origin' => 'blocks',
				'cache'  => array(
					'core/block'    => true,
					'core/comments' => true,
				),
			),
			'origin: theme; cache: not empty'  => array(
				'origin' => 'theme',
				'cache'  => array(
					'core/cover' => true,
				),
			),
			'origin: user; cache: not empty'   => array(
				'origin' => 'user',
				'cache'  => array(
					'core/gallery' => true,
				),
			),
		);
	}

	/**
	 * Tests when WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache is empty or
	 * does not match the all registered blocks.
	 *
	 * Though this is a non-public method, it is vital to other functionality.
	 * Therefore, tests are provided to validate it functions as expected.
	 *
	 * @dataProvider data_has_same_registered_blocks_when_all_blocks_are_cached
	 *
	 * @param string $origin The origin to test.
	 */
	public function test_has_same_registered_blocks_when_all_blocks_are_cached( $origin ) {
		$has_same_registered_blocks = new ReflectionMethod( WP_Theme_JSON_Resolver_Gutenberg::class, 'has_same_registered_blocks' );
		$has_same_registered_blocks->setAccessible( true );
		$expected_cache = $this->get_registered_block_names();

		// Set up the cache with all registered blocks.
		$blocks_cache            = static::$property_blocks_cache->getValue();
		$blocks_cache[ $origin ] = $this->get_registered_block_names();
		static::$property_blocks_cache->setValue( null, $blocks_cache );

		$this->assertTrue( $has_same_registered_blocks->invoke( null, $origin ), 'WP_Theme_JSON_Resolver_Gutenberg::has_same_registered_blocks() should return true when using the cache' );
		$this->assertSameSets( $expected_cache, $blocks_cache[ $origin ], 'WP_Theme_JSON_Resolver_Gutenberg::$blocks_cache should contain all expected block names for the given origin' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_has_same_registered_blocks_when_all_blocks_are_cached() {
		return array(
			'core'   => array( 'core' ),
			'blocks' => array( 'blocks' ),
			'theme'  => array( 'theme' ),
			'user'   => array( 'user' ),
		);
	}

	/**
	 * @dataProvider data_get_core_data
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_core_data
	 */
	public function test_get_core_data( $should_fire_filter, $core_is_cached, $blocks_are_cached ) {
		_gutenberg_clean_theme_json_caches();

		// If should cache core, then fire the method to cache it before running the tests.
		if ( $core_is_cached ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_core_data();
		}

		// If should cache registered blocks, then set them up before running the tests.
		if ( $blocks_are_cached ) {
			$blocks_cache         = static::$property_blocks_cache->getValue();
			$blocks_cache['core'] = $this->get_registered_block_names();
			static::$property_blocks_cache->setValue( null, $blocks_cache );
		}

		$expected_filter_count = did_filter( 'wp_theme_json_data_default' );
		$actual                = WP_Theme_JSON_Resolver_Gutenberg::get_core_data();
		if ( $should_fire_filter ) {
			++$expected_filter_count;
		}

		$this->assertSame( $expected_filter_count, did_filter( 'wp_theme_json_data_default' ), 'The filter "wp_theme_json_data_default" should fire the given number of times' );
		$this->assertInstanceOf( WP_Theme_JSON_Gutenberg::class, $actual, 'WP_Theme_JSON_Resolver_Gutenberg::get_core_data() should return instance of WP_Theme_JSON_Gutenberg' );
		$this->assertSame( static::$property_core->getValue(), $actual, 'WP_Theme_JSON_Resolver_Gutenberg::$core property should be the same object as returned from WP_Theme_JSON_Resolver_Gutenberg::get_core_data()' );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_core_data() {
		return array(
			'When both caches are empty'     => array(
				'should_fire_filter' => true,
				'core_is_cached'     => false,
				'blocks_are_cached'  => false,
			),
			'When the blocks_cache is not empty and matches' => array(
				'should_fire_filter' => true,
				'core_is_cached'     => false,
				'blocks_are_cached'  => true,
			),
			'When blocks_cache is empty but core cache is not' => array(
				'should_fire_filter' => true,
				'core_is_cached'     => true,
				'blocks_are_cached'  => false,
			),
			'When both caches are not empty' => array(
				'should_fire_filter' => true,
				'core_is_cached'     => true,
				'blocks_are_cached'  => false,
			),
		);
	}

	/**
	 * @covers ::add_theme_support
	 */
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
		add_theme_support( 'appearance-tools' );

		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();

		remove_theme_support( 'custom-line-height' );
		remove_theme_support( 'editor-color-palette' );
		remove_theme_support( 'appearance-tools' );

		$this->assertFalse( wp_theme_has_theme_json() );
		$this->assertTrue( $settings['typography']['lineHeight'] );
		$this->assertSame( $color_palette, $settings['color']['palette']['theme'] );
		$this->assertTrue( $settings['border']['color'], 'Support for "appearance-tools" was not added.' );
	}

	/**
	 * Tests that classic themes still get core default settings such as color palette and duotone.
	 */
	public function test_core_default_settings_are_loaded_for_themes_without_theme_json() {
		switch_theme( 'default' );

		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( 'theme' )->get_settings();

		$this->assertFalse( wp_theme_has_theme_json() );
		$this->assertTrue( $settings['color']['defaultPalette'] );
		$this->assertTrue( $settings['color']['defaultDuotone'] );
		$this->assertTrue( $settings['color']['defaultGradients'] );
	}

	public function test_merges_child_theme_json_into_parent_theme_json() {
		switch_theme( 'block-theme-child' );

		$actual_settings   = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_settings();
		$expected_settings = array(
			'color'      => array(
				'custom'         => false,
				'customGradient' => false,
				'duotone'        => array(
					'theme' => array(
						array(
							'colors' => array( '#333333', '#aaaaaa' ),
							'name'   => 'Custom Duotone',
							'slug'   => 'custom-duotone',
						),
					),
				),
				'gradients'      => array(
					'theme' => array(
						array(
							'name'     => 'Custom gradient',
							'gradient' => 'linear-gradient(135deg,rgba(0,0,0) 0%,rgb(0,0,0) 100%)',
							'slug'     => 'custom-gradient',
						),
					),
				),
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
				'customFontSize' => false,
				'lineHeight'     => true,
				'fontSizes'      => array(
					'theme' => array(
						array(
							'name' => 'Custom',
							'slug' => 'custom',
							'size' => '100px',
						),
					),
				),
			),
			'shadow'     => array(
				'presets' => array(
					'theme' => array(
						array(
							'name'   => 'Natural',
							'slug'   => 'natural',
							'shadow' => '2px 2px 3px #000',
						),
						array(
							'name'   => 'Test',
							'slug'   => 'test',
							'shadow' => '2px 2px 3px #000',
						),
					),
				),
			),
			'spacing'    => array(
				'blockGap' => true,
				'units'    => array( 'rem' ),
				'padding'  => true,
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
		wp_recursive_ksort( $actual_settings );
		wp_recursive_ksort( $expected_settings );

		// Should merge settings.
		$this->assertSame(
			$expected_settings,
			$actual_settings
		);

		$this->assertSame(
			array(
				'page-home'                   => array(
					'title'     => 'Homepage',
					'postTypes' => array( 'page' ),
				),
				'custom-single-post-template' => array(
					'title'     => 'Custom Single Post template',
					'postTypes' => array( 'post' ),
				),
			),
			WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_custom_templates()
		);
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_does_not_use_uncached_queries() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		wp_set_current_user( self::$administrator_id );
		$theme = wp_get_theme();
		WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$global_styles_query_count = 0;
		add_filter(
			'query',
			static function ( $query ) use ( &$global_styles_query_count ) {
				if ( preg_match( '#post_type = \'wp_global_styles\'#', $query ) ) {
					$global_styles_query_count++;
				}
				return $query;
			}
		);
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			_gutenberg_clean_theme_json_caches();
		}
		$this->assertSame( 0, $global_styles_query_count, 'Unexpected SQL queries detected for the wp_global_style post type prior to creation.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertNotEmpty( $user_cpt, 'User CPT is expected not to be empty.' );

		$global_styles_query_count = 0;
		for ( $i = 0; $i < 3; $i++ ) {
			$new_user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			_gutenberg_clean_theme_json_caches();
			$this->assertSameSets( $user_cpt, $new_user_cpt, "User CPTs do not match on run {$i}." );
		}
		$this->assertSame( 1, $global_styles_query_count, 'Unexpected SQL queries detected for the wp_global_style post type after creation.' );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_does_not_use_uncached_queries_for_logged_out_users() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$theme = wp_get_theme();
		WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$query_count = get_num_queries();
		for ( $i = 0; $i < 3; $i++ ) {
			WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
			_gutenberg_clean_theme_json_caches();
		}
		$query_count = get_num_queries() - $query_count;
		$this->assertSame( 0, $query_count, 'Unexpected SQL queries detected for the wp_global_style post type prior to creation.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_does_not_run_for_theme_without_support() {
		// The 'default' theme does not support theme.json.
		switch_theme( 'default' );
		wp_set_current_user( self::$administrator_id );
		$theme = wp_get_theme();

		$start_queries = get_num_queries();

		// When theme.json is not supported, the method should not run a query and always return an empty result.
		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );
		$this->assertSame( 0, get_num_queries() - $start_queries, 'Unexpected SQL query detected for theme without theme.json support.' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertEmpty( $user_cpt, 'User CPT is expected to be empty.' );
		$this->assertSame( 0, get_num_queries() - $start_queries, 'Unexpected SQL query detected for theme without theme.json support.' );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_does_exist() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$theme = wp_get_theme();
		$post1 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertIsArray( $post1 );
		$this->assertArrayHasKey( 'ID', $post1 );
		wp_delete_post( $post1['ID'], true );
		$post2 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertIsArray( $post2 );
		$this->assertArrayHasKey( 'ID', $post2 );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_create_post() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$theme = wp_get_theme( 'testing' );
		$post1 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertIsArray( $post1 );
		$this->assertSameSets( array(), $post1 );
		$post2 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme );
		$this->assertIsArray( $post2 );
		$this->assertSameSets( array(), $post2 );
		$post3 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true );
		$this->assertIsArray( $post3 );
		$this->assertArrayHasKey( 'ID', $post3 );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles
	 */
	public function test_get_user_data_from_wp_global_styles_filter_state() {
		// Switch to a theme that does have support.
		switch_theme( 'block-theme' );
		$theme = wp_get_theme( 'foo' );
		$post1 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, true, array( 'publish' ) );
		$this->assertIsArray( $post1 );
		$this->assertArrayHasKey( 'ID', $post1 );
		$post2 = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( $theme, false, array( 'draft' ) );
		$this->assertIsArray( $post2 );
		$this->assertSameSets( array(), $post2 );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_theme_data
	 */
	public function test_get_theme_data_theme_supports_overrides_theme_json() {
		switch_theme( 'default' );

		// Test that get_theme_data() returns a WP_Theme_JSON_Gutenberg object.
		$theme_json_resolver = new WP_Theme_JSON_Resolver_Gutenberg();
		$theme_json_resolver->get_merged_data();
		$theme_data = $theme_json_resolver->get_theme_data();
		$this->assertInstanceOf( 'WP_Theme_JSON_Gutenberg', $theme_data, 'Theme data should be an instance of WP_Theme_JSON_Gutenberg.' );

		// Test that wp_theme_json_data_theme filter has been called.
		$this->assertGreaterThan( 0, did_filter( 'wp_theme_json_data_default' ), 'The filter "wp_theme_json_data_default" should fire.' );

		// Test that data from theme.json is backfilled from existing theme supports.
		$previous_settings    = $theme_data->get_settings();
		$previous_line_height = $previous_settings['typography']['lineHeight'];
		$this->assertFalse( $previous_line_height, 'lineHeight setting from theme.json should be false.' );

		add_theme_support( 'custom-line-height' );
		$current_settings = $theme_json_resolver->get_theme_data()->get_settings();
		$line_height      = $current_settings['typography']['lineHeight'];
		$this->assertTrue( $line_height, 'lineHeight setting after add_theme_support() should be true.' );
		remove_theme_support( 'custom-line-height' );
	}

	/**
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_theme_data
	 */
	public function test_get_theme_data_does_not_parse_theme_json_if_not_present() {
		// The 'default' theme does not support theme.json.
		switch_theme( 'default' );

		$theme_json_resolver = new WP_Theme_JSON_Resolver_Gutenberg();

		// Force-unset $i18n_schema property to "unload" translation schema.
		$property = new ReflectionProperty( $theme_json_resolver, 'i18n_schema' );
		$property->setAccessible( true );
		$property->setValue( null, null );

		// A completely empty theme.json data set still has the 'version' key when parsed.
		$empty_theme_json = array( 'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA );

		// Call using 'with_supports' set to false, so that the method only considers theme.json.
		$theme_data = $theme_json_resolver->get_theme_data( array(), array( 'with_supports' => false ) );
		$this->assertInstanceOf( 'WP_Theme_JSON_Gutenberg', $theme_data, 'Theme data should be an instance of WP_Theme_JSON_Gutenberg.' );
		$this->assertSame( $empty_theme_json, $theme_data->get_raw_data(), 'Theme data should be empty without theme support.' );
		$this->assertNull( $property->getValue(), 'Theme i18n schema should not have been loaded without theme support.' );
	}

	/**
	 * Tests that get_merged_data returns the data merged up to the proper origin.
	 *
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_merged_data
	 *
	 * @dataProvider data_get_merged_data_returns_origin
	 *
	 * @param string $origin             What origin to get data from.
	 * @param bool   $core_palette       Whether the core palette is present.
	 * @param string $core_palette_text  Message.
	 * @param string $block_styles       Whether the block styles are present.
	 * @param string $block_styles_text  Message.
	 * @param bool   $theme_palette      Whether the theme palette is present.
	 * @param string $theme_palette_text Message.
	 * @param bool   $user_palette       Whether the user palette is present.
	 * @param string $user_palette_text  Message.
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
		$styles     = array_filter(
			$styles,
			static function ( $element ) {
				return isset( $element['name'] ) && 'my/block-with-styles' === $element['name'];
			}
		);
		unregister_block_type( 'my/block-with-styles' );

		$this->assertSame( $core_palette, isset( $settings['color']['palette']['default'] ), $core_palette_text );
		$this->assertSame( $block_styles, count( $styles ) === 1, $block_styles_text );
		$this->assertSame( $theme_palette, isset( $settings['color']['palette']['theme'] ), $theme_palette_text );
		$this->assertSame( $user_palette, isset( $settings['color']['palette']['custom'] ), $user_palette_text );
	}

	/**
	 * Tests that get_merged_data returns the data merged up to the proper origin
	 * and that the core values have the proper data.
	 *
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_merged_data
	 */
	public function test_get_merged_data_returns_origin_proper() {
		// Make sure the theme has a theme.json
		// though it doesn't have any data for styles.spacing.padding.
		switch_theme( 'block-theme' );

		// Make sure the user defined some data for styles.spacing.padding.
		wp_set_current_user( self::$administrator_id );
		$user_cpt                               = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );
		$config                                 = json_decode( $user_cpt['post_content'], true );
		$config['styles']['spacing']['padding'] = array(
			'top'    => '23px',
			'left'   => '23px',
			'bottom' => '23px',
			'right'  => '23px',
		);
		$user_cpt['post_content']               = wp_json_encode( $config );
		wp_update_post( $user_cpt, true, false );

		// Query data from the user origin and then for the theme origin.
		$theme_json_user  = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( 'custom' );
		$padding_user     = $theme_json_user->get_raw_data()['styles']['spacing']['padding'];
		$theme_json_theme = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( 'theme' );
		$padding_theme    = $theme_json_theme->get_raw_data()['styles']['spacing']['padding'];

		$this->assertSame( '23px', $padding_user['top'] );
		$this->assertSame( '23px', $padding_user['right'] );
		$this->assertSame( '23px', $padding_user['bottom'] );
		$this->assertSame( '23px', $padding_user['left'] );
		$this->assertSame( '0px', $padding_theme['top'] );
		$this->assertSame( '0px', $padding_theme['right'] );
		$this->assertSame( '0px', $padding_theme['bottom'] );
		$this->assertSame( '0px', $padding_theme['left'] );
	}

	/**
	 * Data provider for test_get_merged_data_returns_origin.
	 *
	 * @return array[]
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
	 * Tests that get_style_variations returns all variations, including parent theme variations if the theme is a child,
	 * and that the child variation overwrites the parent variation of the same name.
	 *
	 * @covers WP_Theme_JSON_Resolver_Gutenberg::get_style_variations
	 */
	public function test_get_style_variations_returns_all_variations() {
		// Switch to a child theme.
		switch_theme( 'block-theme-child' );
		wp_set_current_user( self::$administrator_id );

		$actual_settings   = WP_Theme_JSON_Resolver_Gutenberg::get_style_variations();
		$expected_settings = array(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
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
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'title'    => 'variation-b',
				'settings' => array(
					'blocks' => array(
						'core/post-title' => array(
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
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'title'    => 'Block theme variation',
				'settings' => array(
					'color' => array(
						'palette' => array(
							'theme' => array(
								array(
									'slug'  => 'foreground',
									'name'  => 'Foreground',
									'color' => '#3F67C6',
								),
							),
						),
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/post-title' => array(
							'typography' => array(
								'fontWeight' => '700',
							),
						),
					),
				),
			),
		);

		wp_recursive_ksort( $actual_settings );
		wp_recursive_ksort( $expected_settings );

		$this->assertSame(
			$expected_settings,
			$actual_settings
		);
	}

	public function test_theme_shadow_presets_do_not_override_default_shadow_presets() {
		switch_theme( 'block-theme' );

		$theme_json_resolver = new WP_Theme_JSON_Resolver_Gutenberg();
		$theme_json          = $theme_json_resolver->get_merged_data();
		$actual_settings     = $theme_json->get_settings()['shadow']['presets'];

		$expected_settings = array(
			'default' => array(
				array(
					'name'   => 'Natural',
					'shadow' => '6px 6px 9px rgba(0, 0, 0, 0.2)',
					'slug'   => 'natural',
				),
				array(
					'name'   => 'Deep',
					'shadow' => '12px 12px 50px rgba(0, 0, 0, 0.4)',
					'slug'   => 'deep',
				),
				array(
					'name'   => 'Sharp',
					'shadow' => '6px 6px 0px rgba(0, 0, 0, 0.2)',
					'slug'   => 'sharp',
				),
				array(
					'name'   => 'Outlined',
					'shadow' => '6px 6px 0px -3px rgba(255, 255, 255, 1), 6px 6px rgba(0, 0, 0, 1)',
					'slug'   => 'outlined',
				),
				array(
					'name'   => 'Crisp',
					'shadow' => '6px 6px 0px rgba(0, 0, 0, 1)',
					'slug'   => 'crisp',
				),
			),
			'theme'   => array(
				array(
					'name'   => 'Test',
					'shadow' => '2px 2px 3px #000',
					'slug'   => 'test',
				),
			),
		);

		wp_recursive_ksort( $actual_settings );
		wp_recursive_ksort( $expected_settings );

		$this->assertSame(
			$expected_settings,
			$actual_settings
		);
	}

	public function test_shadow_default_presets_value_for_block_and_classic_themes() {
		$theme_json_resolver = new WP_Theme_JSON_Resolver_Gutenberg();
		$theme_json          = $theme_json_resolver->get_merged_data();

		$default_presets_for_classic = $theme_json->get_settings()['shadow']['defaultPresets'];
		$this->assertFalse( $default_presets_for_classic );

		switch_theme( 'block-theme' );
		$theme_json_resolver = new WP_Theme_JSON_Resolver_Gutenberg();
		$theme_json          = $theme_json_resolver->get_merged_data();

		$default_presets_for_block = $theme_json->get_settings()['shadow']['defaultPresets'];
		$this->assertTrue( $default_presets_for_block );
	}
}
