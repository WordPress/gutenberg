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
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
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
			'title' => 'Custom',
			'type' => 'custom_type',
			'object' => 'custom_object',
			'type_label' => 'Custom Type',
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

		$this->assertEquals( 10, add_filter( 'customize_refresh_nonces', array( $menus, 'filter_nonces' ) ) );
		$this->assertEquals( 10, add_action( 'wp_ajax_load-available-menu-items-customizer', array( $menus, 'ajax_load_available_items' ) ) );
		$this->assertEquals( 10, add_action( 'wp_ajax_search-available-menu-items-customizer', array( $menus, 'ajax_search_available_items' ) ) );
		$this->assertEquals( 10, add_action( 'wp_ajax_customize-nav-menus-insert-auto-draft', array( $menus, 'ajax_insert_auto_draft_post' ) ) );
		$this->assertEquals( 10, add_action( 'customize_controls_enqueue_scripts', array( $menus, 'enqueue_scripts' ) ) );
		$this->assertEquals( 11, add_action( 'customize_register', array( $menus, 'customize_register' ) ) );
		$this->assertEquals( 10, add_filter( 'customize_dynamic_setting_args', array( $menus, 'filter_dynamic_setting_args' ) ) );
		$this->assertEquals( 10, add_filter( 'customize_dynamic_setting_class', array( $menus, 'filter_dynamic_setting_class' ) ) );
		$this->assertEquals( 10, add_action( 'customize_controls_print_footer_scripts', array( $menus, 'print_templates' ) ) );
		$this->assertEquals( 10, add_action( 'customize_controls_print_footer_scripts', array( $menus, 'available_items_template' ) ) );
		$this->assertEquals( 10, add_action( 'customize_preview_init', array( $menus, 'customize_preview_init' ) ) );
		$this->assertEquals( 10, add_action( 'customize_preview_init', array( $menus, 'make_auto_draft_status_previewable' ) ) );
		$this->assertEquals( 10, add_action( 'customize_save_nav_menus_created_posts', array( $menus, 'save_nav_menus_created_posts' ) ) );
		$this->assertEquals( 10, add_filter( 'customize_dynamic_partial_args', array( $menus, 'customize_dynamic_partial_args' ) ) );
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
		self::factory()->post->create_many( 12, array( 'post_type' => 'page' ) );

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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Post Title' ) );

		// Create pages.
		self::factory()->post->create_many( 10 );

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
		$page_id = self::factory()->post->create( array( 'post_title' => 'Page Title', 'post_type' => 'page' ) );

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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Post Title' ) );

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
		$term_id = self::factory()->category->create( array( 'name' => 'Term Title' ) );

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

		// Create posts.
		$post_ids = array();
		$post_ids[] = self::factory()->post->create( array( 'post_title' => 'Search & Test' ) );
		$post_ids[] = self::factory()->post->create( array( 'post_title' => 'Some Other Title' ) );

		// Create terms.
		$term_ids = array();
		$term_ids[] = self::factory()->category->create( array( 'name' => 'Dogs Are Cool' ) );
		$term_ids[] = self::factory()->category->create( array( 'name' => 'Cats Drool' ) );

		// Test empty results.
		$expected = array();
		$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => 'This Does NOT Exist' ) );
		$this->assertEquals( $expected, $results );

		// Test posts.
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

		// Test terms.
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

		// Test filtered results.
		$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => 'cat' ) );
		$this->assertEquals( 1, count( $results ) );
		$count = $this->filter_count_customize_nav_menu_searched_items;
		add_filter( 'customize_nav_menu_searched_items', array( $this, 'filter_search' ), 10, 2 );
		$results = $menus->search_available_items_query( array( 'pagenum' => 1, 's' => 'cat' ) );
		$this->assertEquals( $count + 1, $this->filter_count_customize_nav_menu_searched_items );
		$this->assertInternalType( 'array', $results );
		$this->assertEquals( 2, count( $results ) );
		remove_filter( 'customize_nav_menu_searched_items', array( $this, 'filter_search' ), 10 );
	}

	/**
	 * Count for number of times customize_nav_menu_searched_items filtered.
	 *
	 * @var int
	 */
	protected $filter_count_customize_nav_menu_searched_items = 0;

	/**
	 * Filter to search menu items.
	 *
	 * @param array $items Items.
	 * @param array $args {
	 *     Search args.
	 *
	 *     @type int    $pagenum Page number.
	 *     @type string $s       Search string.
	 * }
	 * @return array Items.
	 */
	function filter_search( $items, $args ) {
		$this->assertInternalType( 'array', $items );
		$this->assertInternalType( 'array', $args );
		$this->assertArrayHasKey( 's', $args );
		$this->assertArrayHasKey( 'pagenum', $args );
		$this->filter_count_customize_nav_menu_searched_items += 1;

		if ( 'cat' === $args['s'] ) {
			array_unshift( $items, array(
				'id'         => 'home',
				'title'      => 'COOL CAT!',
				'type'       => 'custom',
				'type_label' => __( 'Custom Link' ),
				'object'     => '',
				'url'        => home_url( '/cool-cat' ),
			) );
		}
		return $items;
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

		wp_dequeue_style( 'customize-nav-menus' );
		wp_dequeue_script( 'customize-nav-menus' );
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
		$this->assertEquals( $expected['type'], $results['type'] );

		$expected = array( 'type' => 'nav_menu' );
		$results = $menus->filter_dynamic_setting_args( $this->wp_customize, 'nav_menu[123]' );
		$this->assertEquals( $expected['type'], $results['type'] );
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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type'      => 'post_type',
			'menu-item-object'    => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-title'     => 'Hello World',
			'menu-item-status'    => 'publish',
		) );
		do_action( 'customize_register', $this->wp_customize );
		$this->assertInstanceOf( 'WP_Customize_Nav_Menu_Item_Setting', $this->wp_customize->get_setting( "nav_menu_item[$item_id]" ) );
		$this->assertEquals( 'Primary', $this->wp_customize->get_section( "nav_menu[$menu_id]" )->title );
		$this->assertEquals( 'Hello World', $this->wp_customize->get_control( "nav_menu_item[$item_id]" )->label );

		$nav_menus_created_posts_setting = $this->wp_customize->get_setting( 'nav_menus_created_posts' );
		$this->assertInstanceOf( 'WP_Customize_Filter_Setting', $nav_menus_created_posts_setting );
		$this->assertEquals( 'postMessage', $nav_menus_created_posts_setting->transport );
		$this->assertEquals( array(), $nav_menus_created_posts_setting->default );
		$this->assertEquals( array( $this->wp_customize->nav_menus, 'sanitize_nav_menus_created_posts' ), $nav_menus_created_posts_setting->sanitize_callback );
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
			array( 'title' => 'Posts', 'type' => 'post_type', 'object' => 'post', 'type_label' => __( 'Post' ) ),
			array( 'title' => 'Pages', 'type' => 'post_type', 'object' => 'page', 'type_label' => __( 'Page' ) ),
			array( 'title' => 'Categories', 'type' => 'taxonomy', 'object' => 'category', 'type_label' => __( 'Category' ) ),
			array( 'title' => 'Tags', 'type' => 'taxonomy', 'object' => 'post_tag', 'type_label' => __( 'Tag' ) ),
		);

		if ( current_theme_supports( 'post-formats' ) ) {
			$expected[] = array( 'title' => 'Format', 'type' => 'taxonomy', 'object' => 'post_format', 'type_label' => __( 'Format' ) );
		}

		$this->assertEquals( $expected, $menus->available_item_types() );

		register_taxonomy( 'wptests_tax', array( 'post' ), array( 'labels' => array( 'name' => 'Foo' ) ) );
		$expected[] = array( 'title' => 'Foo', 'type' => 'taxonomy', 'object' => 'wptests_tax', 'type_label' => 'Foo' );

		$this->assertEquals( $expected, $menus->available_item_types() );

		$expected[] = array( 'title' => 'Custom', 'type' => 'custom_type', 'object' => 'custom_object', 'type_label' => 'Custom Type' );

		add_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );
		$this->assertEquals( $expected, $menus->available_item_types() );
		remove_filter( 'customize_nav_menu_available_item_types', array( $this, 'filter_item_types' ) );

	}

	/**
	 * Test insert_auto_draft_post method.
	 *
	 * @covers WP_Customize_Nav_Menus::insert_auto_draft_post()
	 */
	public function test_insert_auto_draft_post() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );

		$r = $menus->insert_auto_draft_post( array() );
		$this->assertInstanceOf( 'WP_Error', $r );
		$this->assertEquals( 'unknown_post_type', $r->get_error_code() );

		$r = $menus->insert_auto_draft_post( array( 'post_type' => 'fake' ) );
		$this->assertInstanceOf( 'WP_Error', $r );
		$this->assertEquals( 'unknown_post_type', $r->get_error_code() );

		$r = $menus->insert_auto_draft_post( array( 'post_status' => 'publish', 'post_title' => 'Bad', 'post_type' => 'post' ) );
		$this->assertInstanceOf( 'WP_Error', $r );
		$this->assertEquals( 'status_forbidden', $r->get_error_code() );

		$r = $menus->insert_auto_draft_post( array( 'post_title' => 'Hello World', 'post_type' => 'post' ) );
		$this->assertInstanceOf( 'WP_Post', $r );
		$this->assertEquals( 'Hello World', $r->post_title );
		$this->assertEquals( 'hello-world', $r->post_name );
		$this->assertEquals( 'post', $r->post_type );

		$r = $menus->insert_auto_draft_post( array( 'post_title' => 'Hello World', 'post_type' => 'post', 'post_name' => 'greetings-world', 'post_content' => 'Hi World' ) );
		$this->assertInstanceOf( 'WP_Post', $r );
		$this->assertEquals( 'Hello World', $r->post_title );
		$this->assertEquals( 'post', $r->post_type );
		$this->assertEquals( 'greetings-world', $r->post_name );
		$this->assertEquals( 'Hi World', $r->post_content );
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
				$this->assertRegExp( '#<h4 class="accordion-section-title".*>\s*' . esc_html( $type->labels->name ) . '#', $template );
				$this->assertContains( 'data-type="post_type"', $template );
				$this->assertContains( 'data-object="' . esc_attr( $type->name ) . '"', $template );
				$this->assertContains( 'data-type_label="' . esc_attr( $type->labels->singular_name ) . '"', $template );
			}
		}

		$taxonomies = get_taxonomies( array( 'show_in_nav_menus' => true ), 'object' );
		if ( $taxonomies ) {
			foreach ( $taxonomies as $tax ) {
				$this->assertContains( 'available-menu-items-taxonomy-' . esc_attr( $tax->name ), $template );
				$this->assertRegExp( '#<h4 class="accordion-section-title".*>\s*' . esc_html( $tax->labels->name ) . '#', $template );
				$this->assertContains( 'data-type="taxonomy"', $template );
				$this->assertContains( 'data-object="' . esc_attr( $tax->name ) . '"', $template );
				$this->assertContains( 'data-type_label="' . esc_attr( $tax->labels->singular_name ) . '"', $template );
			}
		}

		$this->assertContains( 'available-menu-items-custom_type', $template );
		$this->assertRegExp( '#<h4 class="accordion-section-title".*>\s*Custom#', $template );
		$this->assertContains( 'data-type="custom_type"', $template );
		$this->assertContains( 'data-object="custom_object"', $template );
		$this->assertContains( 'data-type_label="Custom Type"', $template );
	}

	/**
	 * Test WP_Customize_Nav_Menus::customize_dynamic_partial_args().
	 *
	 * @see WP_Customize_Nav_Menus::customize_dynamic_partial_args()
	 */
	function test_customize_dynamic_partial_args() {
		do_action( 'customize_register', $this->wp_customize );

		$args = apply_filters( 'customize_dynamic_partial_args', false, 'nav_menu_instance[68b329da9893e34099c7d8ad5cb9c940]' );
		$this->assertInternalType( 'array', $args );
		$this->assertEquals( 'nav_menu_instance', $args['type'] );
		$this->assertEquals( array( $this->wp_customize->nav_menus, 'render_nav_menu_partial' ), $args['render_callback'] );
		$this->assertTrue( $args['container_inclusive'] );

		$args = apply_filters( 'customize_dynamic_partial_args', array( 'fallback_refresh' => false ), 'nav_menu_instance[4099c7d8ad5cb9c94068b329da9893e3]' );
		$this->assertInternalType( 'array', $args );
		$this->assertEquals( 'nav_menu_instance', $args['type'] );
		$this->assertEquals( array( $this->wp_customize->nav_menus, 'render_nav_menu_partial' ), $args['render_callback'] );
		$this->assertTrue( $args['container_inclusive'] );
		$this->assertFalse( $args['fallback_refresh'] );
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
		$this->assertEquals( 10, has_action( 'wp_enqueue_scripts', array( $menus, 'customize_preview_enqueue_deps' ) ) );
		$this->assertEquals( 1000, has_filter( 'wp_nav_menu_args', array( $menus, 'filter_wp_nav_menu_args' ) ) );
		$this->assertEquals( 10, has_filter( 'wp_nav_menu', array( $menus, 'filter_wp_nav_menu' ) ) );
	}

	/**
	 * Test make_auto_draft_status_previewable.
	 *
	 * @covers WP_Customize_Nav_Menus::make_auto_draft_status_previewable()
	 */
	function test_make_auto_draft_status_previewable() {
		global $wp_post_statuses;
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );
		$menus->make_auto_draft_status_previewable();
		$this->assertTrue( $wp_post_statuses['auto-draft']->protected );
	}

	/**
	 * Test sanitize_nav_menus_created_posts.
	 *
	 * @covers WP_Customize_Nav_Menus::sanitize_nav_menus_created_posts()
	 */
	function test_sanitize_nav_menus_created_posts() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );
		$contributor_user_id = $this->factory()->user->create( array( 'role' => 'contributor' ) );
		$author_user_id = $this->factory()->user->create( array( 'role' => 'author' ) );
		$administrator_user_id = $this->factory()->user->create( array( 'role' => 'administrator' ) );

		$contributor_post_id = $this->factory()->post->create( array(
			'post_status' => 'auto-draft',
			'post_title' => 'Contributor Post',
			'post_type' => 'post',
			'post_author' => $contributor_user_id,
		) );
		$author_post_id = $this->factory()->post->create( array(
			'post_status' => 'auto-draft',
			'post_title' => 'Author Post',
			'post_type' => 'post',
			'post_author' => $author_user_id,
		) );
		$administrator_post_id = $this->factory()->post->create( array(
			'post_status' => 'auto-draft',
			'post_title' => 'Admin Post',
			'post_type' => 'post',
			'post_author' => $administrator_user_id,
		) );

		$value = array(
			'bad',
			$contributor_post_id,
			$author_post_id,
			$administrator_post_id,
		);

		wp_set_current_user( $contributor_user_id );
		$sanitized = $menus->sanitize_nav_menus_created_posts( $value );
		$this->assertEquals( array(), $sanitized );

		wp_set_current_user( $author_user_id );
		$sanitized = $menus->sanitize_nav_menus_created_posts( $value );
		$this->assertEquals( array( $author_post_id ), $sanitized );

		wp_set_current_user( $administrator_user_id );
		$sanitized = $menus->sanitize_nav_menus_created_posts( $value );
		$this->assertEquals( array( $contributor_post_id, $author_post_id, $administrator_post_id ), $sanitized );
	}

	/**
	 * Test save_nav_menus_created_posts.
	 *
	 * @covers WP_Customize_Nav_Menus::save_nav_menus_created_posts()
	 */
	function test_save_nav_menus_created_posts() {
		$menus = new WP_Customize_Nav_Menus( $this->wp_customize );
		do_action( 'customize_register', $this->wp_customize );

		$post_ids = $this->factory()->post->create_many( 3, array(
			'post_status' => 'auto-draft',
			'post_type' => 'post',
			'post_name' => 'auto-draft',
		) );
		$pre_published_post_id = $this->factory()->post->create( array( 'post_status' => 'publish' ) );

		$setting_id = 'nav_menus_created_posts';
		$this->wp_customize->set_post_value( $setting_id, array_merge( $post_ids, array( $pre_published_post_id ) ) );
		$setting = $this->wp_customize->get_setting( $setting_id );
		$this->assertInstanceOf( 'WP_Customize_Filter_Setting', $setting );
		$this->assertEquals( array( $menus, 'sanitize_nav_menus_created_posts' ), $setting->sanitize_callback );
		$this->assertEquals( $post_ids, $setting->post_value() );
		foreach ( $post_ids as $post_id ) {
			$this->assertEquals( 'auto-draft', get_post_status( $post_id ) );
		}

		$save_action_count = did_action( 'customize_save_nav_menus_created_posts' );
		$setting->save();
		$this->assertEquals( $save_action_count + 1, did_action( 'customize_save_nav_menus_created_posts' ) );
		foreach ( $post_ids as $post_id ) {
			$this->assertEquals( 'publish', get_post_status( $post_id ) );
		}

		// Ensure that unique slugs were assigned.
		$posts = array_map( 'get_post', $post_ids );
		$post_names = wp_list_pluck( $posts, 'post_name' );
		$this->assertEqualSets( $post_names, array_unique( $post_names ) );
	}

	/**
	 * Test the filter_wp_nav_menu_args method.
	 *
	 * @see WP_Customize_Nav_Menus::filter_wp_nav_menu_args()
	 */
	function test_filter_wp_nav_menu_args() {
		do_action( 'customize_register', $this->wp_customize );
		$menus = $this->wp_customize->nav_menus;
		$menu_id = wp_create_nav_menu( 'Foo' );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => $menu_id,
			'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );
		$this->assertArrayHasKey( 'customize_preview_nav_menus_args', $results );
		$this->assertTrue( $results['can_partial_refresh'] );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => false,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => new Walker_Nav_Menu(),
			'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );
		$this->assertFalse( $results['can_partial_refresh'] );
		$this->assertArrayHasKey( 'customize_preview_nav_menus_args', $results );
		$this->assertEquals( 'wp_page_menu', $results['fallback_cb'] );

		$nav_menu_term = get_term( wp_create_nav_menu( 'Bar' ) );
		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => $nav_menu_term,
			'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );
		$this->assertTrue( $results['can_partial_refresh'] );
		$this->assertArrayHasKey( 'customize_preview_nav_menus_args', $results );
		$this->assertEquals( $nav_menu_term->term_id, $results['customize_preview_nav_menus_args']['menu'] );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => $menu_id,
			'container'       => 'div',
			'items_wrap'      => '%3$s',
		) );
		$this->assertTrue( $results['can_partial_refresh'] );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => $menu_id,
			'container'       => false,
			'items_wrap'      => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );
		$this->assertTrue( $results['can_partial_refresh'] );

		$results = $menus->filter_wp_nav_menu_args( array(
			'echo'            => true,
			'fallback_cb'     => 'wp_page_menu',
			'walker'          => '',
			'menu'            => $menu_id,
			'container'       => false,
			'items_wrap'      => '%3$s',
		) );
		$this->assertFalse( $results['can_partial_refresh'] );
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
			'items_wrap'  => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );

		ob_start();
		wp_nav_menu( $args );
		$nav_menu_content = ob_get_clean();

		$result = $menus->filter_wp_nav_menu( $nav_menu_content, (object) $args );

		$this->assertContains( sprintf( ' data-customize-partial-id="nav_menu_instance[%s]"', $args['customize_preview_nav_menus_args']['args_hmac'] ), $result );
		$this->assertContains( ' data-customize-partial-type="nav_menu_instance"', $result );
		$this->assertContains( ' data-customize-partial-placement-context="', $result );
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
	}

	/**
	 * Test WP_Customize_Nav_Menus::export_preview_data() method.
	 *
	 * @see WP_Customize_Nav_Menus::export_preview_data()
	 */
	function test_export_preview_data() {
		ob_start();
		$this->wp_customize->nav_menus->export_preview_data();
		$html = ob_get_clean();
		$this->assertTrue( (bool) preg_match( '/_wpCustomizePreviewNavMenusExports = ({.+})/s', $html, $matches ) );
		$exported_data = json_decode( $matches[1], true );
		$this->assertArrayHasKey( 'navMenuInstanceArgs', $exported_data );
	}

	/**
	 * Test WP_Customize_Nav_Menus::render_nav_menu_partial() method.
	 *
	 * @see WP_Customize_Nav_Menus::render_nav_menu_partial()
	 */
	function test_render_nav_menu_partial() {
		$this->wp_customize->nav_menus->customize_preview_init();

		$menu = wp_create_nav_menu( 'Foo' );
		wp_update_nav_menu_item( $menu, 0, array(
			'menu-item-type' => 'custom',
			'menu-item-title' => 'WordPress.org',
			'menu-item-url' => 'https://wordpress.org',
			'menu-item-status' => 'publish',
		) );

		$nav_menu_args = $this->wp_customize->nav_menus->filter_wp_nav_menu_args( array(
			'echo'        => true,
			'menu'        => $menu,
			'fallback_cb' => 'wp_page_menu',
			'walker'      => '',
			'items_wrap'  => '<ul id="%1$s" class="%2$s">%3$s</ul>',
		) );

		$partial_id = sprintf( 'nav_menu_instance[%s]', $nav_menu_args['customize_preview_nav_menus_args']['args_hmac'] );
		$partials = $this->wp_customize->selective_refresh->add_dynamic_partials( array( $partial_id ) );
		$this->assertNotEmpty( $partials );
		$partial = array_shift( $partials );
		$this->assertEquals( $partial_id, $partial->id );

		$missing_args_hmac_args = array_merge(
			$nav_menu_args['customize_preview_nav_menus_args'],
			array( 'args_hmac' => null )
		);
		$this->assertFalse( $partial->render( $missing_args_hmac_args ) );

		$args_hmac_mismatch_args = array_merge(
			$nav_menu_args['customize_preview_nav_menus_args'],
			array( 'args_hmac' => strrev( $nav_menu_args['customize_preview_nav_menus_args']['args_hmac'] ) )
		);
		$this->assertFalse( $partial->render( $args_hmac_mismatch_args ) );

		$rendered = $partial->render( $nav_menu_args['customize_preview_nav_menus_args'] );
		$this->assertContains( 'data-customize-partial-type="nav_menu_instance"', $rendered );
		$this->assertContains( 'WordPress.org', $rendered );
	}
}
