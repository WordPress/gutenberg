<?php
/**
 * Tests for adding new pages to Navigation Menus automatically.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation Menu `auto_add_pages` setting.
 *
 * @group blocks
 */
class Tests_Blocks_Navigation_Auto_Add_Pages extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $about_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$about_id = $factory->post->create(
			array(
				'post_type'  => 'page',
				'post_title' => 'About',
			)
		);
	}

	/**
	 * Creates a Navigation Menu.
	 *
	 * @param string $content       Its blocks.
	 * @param bool   $auto_add_pages Whether it adds new pages automatically.
	 * @return int ID of the menu.
	 */
	private function create_menu( $content, $auto_add_pages ) {
		$menu_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_content' => $content,
			)
		);
		if ( $auto_add_pages ) {
			update_post_meta( $menu_id, 'auto_add_pages', true );
		}
		return $menu_id;
	}

	/**
	 * Returns a link to the About page.
	 *
	 * @return string The block.
	 */
	private function about_link() {
		return '<!-- wp:navigation-link {"id":' . self::$about_id . ',"label":"About","type":"page","kind":"post-type"} /-->';
	}

	/**
	 * Publishes a page.
	 *
	 * @param string $title     Its title.
	 * @param int    $parent_id Its parent page.
	 * @return int ID of the page.
	 */
	private function publish_page( $title, $parent_id = 0 ) {
		return self::factory()->post->create(
			array(
				'post_type'   => 'page',
				'post_title'  => $title,
				'post_parent' => $parent_id,
			)
		);
	}

	public function test_registers_the_setting() {
		$this->assertTrue( registered_meta_key_exists( 'post', 'auto_add_pages', 'wp_navigation' ) );
	}

	public function test_adds_a_top_level_page_at_the_end() {
		$menu_id = $this->create_menu( $this->about_link(), true );
		$page_id = $this->publish_page( 'Shop' );

		$blocks = parse_blocks( get_post( $menu_id )->post_content );
		$last   = end( $blocks );
		$this->assertSame( 'core/navigation-link', $last['blockName'] );
		$this->assertSame( $page_id, $last['attrs']['id'] );
		$this->assertSame( 'Shop', $last['attrs']['label'] );
		$this->assertSame( 'page', $last['attrs']['type'] );
	}

	public function test_adds_a_child_page_under_its_parent_page() {
		$menu_id = $this->create_menu( $this->about_link(), true );
		$page_id = $this->publish_page( 'Team', self::$about_id );

		$blocks = array_values(
			array_filter(
				parse_blocks( get_post( $menu_id )->post_content ),
				static function ( $block ) {
					return null !== $block['blockName'];
				}
			)
		);
		$this->assertCount( 1, $blocks );
		$this->assertSame( 'core/navigation-submenu', $blocks[0]['blockName'] );
		$this->assertSame( $page_id, $blocks[0]['innerBlocks'][0]['attrs']['id'] );
	}

	public function test_leaves_out_a_child_page_whose_parent_page_is_not_in_the_menu() {
		$content = '<!-- wp:navigation-link {"label":"Shop","url":"https://example.com","kind":"custom"} /-->';
		$menu_id = $this->create_menu( $content, true );
		$this->publish_page( 'Team', self::$about_id );

		$this->assertSame( $content, get_post( $menu_id )->post_content );
	}

	public function test_leaves_menus_that_do_not_add_new_pages() {
		$menu_id = $this->create_menu( $this->about_link(), false );
		$this->publish_page( 'Shop' );

		$this->assertSame( $this->about_link(), get_post( $menu_id )->post_content );
	}

	public function test_leaves_menus_with_a_page_list() {
		$content = $this->about_link() . '<!-- wp:page-list /-->';
		$menu_id = $this->create_menu( $content, true );
		$this->publish_page( 'Shop' );

		$this->assertSame( $content, get_post( $menu_id )->post_content );
	}

	public function test_adds_a_page_only_when_it_is_first_published() {
		$menu_id = $this->create_menu( $this->about_link(), true );
		$page_id = $this->publish_page( 'Shop' );
		wp_update_post(
			array(
				'ID'         => $page_id,
				'post_title' => 'Shop now',
			)
		);

		$this->assertSame( 1, substr_count( get_post( $menu_id )->post_content, '"id":' . $page_id . ',' ) );
	}
}
