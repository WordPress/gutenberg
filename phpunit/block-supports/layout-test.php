<?php

/**
 * Test the block layout support.
 *
 * @package Gutenberg
 */

class WP_Block_Supports_Layout_Test extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->theme_root     = realpath( __DIR__ . '/../data/themedir1' );
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

	function test_outer_container_not_restored_for_non_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(),
		);
		$block_content = '<figure class="wp-block-image size-full"><img src="/my-image.jpg"/></figure>';
		$expected      = '<figure class="wp-block-image size-full"><img src="/my-image.jpg"/></figure>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}

	function test_outer_container_restored_for_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(),
		);
		$block_content = '<figure class="wp-block-image alignright size-full"><img src="/my-image.jpg"/></figure>';
		$expected      = '<div class="wp-block-image"><figure class="alignright size-full"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}

	function test_additional_styles_moved_to_restored_outer_container_for_aligned_image_block_with_non_themejson_theme() {
		// The "default" theme doesn't have theme.json support.
		switch_theme( 'default' );
		$block = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'className' => 'is-style-round my-custom-classname',
			),
		);

		$block_classes_end_placement    = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';
		$block_classes_start_placement  = '<figure class="is-style-round my-custom-classname wp-block-image alignright size-full"><img src="/my-image.jpg"/></figure>';
		$block_classes_middle_placement = '<figure class="wp-block-image is-style-round my-custom-classname alignright size-full"><img src="/my-image.jpg"/></figure>';
		$block_classes_random_placement = '<figure class="is-style-round wp-block-image alignright my-custom-classname size-full"><img src="/my-image.jpg"/></figure>';
		$expected                       = '<div class="wp-block-image is-style-round my-custom-classname"><figure class="alignright size-full"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_end_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_start_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_middle_placement, $block ) );
		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_classes_random_placement, $block ) );

		$block_classes_other_attributes = '<figure style="color: red" class=\'is-style-round wp-block-image alignright my-custom-classname size-full\' data-random-tag=">"><img src="/my-image.jpg"/></figure>';
		$expected_other_attributes      = '<div class="wp-block-image is-style-round my-custom-classname"><figure style="color: red" class=\'alignright size-full\' data-random-tag=">"><img src="/my-image.jpg"/></figure></div>';

		$this->assertSame( $expected_other_attributes, gutenberg_restore_image_outer_container( $block_classes_other_attributes, $block ) );
	}

	function test_outer_container_not_restored_for_aligned_image_block_with_themejson_theme() {
		switch_theme( 'block-theme' );
		$block         = array(
			'blockName' => 'core/image',
			'attrs'     => array(
				'className' => 'is-style-round my-custom-classname',
			),
		);
		$block_content = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';
		$expected      = '<figure class="wp-block-image alignright size-full is-style-round my-custom-classname"><img src="/my-image.jpg"/></figure>';

		$this->assertSame( $expected, gutenberg_restore_image_outer_container( $block_content, $block ) );
	}
}
