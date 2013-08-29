<?php
/**
 * @group post
 * @group navmenus
 */
class Test_Nav_Menus extends WP_UnitTestCase {
	/**
	 * @var int
	 */
	public $menu_id;

	function setUp() {
		parent::setUp();

		$this->menu_id = wp_create_nav_menu( rand_str() );
	}

	function test_wp_get_associated_nav_menu_items() {
		$tag_id = $this->factory->tag->create();
		$cat_id = $this->factory->category->create();

		$tag_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'post_tag',
			'menu-item-object-id' => $tag_id,
			'menu-item-status' => 'publish'
		) );

		$cat_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'category',
			'menu-item-object-id' => $cat_id,
			'menu-item-status' => 'publish'
		) );

		$tag_items = wp_get_associated_nav_menu_items( $tag_id, 'taxonomy', 'post_tag' );
		$this->assertEqualSets( array( $tag_insert ), $tag_items );
		$cat_items = wp_get_associated_nav_menu_items( $cat_id, 'taxonomy', 'category' );
		$this->assertEqualSets( array( $cat_insert ), $cat_items );
	}
}