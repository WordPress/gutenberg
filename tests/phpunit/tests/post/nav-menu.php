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

	/**
	 * @ticket 32464
	 */
	public function test_wp_nav_menu_empty_container() {
		$tag_id = self::factory()->tag->create();

		wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'post_tag',
			'menu-item-object-id' => $tag_id,
			'menu-item-status' => 'publish'
		) );

		$menu = wp_nav_menu( array(
			'echo' => false,
			'container' => '',
			'menu' => $this->menu_id
		) );

		$this->assertEquals( 0, strpos( $menu, '<ul' ) );
	}

	function test_wp_get_associated_nav_menu_items() {
		$tag_id = self::factory()->tag->create();
		$cat_id = self::factory()->category->create();
		$post_id = self::factory()->post->create();
		$post_2_id = self::factory()->post->create();
		$page_id = self::factory()->post->create( array( 'post_type' => 'page' ) );

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
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$child_terms = self::factory()->term->create_many( 2, array( 'taxonomy' => 'wptests_tax', 'parent' => $t ) );

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

	/**
	 * @ticket 35324
	 */
	function test_wp_setup_nav_menu_item_for_post_type_archive() {

		$post_type_slug = rand_str( 12 );
		$post_type_description = rand_str();
		register_post_type( $post_type_slug ,array(
			'public' => true,
			'has_archive' => true,
			'description' => $post_type_description,
			'label' => $post_type_slug
		));

		$post_type_archive_item_id = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type_archive',
			'menu-item-object' => $post_type_slug,
			'menu-item-description' => $post_type_description,
			'menu-item-status' => 'publish'
		) );
		$post_type_archive_item = wp_setup_nav_menu_item( get_post( $post_type_archive_item_id ) );

		$this->assertEquals( $post_type_slug , $post_type_archive_item->title );
		$this->assertEquals( $post_type_description , $post_type_archive_item->description );
	}

	/**
	 * @ticket 35324
	 */
	function test_wp_setup_nav_menu_item_for_post_type_archive_no_description() {

		$post_type_slug = rand_str( 12 );
		$post_type_description = '';
		register_post_type( $post_type_slug ,array(
			'public' => true,
			'has_archive' => true,
			'label' => $post_type_slug
		));

		$post_type_archive_item_id = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type_archive',
			'menu-item-object' => $post_type_slug,
			'menu-item-status' => 'publish'
		) );
		$post_type_archive_item = wp_setup_nav_menu_item( get_post( $post_type_archive_item_id ) );

		$this->assertEquals( $post_type_slug , $post_type_archive_item->title );
		$this->assertEquals( $post_type_description , $post_type_archive_item->description ); //fail!!!
	}

	/**
	 * @ticket 35324
	 */
	function test_wp_setup_nav_menu_item_for_post_type_archive_custom_description() {

		$post_type_slug = rand_str( 12 );
		$post_type_description = rand_str();
		register_post_type( $post_type_slug ,array(
			'public' => true,
			'has_archive' => true,
			'description' => $post_type_description,
			'label' => $post_type_slug
		));

		$menu_item_description = rand_str();

		$post_type_archive_item_id = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type_archive',
			'menu-item-object' => $post_type_slug,
			'menu-item-description' => $menu_item_description,
			'menu-item-status' => 'publish'
		) );
		$post_type_archive_item = wp_setup_nav_menu_item( get_post( $post_type_archive_item_id ) );

		$this->assertEquals( $post_type_slug , $post_type_archive_item->title );
		$this->assertEquals( $menu_item_description , $post_type_archive_item->description );
	}

	/**
	 * @ticket 35324
	 */
	function test_wp_setup_nav_menu_item_for_unknown_post_type_archive_no_description() {

		$post_type_slug = rand_str( 12 );

		$post_type_archive_item_id = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type'   => 'post_type_archive',
			'menu-item-object' => $post_type_slug,
			'menu-item-status' => 'publish'
		) );
		$post_type_archive_item = wp_setup_nav_menu_item( get_post( $post_type_archive_item_id ) );

		$this->assertEmpty( $post_type_archive_item->description );
	}

	/**
	 * @ticket 19038
	 */
	function test_wp_setup_nav_menu_item_for_trashed_post() {
		$post_id = self::factory()->post->create( array(
			'post_status' => 'trash',
		) );

		$menu_item_id = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type'      => 'post_type',
			'menu-item-object'    => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-status'    => 'publish',
		) );

		$menu_item = wp_setup_nav_menu_item( get_post( $menu_item_id ) );

		$this->assertTrue( ! _is_valid_nav_menu_item( $menu_item ) );
	}

	/**
	 * @ticket 35206
	 */
	function test_wp_nav_menu_whitespace_options() {
		$post_id1 = self::factory()->post->create();
		$post_id2 = self::factory()->post->create();
		$post_id3 = self::factory()->post->create();
		$post_id4 = self::factory()->post->create();

		$post_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id1,
			'menu-item-status' => 'publish'
		) );

		$post_inser2 = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id2,
			'menu-item-status' => 'publish'
		) );

		$post_insert3 = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-parent-id' => $post_insert,
			'menu-item-object-id' => $post_id3,
			'menu-item-status' => 'publish'
		) );

		$post_insert4 = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-parent-id' => $post_insert,
			'menu-item-object-id' => $post_id4,
			'menu-item-status' => 'publish'
		) );

		// No whitespace suppression.
		$menu = wp_nav_menu( array(
			'echo' => false,
			'menu' => $this->menu_id,
		) );

		// The markup should include whitespace between <li>s
		$this->assertRegExp( '/\s<li.*>|<\/li>\s/U', $menu );
		$this->assertNotRegExp( '/<\/li><li.*>/U', $menu );


		// Whitepsace suppressed.
		$menu = wp_nav_menu( array(
			'echo'         => false,
			'item_spacing' => 'discard',
			'menu'         => $this->menu_id,
		) );

		// The markup should not include whitespace around <li>s
		$this->assertNotRegExp( '/\s<li.*>|<\/li>\s/U', $menu );
		$this->assertRegExp( '/><li.*>|<\/li></U', $menu );
	}

	/*
	 * Confirm `wp_nav_menu()` and `Walker_Nav_Menu` passes an $args object to filters.
	 *
	 * `wp_nav_menu()` is unique in that it uses an $args object rather than an array.
	 * This has been the case for some time and should be maintained for reasons of
	 * backward compatibility.
	 *
	 * @ticket 24587
	 */
	function test_wp_nav_menu_filters_are_passed_args_object() {
		$tag_id = self::factory()->tag->create();

		$tag_insert = wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'post_tag',
			'menu-item-object-id' => $tag_id,
			'menu-item-status' => 'publish',
		) );

		/*
		 * The tests take place in a range of filters to ensure the passed
		 * arguments are an object.
		 */
		// In function.
		add_filter( 'pre_wp_nav_menu',          array( $this, '_confirm_second_param_args_object' ), 10, 2 );
		add_filter( 'wp_nav_menu_objects',      array( $this, '_confirm_second_param_args_object' ), 10, 2 );
		add_filter( 'wp_nav_menu_items',        array( $this, '_confirm_second_param_args_object' ), 10, 2 );

		// In walker.
		add_filter( 'nav_menu_item_args',       array( $this, '_confirm_nav_menu_item_args_object' ) );

		add_filter( 'nav_menu_css_class',       array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		add_filter( 'nav_menu_item_id',         array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		add_filter( 'nav_menu_link_attributes', array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		add_filter( 'nav_menu_item_title',      array( $this, '_confirm_third_param_args_object' ), 10, 3 );

		add_filter( 'walker_nav_menu_start_el', array( $this, '_confirm_forth_param_args_object' ), 10, 4 );

		wp_nav_menu( array(
			'echo' => false,
			'menu' => $this->menu_id,
		) );
		wp_delete_term( $tag_id, 'post_tag' );

		/*
		 * Remove test filters.
		 */
		// In function.
		remove_filter( 'pre_wp_nav_menu',          array( $this, '_confirm_second_param_args_object' ), 10, 2 );
		remove_filter( 'wp_nav_menu_objects',      array( $this, '_confirm_second_param_args_object' ), 10, 2 );
		remove_filter( 'wp_nav_menu_items',        array( $this, '_confirm_second_param_args_object' ), 10, 2 );

		// In walker.
		remove_filter( 'nav_menu_item_args',       array( $this, '_confirm_nav_menu_item_args_object' ) );

		remove_filter( 'nav_menu_css_class',       array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		remove_filter( 'nav_menu_item_id',         array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		remove_filter( 'nav_menu_link_attributes', array( $this, '_confirm_third_param_args_object' ), 10, 3 );
		remove_filter( 'nav_menu_item_title',      array( $this, '_confirm_third_param_args_object' ), 10, 3 );

		remove_filter( 'walker_nav_menu_start_el', array( $this, '_confirm_forth_param_args_object' ), 10, 4 );

	}

	/**
	 * Run tests required to confrim Walker_Nav_Menu receives an $args object.
	 */
	function _confirm_nav_menu_item_args_object( $args ) {
		$this->assertTrue( is_object( $args ) );
		return $args;
	}

	function _confirm_second_param_args_object( $ignored_1, $args ) {
		$this->assertTrue( is_object( $args ) );
		return $ignored_1;
	}

	function _confirm_third_param_args_object( $ignored_1, $ignored_2, $args ) {
		$this->assertTrue( is_object( $args ) );
		return $ignored_1;
	}

	function _confirm_forth_param_args_object( $ignored_1, $ignored_2, $ignored_3, $args ) {
		$this->assertTrue( is_object( $args ) );
		return $ignored_1;
	}


	/**
	 * @ticket 35272
	 */
	function test_no_front_page_class_applied() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page', 'post_title' => 'Home Page' ) );

		wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'page',
			'menu-item-object-id' => $page_id,
			'menu-item-status' => 'publish',
		));

		$menu_items = wp_get_nav_menu_items( $this->menu_id );
		_wp_menu_item_classes_by_context( $menu_items );

		$classes = $menu_items[0]->classes;

		$this->assertNotContains( 'menu-item-home', $classes );
	}


	/**
	 * @ticket 35272
	 */
	function test_class_applied_to_front_page_item() {
		$page_id = self::factory()->post->create( array( 'post_type' => 'page', 'post_title' => 'Home Page' ) );
		update_option( 'page_on_front', $page_id );

		wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'page',
			'menu-item-object-id' => $page_id,
			'menu-item-status' => 'publish',
		));

		$menu_items = wp_get_nav_menu_items( $this->menu_id );
		_wp_menu_item_classes_by_context( $menu_items );

		$classes = $menu_items[0]->classes;

		delete_option( 'page_on_front' );

		$this->assertContains( 'menu-item-home', $classes );
	}

	/**
	 * @ticket 35272
	 */
	function test_class_not_applied_to_taxonomies_with_same_id_as_front_page_item() {
		global $wpdb;

		$new_id = 35272;

		$page_id = self::factory()->post->create( array( 'post_type' => 'page', 'post_title' => 'Home Page' ) );
		$tag_id = self::factory()->tag->create();

		$wpdb->query( "UPDATE $wpdb->posts SET ID=$new_id WHERE ID=$page_id" );
		$wpdb->query( "UPDATE $wpdb->terms SET term_id=$new_id WHERE term_id=$tag_id" );
		$wpdb->query( "UPDATE $wpdb->term_taxonomy SET term_id=$new_id WHERE term_id=$tag_id" );

		update_option( 'page_on_front', $new_id );

		wp_update_nav_menu_item( $this->menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'post_tag',
			'menu-item-object-id' => $new_id,
			'menu-item-status' => 'publish',
		) );

		$menu_items = wp_get_nav_menu_items( $this->menu_id );
		_wp_menu_item_classes_by_context( $menu_items );

		$classes = $menu_items[0]->classes;

		$this->assertNotContains( 'menu-item-home', $classes );
	}
}
