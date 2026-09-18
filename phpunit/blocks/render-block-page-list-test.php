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
	 * @var int
	 */
	private static $parent_page_id;

	/**
	 * @var int
	 */
	private static $child_page_id;

	/**
	 * @var int
	 */
	private static $sibling_page_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$parent_page_id  = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Page List Parent',
			)
		);
		self::$child_page_id   = $factory->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => 'Page List Child',
				'post_parent' => self::$parent_page_id,
			)
		);
		self::$sibling_page_id = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'Page List Sibling',
			)
		);
	}

	/**
	 * Renders a Page List block with the given attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string The rendered markup.
	 */
	private function render_page_list( $attributes = array() ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/page-list',
				'attrs'     => $attributes,
			)
		);

		return (string) $block->render();
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_renders_all_pages_by_default() {
		$output = $this->render_page_list();

		$this->assertStringContainsString( 'Page List Parent', $output );
		$this->assertStringContainsString( 'Page List Child', $output );
		$this->assertStringContainsString( 'Page List Sibling', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_excluded_page_is_hidden_with_its_subpages() {
		$output = $this->render_page_list(
			array( 'excludedPageIDs' => array( self::$parent_page_id ) )
		);

		$this->assertStringNotContainsString( 'Page List Parent', $output );
		$this->assertStringNotContainsString( 'Page List Child', $output );
		$this->assertStringContainsString( 'Page List Sibling', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_parent_with_only_excluded_subpages_has_no_submenu() {
		$output = $this->render_page_list(
			array( 'excludedPageIDs' => array( self::$child_page_id ) )
		);

		$this->assertStringContainsString( 'Page List Parent', $output );
		$this->assertStringNotContainsString( 'Page List Child', $output );
		$this->assertStringNotContainsString( 'has-child', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_renders_nothing_when_all_pages_are_excluded() {
		$output = $this->render_page_list(
			array(
				'excludedPageIDs' => array( self::$parent_page_id, self::$sibling_page_id ),
			)
		);

		$this->assertSame( '', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_renders_nothing_when_all_subpages_of_parent_are_excluded() {
		$output = $this->render_page_list(
			array(
				'parentPageID'    => self::$parent_page_id,
				'excludedPageIDs' => array( self::$child_page_id ),
			)
		);

		$this->assertSame( '', $output );
	}

	/**
	 * Calls the render callback directly, since `WP_Block` would replace
	 * invalid attributes with their defaults before it runs.
	 *
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_ignores_invalid_excluded_page_ids() {
		$block = new WP_Block( array( 'blockName' => 'core/page-list' ) );

		$output = gutenberg_render_block_core_page_list(
			array( 'excludedPageIDs' => 'not-an-array' ),
			'',
			$block
		);

		$this->assertStringContainsString( 'Page List Sibling', $output );

		$output = gutenberg_render_block_core_page_list(
			array( 'excludedPageIDs' => array( array( 'nested' ), (string) self::$sibling_page_id ) ),
			'',
			$block
		);

		$this->assertStringContainsString( 'Page List Parent', $output );
		$this->assertStringNotContainsString( 'Page List Sibling', $output );
	}
}
