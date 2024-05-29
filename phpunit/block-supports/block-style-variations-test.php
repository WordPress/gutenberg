<?php

/**
 * Test the block style variations block support.
 *
 * @since 6.6.0
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Block_Style_Variations_Test extends WP_UnitTestCase {
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

	public function set_up() {
		parent::set_up();
		$this->theme_root = realpath( dirname( __DIR__ ) . '/data/themedir1' );

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

	/**
	 * Tests that block style variations registered via either
	 * `gutenberg_register_block_style` with a style object, or a standalone
	 * block style variation file within `/styles`, are added to the theme data.
	 */
	public function test_add_registered_block_styles_to_theme_data() {
		switch_theme( 'block-theme' );

		$variation_styles_data = array(
			'color'    => array(
				'background' => 'darkslateblue',
				'text'       => 'lavender',
			),
			'blocks'   => array(
				'core/heading' => array(
					'color' => array(
						'text' => 'violet',
					),
				),
			),
			'elements' => array(
				'link' => array(
					'color'  => array(
						'text' => 'fuchsia',
					),
					':hover' => array(
						'color' => array(
							'text' => 'deeppink',
						),
					),
				),
			),
		);

		register_block_style(
			'core/group',
			array(
				'name'       => 'my-variation',
				'style_data' => $variation_styles_data,
			)
		);

		$theme_json   = WP_Theme_JSON_Resolver_Gutenberg::get_theme_data()->get_raw_data();
		$group_styles = $theme_json['styles']['blocks']['core/group'] ?? array();
		$expected     = array(
			'variations' => array(
				'my-variation'            => $variation_styles_data,

				/*
				 * The following block style variations are registered
				 * automatically from their respective JSON files within the
				 * theme's `/styles` directory.
				 */
				'block-style-variation-a' => array(
					'color' => array(
						'background' => 'indigo',
						'text'       => 'plum',
					),
				),
				'block-style-variation-b' => array(
					'color' => array(
						'background' => 'midnightblue',
						'text'       => 'lightblue',
					),
				),
			),
		);

		unregister_block_style( 'core/group', 'my-variation' );

		$this->assertSameSetsWithIndex( $group_styles, $expected );
	}
}
