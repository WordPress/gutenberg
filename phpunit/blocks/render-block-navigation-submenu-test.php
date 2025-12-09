<?php
/**
 * Tests server side rendering of core/navigation-submenu
 *
 * @package    Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for various cases in Navigation Submenu rendering
 */
class Render_Block_Navigation_Submenu_Test extends WP_UnitTestCase {
	private static $category;
	private static $page;
	private static $draft;
	private static $custom_draft;
	private static $custom_post;


	/**
	 * @var array|null
	 */
	private $original_block_supports;

	public static function set_up_before_class() {
		self::$page = self::factory()->post->create_and_get(
			array(
				'post_type'    => 'page',
				'post_status'  => 'publish',
				'post_name'    => 'tabby',
				'post_title'   => 'Tabby cats',
				'post_content' => 'Tabby cat content',
				'post_excerpt' => 'Tabby cat',
			)
		);
	}

	public function set_up() {
		parent::set_up();

		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'attrs'     => array(),
			'blockName' => '',
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_apply_preset_colors_inherited_from_parent_block_via_context() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Colors inherited from parent Navigation block - use new submenu attributes.
		$context = array(
			'submenuTextColor'       => 'purple',
			'submenuBackgroundColor' => 'yellow',
		);

		$navigation_submenu_block = new WP_Block( $block, $context );

		$rendered_html = gutenberg_render_block_core_navigation_submenu(
			$navigation_submenu_block->attributes,
			array(),
			$navigation_submenu_block
		);

		$tags = new WP_HTML_Tag_Processor( $rendered_html );
		$tags->next_tag(
			array(
				'tag_name'   => 'ul',
				'class_name' => 'wp-block-navigation__submenu-container',
			)
		);
		$tags->get_attribute( 'class' );

		$this->assertEquals(
			'wp-block-navigation__submenu-container has-text-color has-purple-color has-background has-yellow-background-color',
			$tags->get_attribute( 'class' ),
			'Submenu block colors inherited from context not applied correctly'
		);
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_apply_custom_colors_inherited_from_parent_block_via_context() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Colors inherited from parent Navigation block - use new submenu attributes.
		$context = array(
			'customSubmenuTextColor'       => '#BCC60A',
			'customSubmenuBackgroundColor' => '#E10E0E',
		);

		$navigation_submenu_block = new WP_Block( $block, $context );

		$this->assertStringContainsString(
			'<ul style="color:' . $context['customSubmenuTextColor'] . ';background-color:' . $context['customSubmenuBackgroundColor'] . ';" class="wp-block-navigation__submenu-container has-text-color has-background">',
			gutenberg_render_block_core_navigation_submenu(
				$navigation_submenu_block->attributes,
				array(),
				$navigation_submenu_block
			),
			'Submenu block colors inherited from context not applied correctly'
		);
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_apply_mix_of_preset_and_custom_colors_inherited_from_parent_block_via_context() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Colors inherited from parent Navigation block - use new submenu attributes.
		$context = array(
			'submenuTextColor'             => 'purple',
			'customSubmenuBackgroundColor' => '#E10E0E',
		);

		$navigation_submenu_block = new WP_Block( $block, $context );

		$this->assertStringContainsString(
			'<ul style="background-color:' . $context['customSubmenuBackgroundColor'] . ';" class="wp-block-navigation__submenu-container has-text-color has-' . $context['submenuTextColor'] . '-color has-background">',
			gutenberg_render_block_core_navigation_submenu(
				$navigation_submenu_block->attributes,
				array(),
				$navigation_submenu_block
			),
			'Submenu block colors inherited from context not applied correctly'
		);
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_not_apply_custom_colors_if_missing_from_context() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Intentionally empty - no colors.
		$context = array();

		$navigation_submenu_block = new WP_Block( $block, $context );

		$actual = gutenberg_render_block_core_navigation_submenu(
			$navigation_submenu_block->attributes,
			array(),
			$navigation_submenu_block
		);

		$this->assertStringContainsString(
			'<ul class="wp-block-navigation__submenu-container">',
			$actual,
			'Submenu block should not apply colors if missing from context'
		);

		$this->assertStringNotContainsString(
			'has-text-color has-background',
			$actual,
			'Submenu block should not apply "has-*" color classes if missing from context'
		);
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_fallback_to_legacy_overlay_colors_for_unmigrated_blocks() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Legacy unmigrated block - only has old overlay attributes, no new attributes.
		$context = array(
			'overlayTextColor'       => 'purple',
			'overlayBackgroundColor' => 'yellow',
		);

		$navigation_submenu_block = new WP_Block( $block, $context );

		$rendered_html = gutenberg_render_block_core_navigation_submenu(
			$navigation_submenu_block->attributes,
			array(),
			$navigation_submenu_block
		);

		$tags = new WP_HTML_Tag_Processor( $rendered_html );
		$tags->next_tag(
			array(
				'tag_name'   => 'ul',
				'class_name' => 'wp-block-navigation__submenu-container',
			)
		);
		$tags->get_attribute( 'class' );

		$this->assertEquals(
			'wp-block-navigation__submenu-container has-text-color has-purple-color has-background has-yellow-background-color',
			$tags->get_attribute( 'class' ),
			'Submenu block should fall back to legacy overlay colors for unmigrated blocks'
		);
	}

	/**
	 * @group submenu-color-inheritance
	 * @covers ::gutenberg_render_block_core_navigation_submenu
	 */
	public function test_should_not_fallback_to_overlay_colors_when_submenu_colors_cleared_in_migrated_block() {
		$page_id = self::$page->ID;

		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-submenu {"label":"Submenu Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} -->
            <!-- wp:navigation-link {"label":"Submenu Item Link Label","type":"page","id":' . $page_id . ',"url":"http://localhost:8888/?page_id=' . $page_id . '","kind":"post-type"} /-->
        <!-- /wp:navigation-submenu -->'
		);

		$this->assertEquals( 1, count( $parsed_blocks ), 'Submenu block not parsable.' );

		$block = $parsed_blocks[0];

		// Migrated block - has new overlay attributes but submenu colors are not set (cleared).
		$context = array(
			'defaultOverlayTextColor'       => 'purple',
			'defaultOverlayBackgroundColor' => 'yellow',
			// submenuTextColor and submenuBackgroundColor are intentionally not set.
		);

		$navigation_submenu_block = new WP_Block( $block, $context );

		$rendered_html = gutenberg_render_block_core_navigation_submenu(
			$navigation_submenu_block->attributes,
			array(),
			$navigation_submenu_block
		);

		// Should not have submenu color classes since submenu colors are not set.
		$this->assertStringNotContainsString(
			'has-purple-color',
			$rendered_html,
			'Submenu should not use overlay colors when submenu colors are cleared in migrated block'
		);
		$this->assertStringNotContainsString(
			'has-yellow-background-color',
			$rendered_html,
			'Submenu should not use overlay background colors when submenu colors are cleared in migrated block'
		);
	}
}
