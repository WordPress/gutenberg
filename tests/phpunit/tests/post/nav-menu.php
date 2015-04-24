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
		$post_id = $this->factory->post->create();
		$post_2_id = $this->factory->post->create();
		$page_id = $this->factory->post->create( array( 'post_type' => 'page' ) );

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

		$post_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-status' => 'publish'
		) );

		// Item without menu-item-object arg
		$post_2_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object-id' => $post_2_id,
			'menu-item-status' => 'publish'
		) );

		$page_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'page',
			'menu-item-object-id' => $page_id,
			'menu-item-status' => 'publish'
		) );

		$tag_items = wp_get_associated_nav_menu_items( $tag_id, 'taxonomy', 'post_tag' );
		$this->assertEqualSets( array( $tag_insert ), $tag_items );
		$cat_items = wp_get_associated_nav_menu_items( $cat_id, 'taxonomy', 'category' );
		$this->assertEqualSets( array( $cat_insert ), $cat_items );
		$post_items = wp_get_associated_nav_menu_items( $post_id );
		$this->assertEqualSets( array( $post_insert ), $post_items );
		$post_2_items = wp_get_associated_nav_menu_items( $post_2_id );
		$this->assertEqualSets( array( $post_2_insert ), $post_2_items );
		$page_items = wp_get_associated_nav_menu_items( $page_id );
		$this->assertEqualSets( array( $page_insert ), $page_items );

		wp_delete_term( $tag_id, 'post_tag' );
		$tag_items = wp_get_associated_nav_menu_items( $tag_id, 'taxonomy', 'post_tag' );
		$this->assertEqualSets( array(), $tag_items );

		wp_delete_term( $cat_id, 'category' );
		$cat_items = wp_get_associated_nav_menu_items( $cat_id, 'taxonomy', 'category' );
		$this->assertEqualSets( array(), $cat_items );

		wp_delete_post( $post_id, true );
		$post_items = wp_get_associated_nav_menu_items( $post_id );
		$this->assertEqualSets( array(), $post_items );

		wp_delete_post( $post_2_id, true );
		$post_2_items = wp_get_associated_nav_menu_items( $post_2_id );
		$this->assertEqualSets( array(), $post_2_items );

		wp_delete_post( $page_id, true );
		$page_items = wp_get_associated_nav_menu_items( $page_id );
		$this->assertEqualSets( array(), $page_items );
	}

	/**
	 * @ticket 27113
	 */
	function test_orphan_nav_menu_item() {

		// Create an orphan nav menu item
		$custom_item_id = wp_update_nav_menu_item( 0, 0, array(
			'menu-item-type'      => 'custom',
			'menu-item-title'     => 'Wordpress.org',
			'menu-item-link'      => 'http://wordpress.org',
			'menu-item-status'    => 'publish'
		) );

		// Confirm it saved properly
		$custom_item = wp_setup_nav_menu_item( get_post( $custom_item_id ) );
		$this->assertEquals( 'Wordpress.org', $custom_item->title );

		// Update the orphan with an associated nav menu
		wp_update_nav_menu_item( $this->menu_id, $custom_item_id, array( 
			'menu-item-title'     => 'WordPress.org',
			) );
		$menu_items = wp_get_nav_menu_items( $this->menu_id );
		$custom_item = wp_filter_object_list( $menu_items, array( 'db_id' => $custom_item_id ) );
		$custom_item = array_pop( $custom_item );
		$this->assertEquals( 'WordPress.org', $custom_item->title );

	}

	public function test_wp_get_nav_menu_items_with_taxonomy_term() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$child_terms = $this->factory->term->create_many( 2, array( 'taxonomy' => 'wptests_tax', 'parent' => $t ) );

		$term_menu_item = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'wptests_tax',
			'menu-item-object-id' => $t,
			'menu-item-status' => 'publish'
		) );

		$term = get_term( $t, 'wptests_tax' );

		$menu_items = wp_get_nav_menu_items( $this->menu_id );
		$this->assertSame( $term->name, $menu_items[0]->title );
		$this->assertEquals( $t, $menu_items[0]->object_id );
	}

	/**
	 * @ticket 29460
	 */
	function test_orderby_name_by_default() {
		// We are going to create a random number of menus (min 2, max 10) 
		$menus_no = rand( 2, 10 );

		for ( $i = 0; $i <= $menus_no; $i++ ) {
			wp_create_nav_menu( rand_str() );
		}

		// This is the expected array of menu names
		$expected_nav_menus_names = wp_list_pluck( 
			get_terms( 'nav_menu',  array( 'hide_empty' => false, 'orderby' => 'name' ) ),
			'name'
		);

		// And this is what we got when calling wp_get_nav_menus()
		$nav_menus_names = wp_list_pluck( wp_get_nav_menus(), 'name' );
		
		$this->assertEquals( $nav_menus_names, $expected_nav_menus_names );
	}
}
