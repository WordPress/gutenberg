<?php
/**
 * Page List block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Page List block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Page_List extends WP_UnitTestCase {

	/**
	 * @var int[]
	 */
	private static $page_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$page_ids['about'] = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Page List test About',
				'menu_order' => 1,
			)
		);
		self::$page_ids['team']  = $factory->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Page List test Team',
				'post_parent' => self::$page_ids['about'],
			)
		);
		self::$page_ids['shop']  = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Page List test Shop',
				'menu_order' => 2,
			)
		);
	}

	private function render_page_list( $attributes = array() ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/page-list',
				'attrs'     => $attributes,
			)
		);

		return $block->render();
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_renders_all_pages_by_default() {
		$output = $this->render_page_list();

		$this->assertStringContainsString( 'Page List test About', $output );
		$this->assertStringContainsString( 'Page List test Team', $output );
		$this->assertStringContainsString( 'Page List test Shop', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_excluded_page_is_not_rendered() {
		$output = $this->render_page_list(
			array( 'excludedPageIDs' => array( self::$page_ids['shop'] ) )
		);

		$this->assertStringContainsString( 'Page List test About', $output );
		$this->assertStringNotContainsString( 'Page List test Shop', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_excluded_parent_hides_its_child_pages() {
		$output = $this->render_page_list(
			array( 'excludedPageIDs' => array( self::$page_ids['about'] ) )
		);

		$this->assertStringNotContainsString( 'Page List test About', $output );
		$this->assertStringNotContainsString( 'Page List test Team', $output );
		$this->assertStringContainsString( 'Page List test Shop', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_invalid_excluded_page_ids_are_ignored() {
		$output = $this->render_page_list(
			array( 'excludedPageIDs' => 'not-an-array' )
		);

		$this->assertStringContainsString( 'Page List test About', $output );
		$this->assertStringContainsString( 'Page List test Shop', $output );
	}
}
