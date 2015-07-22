<?php

/**
 * Tests WP_Customize_Nav_Menus.
 *
 * @group customize
 */
class Test_WP_Customize_Nav_Menus extends WP_UnitTestCase {

	/**
	 * Instance of WP_Customize_Manager which is reset for each test.
	 *
	 * @var WP_Customize_Manager
	 */
	public $wp_customize;

	/**
	 * Set up a test case.
	 *
	 * @see WP_UnitTestCase::setup()
	 */
	function setUp() {
		parent::setUp();
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		wp_set_current_user( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		global $wp_customize;
		$this->wp_customize = new WP_Customize_Manager();
		$wp_customize = $this->wp_customize;
	}

	/**
	 * Delete the $wp_customize global when cleaning up scope.
	 */
	function clean_up_global_scope() {
		global $wp_customize;
		$wp_customize = null;
		parent::clean_up_global_scope();
	}

	/**
	 * Filter to add custom menu item types.
	 *
	 * @param array $items Menu item types.
	 * @return array Menu item types.
	 */
	function filter_item_types( $items ) {
		$items[] = array(
			'title'  => 'Custom',
			'type'   => 'custom_type',
			'object' => 'custom_object',
		);

		return $items;
	}

	/**
	 * Filter to add custom menu items.
	 *
	 * @param array  $items  The menu items.
	 * @param string $type   The object type (e.g. taxonomy).
	 * @param string $object The object name (e.g. category).
	 * @return array Menu items.
	 */
	function filter_items( $items, $type, $object ) {
		$items[] = array(
			'id'         => 'custom-1',
			'title'      => 'Cool beans',
			'type'       => $type,
			'type_label' => 'Custom Label',
			'object'     => $object,
			'url'        => home_url( '/cool-beans/' ),
			'classes'    => 'custom-menu-item cool-beans',
		);

		return $items;
	}

	/**
	 * Test constructor.
	 *
	 * @see WP_Customize_Nav_Menus::__construct()
	 */
	function test_construct() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );
		$this->assertInstanceOf( 'WP_Customize_Manager', $menus->manager );
	}

	/**
	 * Test that the load_available_items_query method returns a WP_Error object.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_wp_error() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Invalid post type $obj_name.
		$items = $menus->load_available_items_query( 'post_type', 'invalid' );
		$this->assertInstanceOf( 'WP_Error', $items );
		$this->assertEquals( 'nav_menus_invalid_post_type', $items->get_error_code() );

		// Invalid taxonomy $obj_name.
		$items = $menus->load_available_items_query( 'taxonomy', 'invalid' );
		$this->assertInstanceOf( 'WP_Error', $items );
		$this->assertEquals( 'invalid_taxonomy', $items->get_error_code() );
	}

	/**
	 * Test the load_available_items_query method maybe returns the home page item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_maybe_returns_home() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Expected menu item array.
		$expected = array(
			'id'         => 'home',
			'title'      => _x( 'Home', 'nav menu home label' ),
			'type'       => 'custom',
			'type_label' => __( 'Custom Link' ),
			'object'     => '',
			'url'        => home_url(),
		);

		// Create pages.
		$this->factory->post->create_many( 15, array( 'post_type' => 'page' ) );

		// Home is included in menu items when page is zero.
		$items = $menus->load_available_items_query( 'post_type', 'page', 0 );
		$this->assertContains( $expected, $items );

		// Home is not included in menu items when page is larger than zero.
		$items = $menus->load_available_items_query( 'post_type', 'page', 1 );
		$this->assertNotEmpty( $items );
		$this->assertNotContains( $expected, $items );
	}

	/**
	 * Test the load_available_items_query method returns post item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_post_item_with_page_number() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Create page.
		$post_id = $this->factory->post->create( array( 'post_title' => 'Post Title' ) );

		// Create pages.
		$this->factory->post->create_many( 10 );

		// Expected menu item array.
		$expected = array(
			'id'         => "post-{$post_id}",
			'title'      => 'Post Title',
			'type'       => 'post_type',
			'type_label' => 'Post',
			'object'     => 'post',
			'object_id'  => intval( $post_id ),
			'url'        => get_permalink( intval( $post_id ) ),
		);

		// Offset the query and get the second page of menu items.
		$items = $menus->load_available_items_query( 'post_type', 'post', 1 );
		$this->assertContains( $expected, $items );
	}

	/**
	 * Test the load_available_items_query method returns page item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_page_item() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Create page.
		$page_id = $this->factory->post->create( array( 'post_title' => 'Page Title', 'post_type' => 'page' ) );

		// Expected menu item array.
		$expected = array(
			'id'         => "post-{$page_id}",
			'title'      => 'Page Title',
			'type'       => 'post_type',
			'type_label' => 'Page',
			'object'     => 'page',
			'object_id'  => intval( $page_id ),
			'url'        => get_permalink( intval( $page_id ) ),
		);

		$items = $menus->load_available_items_query( 'post_type', 'page', 0 );
		$this->assertContains( $expected, $items );
	}

	/**
	 * Test the load_available_items_query method returns post item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_post_item() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Create post.
		$post_id = $this->factory->post->create( array( 'post_title' => 'Post Title' ) );

		// Expected menu item array.
		$expected = array(
			'id'         => "post-{$post_id}",
			'title'      => 'Post Title',
			'type'       => 'post_type',
			'type_label' => 'Post',
			'object'     => 'post',
			'object_id'  => intval( $post_id ),
			'url'        => get_permalink( intval( $post_id ) ),
		);

		$items = $menus->load_available_items_query( 'post_type', 'post', 0 );
		$this->assertContains( $expected, $items );
	}

	/**
	 * Test the load_available_items_query method returns term item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_term_item() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Create term.
		$term_id = $this->factory->category->create( array( 'name' => 'Term Title' ) );

		// Expected menu item array.
		$expected = array(
			'id'         => "term-{$term_id}",
			'title'      => 'Term Title',
			'type'       => 'taxonomy',
			'type_label' => 'Category',
			'object'     => 'category',
			'object_id'  => intval( $term_id ),
			'url'        => get_term_link( intval( $term_id ), 'category' ),
		);

		$items = $menus->load_available_items_query( 'taxonomy', 'category', 0 );
		$this->assertContains( $expected, $items );
	}

	/**
	 * Test the load_available_items_query method returns custom item.
	 *
	 * @see WP_Customize_Nav_Menus::load_available_items_query()
	 */
	function test_load_available_items_query_returns_custom_item() {
		add_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );
		add_filter( 'customize_nav_menu_available_items', array( $this, 'filter_items' ), 10, 4 );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Expected menu item array.
		$expected = array(
			'id'         => 'custom-1',
			'title'      => 'Cool beans',
			'type'       => 'custom_type',
			'type_label' => 'Custom Label',
			'object'     => 'custom_object',
			'url'        => home_url( '/cool-beans/' ),
			'classes'    => 'custom-menu-item cool-beans',
		);

		$items = $menus->load_available_items_query( 'custom_type', 'custom_object', 0 );
		$this->assertContains( $expected, $items );
	}

	/**
	 * Test the search_available_items_query method.
	 *
	 * @see WP_Customize_Nav_Menus::search_available_items_query()
	 */
	function test_search_available_items_query() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		// Create posts
		$post_ids = array();
		$post_ids[] = $this->factory->post->create( array( 'post_title' => 'Search & Test' ) );
		$post_ids[] = $this->factory->post->create( array( 'post_title' => 'Some Other Title' ) );

		// Create terms
		$term_ids = array();
		$term_ids[] = $this->factory->category->create( array( 'name' => 'Dogs Are Cool' ) );
		$term_ids[] = $this->factory->category->create( array( 'name' => 'Cats Drool' ) );

		// Test empty results
		$expected = array();
		$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => 'This Does NOT Exist' ) );
		$this->assertEquals( $expected, $results );

		// Test posts
		foreach ( $post_ids as $post_id ) {
			$expected = array(
				'id'         => 'post-' . $post_id,
				'title'      => html_entity_decode( get_the_title( $post_id ) ),
				'type'       => 'post_type',
				'type_label' => get_post_type_object( 'post' )->labels->singular_name,
				'object'     => 'post',
				'object_id'  => intval( $post_id ),
				'url'        => get_permalink( intval( $post_id ) ),
			);
			wp_set_object_terms( $post_id, $term_ids, 'category' );
			$search = $post_id === $post_ids[0] ? 'test & search' : 'other title';
			$s = sanitize_text_field( wp_unslash( $search ) );
			$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => $s ) );
			$this->assertEquals( $expected, $results[0] );
		}

		// Test terms
		foreach ( $term_ids as $term_id ) {
			$term = get_term_by( 'id', $term_id, 'category' );
			$expected = array(
				'id'         => 'term-' . $term_id,
				'title'      => $term->name,
				'type'       => 'taxonomy',
				'type_label' => get_taxonomy( 'category' )->labels->singular_name,
				'object'     => 'category',
				'object_id'  => intval( $term_id ),
				'url'        => get_term_link( intval( $term_id ), 'category' ),
			);
			$s = sanitize_text_field( wp_unslash( $term->name ) );
			$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => $s ) );
			$this->assertEquals( $expected, $results[0] );
		}
	}

	/**
	 * Test the enqueue method.
	 *
	 * @see WP_Customize_Nav_Menus::enqueue_scripts()
	 */
	function test_enqueue_scripts() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );
		$menus->enqueue_scripts();
		$this->assertTrue( wp_script_is( 'customize-nav-menus' ) );
	}

	/**
	 * Test the filter_dynamic_setting_args method.
	 *
	 * @see WP_Customize_Nav_Menus::filter_dynamic_setting_args()
	 */
	function test_filter_dynamic_setting_args() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$expected = array( 'type' => 'nav_menu_item' );
		$results = $menus->filter_dynamic_setting_args( $this->wp_customize, 'nav_menu_item[123]' );
		$this->assertEquals( $expected, $results );

		$expected = array( 'type' => 'nav_menu' );
		$results = $menus->filter_dynamic_setting_args( $this->wp_customize, 'nav_menu[123]' );
		$this->assertEquals( $expected, $results );
	}

	/**
	 * Test the filter_dynamic_setting_class method.
	 *
	 * @see WP_Customize_Nav_Menus::filter_dynamic_setting_class()
	 */
	function test_filter_dynamic_setting_class() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$expected = 'WP_Customize_Nav_Menu_Item_Setting';
		$results = $menus->filter_dynamic_setting_class( 'WP_Customize_Setting', 'nav_menu_item[123]', array( 'type' => 'nav_menu_item' ) );
		$this->assertEquals( $expected, $results );

		$expected = 'WP_Customize_Nav_Menu_Setting';
		$results = $menus->filter_dynamic_setting_class( 'WP_Customize_Setting', 'nav_menu[123]', array( 'type' => 'nav_menu' ) );
		$this->assertEquals( $expected, $results );
	}

	/**
	 * Test the customize_register method.
	 *
	 * @see WP_Customize_Nav_Menus::customize_register()
	 */
	function test_customize_register() {
		do_action( 'customize_register', $this->wp_customize );
		$menu_id = wp_create_nav_menu( 'Primary' );
		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type'      => 'post_type',
			'menu-item-object'    => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-title'     => 'Hello World',
			'menu-item-status'    => 'publish',
		) );
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, "nav_menu_item[$item_id]" );
		do_action( 'customize_register', $this->wp_customize );
		$this->assertEquals( 'Primary', $this->wp_customize->get_section( "nav_menu[$menu_id]" )->title );
		$this->assertEquals( 'Hello World', $this->wp_customize->get_control( "nav_menu_item[$item_id]" )->label );
	}

	/**
	 * Test the intval_base10 method.
	 *
	 * @see WP_Customize_Nav_Menus::intval_base10()
	 */
	function test_intval_base10() {

		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$this->assertEquals( 2, $menus->intval_base10( 2 ) );
		$this->assertEquals( 4, $menus->intval_base10( 4.1 ) );
		$this->assertEquals( 4, $menus->intval_base10( '4' ) );
		$this->assertEquals( 4, $menus->intval_base10( '04' ) );
		$this->assertEquals( 42, $menus->intval_base10( +42 ) );
		$this->assertEquals( -42, $menus->intval_base10( -42 ) );
		$this->assertEquals( 26, $menus->intval_base10( 0x1A ) );
		$this->assertEquals( 0, $menus->intval_base10( array() ) );
	}

	/**
	 * Test the available_item_types method.
	 *
	 * @see WP_Customize_Nav_Menus::available_item_types()
	 */
	function test_available_item_types() {

		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$expected = array(
			array( 'title' => 'Post', 'type' => 'post_type', 'object' => 'post' ),
			array( 'title' => 'Page', 'type' => 'post_type', 'object' => 'page' ),
			array( 'title' => 'Category', 'type' => 'taxonomy', 'object' => 'category' ),
			array( 'title' => 'Tag', 'type' => 'taxonomy', 'object' => 'post_tag' ),
		);

		if ( current_theme_supports( 'post-formats' ) ) {
			$expected[] = array( 'title' => 'Format', 'type' => 'taxonomy', 'object' => 'post_format' );
		}

		$this->assertEquals( $expected, $menus->available_item_types() );

		register_taxonomy( 'wptests_tax', array( 'post' ), array( 'labels' => array( 'name' => 'Foo' ) ) );
		$expected[] = array( 'title' => 'Foo', 'type' => 'taxonomy', 'object' => 'wptests_tax' );

		$this->assertEquals( $expected, $menus->available_item_types() );

		$expected[] = array( 'title' => 'Custom', 'type' => 'custom_type', 'object' => 'custom_object' );

		add_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );
		$this->assertEquals( $expected, $menus->available_item_types() );
		remove_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );

	}

	/**
	 * Test the print_templates method.
	 *
	 * @see WP_Customize_Nav_Menus::print_templates()
	 */
	function test_print_templates() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		ob_start();
		$menus->print_templates();
		$template = ob_get_clean();

		$expected = sprintf(
			'<button type="button" class="menus-move-up">%1$s</button><button type="button" class="menus-move-down">%2$s</button><button type="button" class="menus-move-left">%3$s</button><button type="button" class="menus-move-right">%4$s</button>',
			esc_html( 'Move up' ),
			esc_html( 'Move down' ),
			esc_html( 'Move one level up' ),
			esc_html( 'Move one level down' )
		);

		$this->assertContains( $expected, $template );
	}

	/**
	 * Test the available_items_template method.
	 *
	 * @see WP_Customize_Nav_Menus::available_items_template()
	 */
	function test_available_items_template() {
		add_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		ob_start();
		$menus->available_items_template();
		$template = ob_get_clean();

		$expected = sprintf( 'Customizing &#9656; %s', esc_html( $this->wp_customize->get_panel( 'nav_menus' )->title ) );

		$this->assertContains( $expected, $template );

		$post_types = get_post_types( array( 'show_in_nav_menus' => true ), 'object' );
		if ( $post_types ) {
			foreach ( $post_types as $type ) {
				$this->assertContains( 'available-menu-items-post_type-' . esc_attr( $type->name ), $template );
				$this->assertContains( '<h4 class="accordion-section-title">' . esc_html( $type->labels->singular_name ), $template );
				$this->assertContains( 'data-type="post_type"', $template );
				$this->assertContains( 'data-object="' . esc_attr( $type->name ) . '"', $template );
			}
		}

		$taxonomies = get_taxonomies( array( 'show_in_nav_menus' => true ), 'object' );
		if ( $taxonomies ) {
			foreach ( $taxonomies as $tax ) {
				$this->assertContains( 'available-menu-items-taxonomy-' . esc_attr( $tax->name ), $template );
				$this->assertContains( '<h4 class="accordion-section-title">' . esc_html( $tax->labels->singular_name ), $template );
				$this->assertContains( 'data-type="taxonomy"', $template );
				$this->assertContains( 'data-object="' . esc_attr( $tax->name ) . '"', $template );
			}
		}

		$this->assertContains( 'available-menu-items-custom_type', $template );
		$this->assertContains( '<h4 class="accordion-section-title">Custom', $template );
		$this->assertContains( 'data-type="custom_type"', $template );
		$this->assertContains( 'data-object="custom_object"', $template );
	}

	/**
	 * Test the customize_preview_init method.
	 *
	 * @see WP_Customize_Nav_Menus::customize_preview_init()
	 */
	function test_customize_preview_init() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$menus->customize_preview_init();
		$this->assertEquals( 10, has_action( 'template_redirect', array( $menus, 'render_menu' ) ) );
		$this->assertEquals( 10, has_action( 'wp_enqueue_scripts', array( $menus, 'customize_preview_enqueue_deps' ) ) );

		if ( ! isset( $_REQUEST[ WP_Customize_Nav_Menus::RENDER_QUERY_VAR ] ) ) {
			$this->assertEquals( 1000, has_filter( 'wp_nav_menu_args', array( $menus, 'filter_wp_nav_menu_args' ) ) );
			$this->assertEquals( 10, has_filter( 'wp_nav_menu', array( $menus, 'filter_wp_nav_menu' ) ) );
		}
	}

	/**
	 * Test the filter_wp_nav_menu_args method.
	 *
	 * @see WP_Customize_Nav_Menus::filter_wp_nav_menu_args()
	 */
	function test_filter_wp_nav_menu_args() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => wp_create_nav_menu( 'Foo' ),
		) );
		$this->assertEquals( 1, $results['can_partial_refresh'] );

		$expected = array(
			'echo',
			'can_partial_refresh',
			'fallback_cb',
			'instance_number',
			'walker',
		);
		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => false,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => new Walker_Nav_Menu(),
		) );
		$this->assertEqualSets( $expected, array_keys( $results ) );
		$this->assertEquals( 'wp_page_menu', $results['fallback_cb'] );
		$this->assertEquals( 0, $results['can_partial_refresh'] );

		$this->assertNotEmpty( $menus->preview_nav_menu_instance_args[ $results['instance_number'] ] );
		$preview_nav_menu_instance_args = $menus->preview_nav_menu_instance_args[ $results['instance_number'] ];
		$this->assertEquals( '', $preview_nav_menu_instance_args['fallback_cb'] );
		$this->assertEquals( '', $preview_nav_menu_instance_args['walker'] );
		$this->assertNotEmpty( $preview_nav_menu_instance_args['args_hash'] );
	}

	/**
	 * Test the filter_wp_nav_menu method.
	 *
	 * @see WP_Customize_Nav_Menus::filter_wp_nav_menu()
	 */
	function test_filter_wp_nav_menu() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$args = $menus->filter_wp_nav_menu_args( array(
			'echo'        => true,
			'menu'        => wp_create_nav_menu( 'Foo' ),
			'fallback_cb' => 'wp_page_menu',
			'walker'      => '',
		) );

		ob_start();
		wp_nav_menu( $args );
		$nav_menu_content = ob_get_clean();

		$object_args = json_decode( json_encode( $args ), false );
		$result = $menus->filter_wp_nav_menu( $nav_menu_content, $object_args );
		$expected = sprintf(
			'<div class="partial-refreshable-nav-menu partial-refreshable-nav-menu-%1$d menu">',
			$args['instance_number']
		);
		$this->assertStringStartsWith( $expected, $result );
	}

	/**
	 * Test the customize_preview_enqueue_deps method.
	 *
	 * @see WP_Customize_Nav_Menus::customize_preview_enqueue_deps()
	 */
	function test_customize_preview_enqueue_deps() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$menus->customize_preview_enqueue_deps();

		$this->assertTrue( wp_script_is( 'customize-preview-nav-menus' ) );
		$this->assertEquals( 10, has_action( 'wp_print_footer_scripts', array( $menus, 'export_preview_data' ) ) );
	}

	/**
	 * Test the export_preview_data method.
	 *
	 * @see WP_Customize_Nav_Menus::export_preview_data()
	 */
	function test_export_preview_data() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$request_uri = $_SERVER['REQUEST_URI'];

		ob_start();
		$_SERVER['REQUEST_URI'] = '/wp-admin';
		$menus->export_preview_data();
		$data = ob_get_clean();

		$_SERVER['REQUEST_URI'] = $request_uri;

		$this->assertContains( '_wpCustomizePreviewNavMenusExports', $data );
		$this->assertContains( 'renderQueryVar', $data );
		$this->assertContains( 'renderNonceValue', $data );
		$this->assertContains( 'renderNoncePostKey', $data );
		$this->assertContains( 'requestUri', $data );
		$this->assertContains( 'theme', $data );
		$this->assertContains( 'previewCustomizeNonce', $data );
		$this->assertContains( 'navMenuInstanceArgs', $data );
		$this->assertContains( 'requestUri', $data );

	}

}
