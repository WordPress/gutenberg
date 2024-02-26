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
	 * @covers ::gutenberg_block_core_navigation_from_block_get_post_ids
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
	 * @covers ::gutenberg_block_core_navigation_from_block_get_post_ids
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
	 * @covers ::gutenberg_block_core_navigation_from_block_get_post_ids
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
	 * @covers :: block_core_navigation_block_contains_core_navigation
	 */
	public function test_block_core_navigation_block_contains_core_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:navigation /-->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( block_core_navigation_block_contains_core_navigation( $inner_blocks ) );
	}

	public function test_block_core_navigation_block_contains_core_navigation_deep() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- /wp:group --><!-- wp:group --><!-- wp:group --><!-- wp:navigation /--><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( block_core_navigation_block_contains_core_navigation( $inner_blocks ) );
	}

	public function test_block_core_navigation_block_contains_core_navigation_no_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- wp:group --><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertFalse( block_core_navigation_block_contains_core_navigation( $inner_blocks ) );
	}
}
