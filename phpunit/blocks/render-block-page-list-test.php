<?php
/**
 * Tests server side rendering of core/page-list
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for various cases in Page List rendering
 */
class Render_Block_Page_List_Test extends WP_UnitTestCase {
	private static $parent_page;
	private static $child_page;

	public static function set_up_before_class() {
		self::$parent_page = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => 'parent-page',
				'post_title'   => 'Parent Page',
				'post_content' => 'Parent page content',
			)
		);

		self::$child_page = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => 'child-page',
				'post_title'   => 'Child Page',
				'post_content' => 'Child page content',
				'post_parent'  => self::$parent_page->ID,
			)
		);
	}

	/**
	 * @group page-list-colors
	 * @covers ::gutenberg_block_core_page_list_build_css_colors
	 */
	public function test_should_apply_submenu_colors_from_context() {
		$attributes = array();
		$context    = array(
			'submenuTextColor'       => 'purple',
			'submenuBackgroundColor' => 'yellow',
		);

		$colors = gutenberg_block_core_page_list_build_css_colors( $attributes, $context );

		$this->assertContains( 'has-text-color', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-purple-color', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-background', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-yellow-background-color', $colors['submenu_css_classes'] );
	}

	/**
	 * @group page-list-colors
	 * @covers ::gutenberg_block_core_page_list_build_css_colors
	 */
	public function test_should_fallback_to_legacy_overlay_colors_for_unmigrated_blocks() {
		$attributes = array();
		// Unmigrated block - only has legacy overlay attributes, no new attributes.
		$context = array(
			'overlayTextColor'       => 'purple',
			'overlayBackgroundColor' => 'yellow',
		);

		$colors = gutenberg_block_core_page_list_build_css_colors( $attributes, $context );

		// Submenu should fall back to legacy overlay colors.
		$this->assertContains( 'has-text-color', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-purple-color', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-background', $colors['submenu_css_classes'] );
		$this->assertContains( 'has-yellow-background-color', $colors['submenu_css_classes'] );
	}

	/**
	 * @group page-list-colors
	 * @covers ::gutenberg_block_core_page_list_build_css_colors
	 */
	public function test_should_not_fallback_to_overlay_colors_when_submenu_colors_cleared_in_migrated_block() {
		$attributes = array();
		// Migrated block - has new overlay attributes but submenu colors are not set.
		$context = array(
			'defaultOverlayTextColor'       => 'purple',
			'defaultOverlayBackgroundColor' => 'yellow',
			// submenuTextColor and submenuBackgroundColor are intentionally not set.
		);

		$colors = gutenberg_block_core_page_list_build_css_colors( $attributes, $context );

		// Submenu should not have color classes since submenu colors are not set and we shouldn't fall back.
		$this->assertEmpty( $colors['submenu_css_classes'] );
		$this->assertEmpty( $colors['submenu_inline_styles'] );
	}

	/**
	 * @group page-list-colors
	 * @covers ::gutenberg_block_core_page_list_build_css_colors
	 */
	public function test_should_not_build_overlay_colors() {
		$attributes = array();
		$context    = array(
			'defaultOverlayTextColor'       => 'purple',
			'defaultOverlayBackgroundColor' => 'yellow',
		);

		$colors = gutenberg_block_core_page_list_build_css_colors( $attributes, $context );

		// Page-list doesn't render overlays, so overlay colors should not be built.
		$this->assertArrayNotHasKey( 'overlay_css_classes', $colors );
		$this->assertArrayNotHasKey( 'overlay_inline_styles', $colors );
	}
}

