<?php
/**
 * Core block theme tests.
 *
 * @package Gutenberg
 */

/**
 * Test inclusion of opt-in core block theme.
 */
class Core_Block_Theme_Test extends WP_UnitTestCase {
	private $old_wp_styles;
	private $old_wp_scripts;

	function setUp() {
		parent::setUp();

		$this->old_wp_scripts = isset( $GLOBALS['wp_scripts'] ) ? $GLOBALS['wp_scripts'] : null;
		remove_action( 'wp_default_scripts', 'wp_default_scripts' );

		$GLOBALS['wp_scripts']                  = new WP_Scripts();
		$GLOBALS['wp_scripts']->default_version = get_bloginfo( 'version' );

		$this->old_wp_styles = isset( $GLOBALS['wp_styles'] ) ? $GLOBALS['wp_styles'] : null;
		remove_action( 'wp_default_styles', 'wp_default_styles' );

		$GLOBALS['wp_styles']                  = new WP_Styles();
		$GLOBALS['wp_styles']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		$GLOBALS['wp_scripts'] = $this->old_wp_scripts;
		add_action( 'wp_default_scripts', 'wp_default_scripts' );

		$GLOBALS['wp_styles'] = $this->old_wp_styles;
		add_action( 'wp_default_styles', 'wp_default_styles' );

		if ( current_theme_supports( 'wp-block-styles' ) ) {
			remove_theme_support( 'wp-block-styles' );
		}

		parent::tearDown();
	}

	function test_block_theme_in_editor_without_theme_support() {
		// Confirm we are without theme support by default.
		$this->assertFalse( current_theme_supports( 'wp-block-styles' ) );

		gutenberg_register_scripts_and_styles();

		$this->assertFalse( wp_style_is( 'wp-core-blocks-theme' ) );
		wp_enqueue_style( 'wp-edit-blocks' );
		$this->assertTrue( wp_style_is( 'wp-core-blocks-theme' ) );
	}

	function test_block_theme_in_editor_with_theme_support() {
		add_theme_support( 'wp-block-styles' );
		gutenberg_register_scripts_and_styles();

		$this->assertFalse( wp_style_is( 'wp-core-blocks-theme' ) );
		wp_enqueue_style( 'wp-edit-blocks' );
		$this->assertTrue( wp_style_is( 'wp-core-blocks-theme' ) );
	}

	function test_no_block_theme_on_front_end_without_theme_support() {
		// Confirm we are without theme support by default.
		$this->assertFalse( current_theme_supports( 'wp-block-styles' ) );

		gutenberg_register_scripts_and_styles();

		$this->assertFalse( wp_style_is( 'wp-core-blocks-theme' ) );
		wp_enqueue_style( 'wp-core-blocks' );
		$this->assertFalse( wp_style_is( 'wp-core-blocks-theme' ) );
	}

	function test_block_theme_on_front_end_with_theme_support() {
		add_theme_support( 'wp-block-styles' );

		gutenberg_register_scripts_and_styles();

		$this->assertFalse( wp_style_is( 'wp-core-blocks-theme' ) );
		wp_enqueue_style( 'wp-core-blocks' );
		$this->assertTrue( wp_style_is( 'wp-core-blocks-theme' ) );
	}
}
