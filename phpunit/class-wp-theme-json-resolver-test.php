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

	function test_fields_are_extracted() {
		$actual = WP_Theme_JSON_Resolver_Gutenberg::get_fields_to_translate();

		$expected = array(
			array(
				'path'    => array( 'settings', 'typography', 'fontSizes' ),
				'key'     => 'name',
				'context' => 'Font size name',
			),
			array(
				'path'    => array( 'settings', 'typography', 'fontStyles' ),
				'key'     => 'name',
				'context' => 'Font style name',
			),
			array(
				'path'    => array( 'settings', 'typography', 'fontWeights' ),
				'key'     => 'name',
				'context' => 'Font weight name',
			),
			array(
				'path'    => array( 'settings', 'typography', 'fontFamilies' ),
				'key'     => 'name',
				'context' => 'Font family name',
			),
			array(
				'path'    => array( 'settings', 'typography', 'textTransforms' ),
				'key'     => 'name',
				'context' => 'Text transform name',
			),
			array(
				'path'    => array( 'settings', 'typography', 'textDecorations' ),
				'key'     => 'name',
				'context' => 'Text decoration name',
			),
			array(
				'path'    => array( 'settings', 'color', 'palette' ),
				'key'     => 'name',
				'context' => 'Color name',
			),
			array(
				'path'    => array( 'settings', 'color', 'gradients' ),
				'key'     => 'name',
				'context' => 'Gradient name',
			),
			array(
				'path'    => array( 'settings', 'color', 'duotone' ),
				'key'     => 'name',
				'context' => 'Duotone name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'fontSizes' ),
				'key'     => 'name',
				'context' => 'Font size name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'fontStyles' ),
				'key'     => 'name',
				'context' => 'Font style name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'fontWeights' ),
				'key'     => 'name',
				'context' => 'Font weight name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'fontFamilies' ),
				'key'     => 'name',
				'context' => 'Font family name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'textTransforms' ),
				'key'     => 'name',
				'context' => 'Text transform name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'typography', 'textDecorations' ),
				'key'     => 'name',
				'context' => 'Text decoration name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'color', 'palette' ),
				'key'     => 'name',
				'context' => 'Color name',
			),
			array(
				'path'    => array( 'settings', 'blocks', '*', 'color', 'gradients' ),
				'key'     => 'name',
				'context' => 'Gradient name',
			),
			array(
				'path'    => array( 'customTemplates' ),
				'key'     => 'title',
				'context' => 'Custom template name',
			),
		);

		$this->assertEquals( $expected, $actual );
	}

	function test_translations_are_applied() {
		add_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );
		load_textdomain( 'fse', realpath( __DIR__ . '/data/languages/themes/fse-pl_PL.mo' ) );

		switch_theme( 'fse' );

		$actual = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data();

		unload_textdomain( 'fse' );
		remove_filter( 'locale', array( $this, 'filter_set_locale_to_polish' ) );

		$this->assertSame( wp_get_theme()->get( 'TextDomain' ), 'fse' );
		$this->assertSame(
			array(
				'color'  => array(
					'palette' => array(
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
					'custom'  => false,
				),
				'blocks' => array(
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
	}

	function test_switching_themes_recalculates_data() {
		// By default, the theme for unit tests is "default",
		// which doesn't have theme.json support.
		$default = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

		// Switch to a theme that does have support.
		switch_theme( 'fse' );
		$fse = WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();

		$this->assertSame( false, $default );
		$this->assertSame( true, $fse );
	}

	function test_add_theme_supports_are_loaded_for_themes_without_theme_json() {
		switch_theme( 'default' );
		add_theme_support( 'custom-line-height' );
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
		$supports = gutenberg_get_default_block_editor_settings();
		$settings = WP_Theme_JSON_Resolver_Gutenberg::get_merged_data( $supports )->get_settings();

		$this->assertSame( false, WP_Theme_JSON_Resolver_Gutenberg::theme_has_support() );
		$this->assertSame( true, $settings['typography']['customLineHeight'] );
		$this->assertSame( $color_palette, $settings['color']['palette']['theme'] );
	}

}
