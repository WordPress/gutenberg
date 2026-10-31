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
class Render_Block_Page_List_Test extends WP_UnitTestCase {

	/**
	 * Pages the block lists.
	 *
	 * @var int[]
	 */
	private static $page_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		foreach ( array( 'Alpha', 'Beta' ) as $index => $title ) {
			self::$page_ids[] = $factory->post->create(
				array(
					'post_type'   => 'page',
					'post_title'  => $title,
					'post_status' => 'publish',
					'menu_order'  => $index,
				)
			);
		}
	}

	public static function wpTearDownAfterClass() {
		foreach ( self::$page_ids as $page_id ) {
			wp_delete_post( $page_id, true );
		}
		self::$page_ids = array();
	}

	/**
	 * Render a Page List with the context a parent would provide.
	 *
	 * @param array $context Block context.
	 * @return string Rendered markup.
	 */
	private function render_page_list( $context = array() ) {
		$parsed = parse_blocks( '<!-- wp:page-list /-->' );
		$block  = new WP_Block( $parsed[0], $context );

		return $block->render();
	}

	/**
	 * On its own the block is a list, so it brings the list element with it.
	 *
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_standalone_page_list_is_wrapped_in_a_list() {
		$markup = $this->render_page_list();

		$this->assertStringContainsString( '<ul class="wp-block-page-list"', $markup );
	}

	/**
	 * Inside a Navigation the block contributes items to that navigation's list.
	 *
	 * A list of its own would be placed among the navigation's list items, and a `<ul>` may
	 * contain only `<li>` and script-supporting elements.
	 *
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_page_list_in_navigation_contributes_items_without_a_list() {
		$markup = $this->render_page_list(
			array(
				'showSubmenuIcon'   => true,
				'submenuVisibility' => 'hover',
			)
		);

		$this->assertStringNotContainsString( '<ul class="wp-block-page-list"', $markup );
		$this->assertStringStartsWith( '<li ', $markup );
	}

	/**
	 * The same is already true inside a submenu, and stays true.
	 *
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_page_list_inside_a_submenu_still_contributes_items_only() {
		$markup = $this->render_page_list(
			array(
				'core/isInsideSubmenu' => true,
				'showSubmenuIcon'      => true,
				'submenuVisibility'    => 'hover',
			)
		);

		$this->assertStringNotContainsString( '<ul class="wp-block-page-list"', $markup );
		$this->assertStringStartsWith( '<li ', $markup );
	}

	/**
	 * A Navigation containing a Page List renders one list of sibling items.
	 *
	 * Every child of the navigation's container is a list item, whether it was authored as a
	 * Navigation Link or generated from a page, so the two participate in the same layout.
	 *
	 * @covers ::gutenberg_render_block_core_page_list
	 */
	public function test_navigation_with_a_page_list_has_only_list_items_as_children() {
		$markup = do_blocks(
			'<!-- wp:navigation {"overlayMenu":"never"} -->
				<!-- wp:navigation-link {"label":"First","url":"/first"} /-->
				<!-- wp:page-list /-->
				<!-- wp:navigation-link {"label":"Last","url":"/last"} /-->
			<!-- /wp:navigation -->'
		);

		$document               = new DOMDocument();
		$previous_libxml_errors = libxml_use_internal_errors( true );
		try {
			$this->assertTrue( $document->loadHTML( '<!doctype html><html><body>' . $markup . '</body></html>' ) );
		} finally {
			libxml_clear_errors();
			libxml_use_internal_errors( $previous_libxml_errors );
		}
		$xpath = new DOMXPath( $document );

		$this->assertSame(
			0,
			$xpath->query( '//ul/ul' )->length,
			'A list may not be a direct child of another list.'
		);

		$container = '//ul[contains(@class,"wp-block-navigation__container")]';
		$this->assertSame(
			$xpath->query( $container . '/*' )->length,
			$xpath->query( $container . '/li' )->length,
			'Every child of the navigation container is a list item.'
		);

		// The two authored links and the two published pages, as peers.
		$this->assertSame( 4, $xpath->query( $container . '/li' )->length );
	}
}
