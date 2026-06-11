<?php
/**
 * Navigation block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation block.
 *
 * @group blocks
 */
class Render_Block_Navigation_Test extends WP_UnitTestCase {
	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-link {"label":"Sample Page","type":"page","kind":"post-type","id":755,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=755"} /-->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSets( array( 755 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block_nested() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:group -->
					<!-- wp:navigation-link {"label":"Sample Page","type":"page","id":20,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=20","kind":"post-type","isTopLevelLink":true} /-->
					<!-- wp:navigation-link {"label":"Hello world!","type":"post","id":10,"url":"http://' . WP_TESTS_DOMAIN . '/?p=10","kind":"post-type","isTopLevelLink":true} /-->
					<!-- wp:navigation-submenu {"label":"Uncategorized","type":"category","id":1,"url":"http://' . WP_TESTS_DOMAIN . '/?cat=1","kind":"taxonomy","isTopLevelItem":true} -->
					<!-- wp:navigation-link {"label":"Sample Page","type":"page","id":30,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=30","kind":"post-type","isTopLevelLink":false} /-->
					<!-- wp:navigation-submenu {"label":"Hello world!","type":"post","id":40,"url":"http://' . WP_TESTS_DOMAIN . '/?p=40","kind":"post-type","isTopLevelItem":false} -->
					<!-- wp:navigation-link {"label":"Uncategorized","type":"category","id":5,"url":"http://' . WP_TESTS_DOMAIN . '/?cat=5","kind":"taxonomy","isTopLevelLink":false} /-->
					<!-- wp:navigation-link {"label":"Hello world!","type":"post","id":60,"url":"http:/' . WP_TESTS_DOMAIN . '/?p=60","kind":"post-type","isTopLevelLink":false} /-->
					<!-- /wp:navigation-submenu -->
					<!-- /wp:navigation-submenu -->
					<!-- /wp:group -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSets( array( 40, 60, 10, 20, 30 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block_with_submenu() {
		$parsed_blocks = parse_blocks( '<!-- wp:navigation-submenu {"label":"Test","type":"post","id":789,"url":"http://' . WP_TESTS_DOMAIN . '/blog/test-3","kind":"post-type","isTopLevelItem":true} -->\n<!-- wp:navigation-link {"label":"(no title)","type":"post","id":755,"url":"http://' . WP_TESTS_DOMAIN . '/blog/755","kind":"post-type","isTopLevelLink":false} /-->\n<!-- /wp:navigation-submenu -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSetsWithIndex( array( 755, 789 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:navigation /-->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation_deep() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- /wp:group --><!-- wp:group --><!-- wp:group --><!-- wp:navigation /--><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation_no_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- wp:group --><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertFalse( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_adds_low_priority() {
		$html   = '<div><img src="example.jpg" width="300" height="300" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
		$this->assertNull( $tags->get_attribute( 'loading' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_overrides_high_priority() {
		$html   = '<div><img src="example.jpg" fetchpriority="high" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_multiple_images() {
		$html   = '<div><img src="a.jpg" /><img src="b.jpg" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_no_images() {
		$html   = '<div><p>No images here</p></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$this->assertSame( $html, $result );
	}

	/**
	 * Test that original markup is returned when there are no state classes.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_no_state_class_preserves_block_markup() {
		$block_content = '<nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that Navigation state classes are copied to inner list containers.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_state_class_is_added_to_inner_list_container() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Item</li></ul></nav>',
			$actual
		);
	}

	/**
	 * Test that non-Navigation blocks are unchanged.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_state_class_is_not_added_to_non_navigation_blocks() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/group' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that existing inner state classes are preserved.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_existing_inner_state_class_is_preserved() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that Navigation state classes are copied to multiple inner list containers.
	 *
	 * Navigation can emit more than one list container when listable menu items
	 * are separated by non-listable blocks.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_state_class_is_added_to_multiple_inner_list_containers() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Two</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Two</li></ul></nav>',
			$actual
		);
	}

	/**
	 * Test that Navigation state classes are not copied to nested Navigation blocks.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_state_class_is_not_added_to_nested_navigation_containers() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>',
			$actual
		);
	}

	/**
	 * Test that nested Navigation blocks preserve their own state classes.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_state_class_to_container
	 */
	public function test_nested_navigation_preserves_its_own_state_class() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation wp-states-abcd1234"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_state_class_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation wp-states-abcd1234"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>',
			$actual
		);
	}
}
