<?php
/**
 * Tests WP_Customize_Nav_Menu_Item_Setting.
 *
 * @group customize
 */
class Test_WP_Customize_Nav_Menu_Item_Setting extends WP_UnitTestCase {

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
	 * Filter to add a custom menu item type label.
	 *
	 * @param object $menu_item Menu item.
	 * @return object
	 */
	function filter_type_label( $menu_item ) {
		if ( 'custom_type' === $menu_item->type ) {
			$menu_item->type_label = 'Custom Label';
		}

		return $menu_item;
	}

	/**
	 * Test constants and statics.
	 */
	function test_constants() {
		do_action( 'customize_register', $this->wp_customize );
		$this->assertTrue( post_type_exists( WP_Customize_Nav_Menu_Item_Setting::POST_TYPE ) );
	}

	/**
	 * Test constructor.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::__construct()
	 */
	function test_construct() {
		do_action( 'customize_register', $this->wp_customize );

		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, 'nav_menu_item[123]' );
		$this->assertEquals( 'nav_menu_item', $setting->type );
		$this->assertEquals( 'postMessage', $setting->transport );
		$this->assertEquals( 123, $setting->post_id );
		$this->assertNull( $setting->previous_post_id );
		$this->assertNull( $setting->update_status );
		$this->assertNull( $setting->update_error );
		$this->assertInternalType( 'array', $setting->default );

		$default = array(
			'object_id' => 0,
			'object' => '',
			'menu_item_parent' => 0,
			'position' => 0,
			'type' => 'custom',
			'title' => '',
			'url' => '',
			'target' => '',
			'attr_title' => '',
			'description' => '',
			'classes' => '',
			'xfn' => '',
			'status' => 'publish',
			'original_title' => '',
			'nav_menu_term_id' => 0,
		);
		$this->assertEquals( $default, $setting->default );

		$exception = null;
		try {
			$bad_setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, 'foo_bar_baz' );
			unset( $bad_setting );
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'Exception', $exception );
	}

	/**
	 * Test empty constructor.
	 */
	function test_construct_empty_menus() {
		do_action( 'customize_register', $this->wp_customize );
		$_wp_customize = $this->wp_customize;
		unset($_wp_customize->nav_menus);

		$exception = null;
		try {
			$bad_setting = new WP_Customize_Nav_Menu_Item_Setting( $_wp_customize, 'nav_menu_item[123]' );
			unset( $bad_setting );
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'Exception', $exception );
	}

	/**
	 * Test constructor for placeholder (draft) menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::__construct()
	 */
	function test_construct_placeholder() {
		do_action( 'customize_register', $this->wp_customize );
		$default = array(
			'title' => 'Lorem',
			'description' => 'ipsum',
			'menu_item_parent' => 123,
		);
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, 'nav_menu_item[-5]', compact( 'default' ) );
		$this->assertEquals( -5, $setting->post_id );
		$this->assertNull( $setting->previous_post_id );
		$this->assertEquals( $default, $setting->default );
	}

	/**
	 * Test value method with post.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_value_type_post_type() {
		do_action( 'customize_register', $this->wp_customize );

		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );

		$menu_id = wp_create_nav_menu( 'Menu' );
		$item_title = 'Greetings';
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-title' => $item_title,
			'menu-item-status' => 'publish',
		) );

		$post = get_post( $item_id );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->assertEquals( $item_title, $menu_item->title );

		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );

		$value = $setting->value();
		$this->assertEquals( $menu_item->title, $value['title'] );
		$this->assertEquals( $menu_item->type, $value['type'] );
		$this->assertEquals( $menu_item->object_id, $value['object_id'] );
		$this->assertEquals( $menu_id, $value['nav_menu_term_id'] );
		$this->assertEquals( 'Hello World', $value['original_title'] );

		$other_menu_id = wp_create_nav_menu( 'Menu2' );
		wp_update_nav_menu_item( $other_menu_id, $item_id, array(
			'menu-item-title' => 'Hola',
		) );
		$value = $setting->value();
		$this->assertEquals( 'Hola', $value['title'] );
		$this->assertEquals( $other_menu_id, $value['nav_menu_term_id'] );
	}

	/**
	 * Test value method with taxonomy.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_value_type_taxonomy() {
		do_action( 'customize_register', $this->wp_customize );

		$tax_id = $this->factory->category->create( array( 'name' => 'Salutations' ) );

		$menu_id = wp_create_nav_menu( 'Menu' );
		$item_title = 'Greetings';
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'category',
			'menu-item-object-id' => $tax_id,
			'menu-item-title' => $item_title,
			'menu-item-status' => 'publish',
		) );

		$post = get_post( $item_id );
		$menu_item = wp_setup_nav_menu_item( $post );
		$this->assertEquals( $item_title, $menu_item->title );

		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );

		$value = $setting->value();
		$this->assertEquals( $menu_item->title, $value['title'] );
		$this->assertEquals( $menu_item->type, $value['type'] );
		$this->assertEquals( $menu_item->object_id, $value['object_id'] );
		$this->assertEquals( $menu_id, $value['nav_menu_term_id'] );
		$this->assertEquals( 'Salutations', $value['original_title'] );
	}

	/**
	 * Test value method with a custom object.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_custom_type_label() {
		do_action( 'customize_register', $this->wp_customize );
		add_filter( 'wp_setup_nav_menu_item', array( $this, 'filter_type_label' ) );

		$menu_id = wp_create_nav_menu( 'Menu' );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type'   => 'custom_type',
			'menu-item-object' => 'custom_object',
			'menu-item-title'  => 'Cool beans',
			'menu-item-status' => 'publish',
		) );

		$post = get_post( $item_id );
		$menu_item = wp_setup_nav_menu_item( $post );

		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );

		$value = $setting->value();
		$this->assertEquals( $menu_item->type_label, 'Custom Label' );
		$this->assertEquals( $menu_item->type_label, $value['type_label'] );
	}

	/**
	 * Test value method returns zero for nav_menu_term_id when previewing a new menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_value_nav_menu_term_id_returns_zero() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = -123;
		$post_value = array(
			'name' => 'Secondary',
			'description' => '',
			'parent' => 0,
			'auto_add' => false,
		);
		$setting_id = "nav_menu[$menu_id]";
		$menu = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$this->wp_customize->set_post_value( $menu->id, $post_value );
		$menu->preview();
		$value = $menu->value();
		$this->assertEquals( $post_value, $value );

		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-title' => 'Hello World',
			'menu-item-status' => 'publish',
		) );

		$post = get_post( $item_id );
		$menu_item = wp_setup_nav_menu_item( $post );

		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$value = $setting->value();
		$this->assertEquals( 0, $value['nav_menu_term_id'] );
	}

	/**
	 * Test preview method for updated menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::preview()
	 */
	function test_preview_updated() {
		do_action( 'customize_register', $this->wp_customize );

		$first_post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$second_post_id = $this->factory->post->create( array( 'post_title' => 'Hola Muno' ) );

		$primary_menu_id = wp_create_nav_menu( 'Primary' );
		$secondary_menu_id = wp_create_nav_menu( 'Secondary' );
		$item_title = 'Greetings';
		$item_id = wp_update_nav_menu_item( $primary_menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $first_post_id,
			'menu-item-title' => $item_title,
			'menu-item-status' => 'publish',
		) );
		$this->assertNotEmpty( wp_get_nav_menu_items( $primary_menu_id, array( 'post_status' => 'publish,draft' ) ) );

		$post_value = array(
			'type' => 'post_type',
			'object' => 'post',
			'object_id' => $second_post_id,
			'title' => 'Saludos',
			'status' => 'publish',
			'nav_menu_term_id' => $secondary_menu_id,
		);
		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, $post_value );
		unset( $post_value['nav_menu_term_id'] );
		$setting->preview();

		// Make sure the menu item appears in the new menu.
		$this->assertNotContains( $item_id, wp_list_pluck( wp_get_nav_menu_items( $primary_menu_id ), 'db_id' ) );
		$menu_items = wp_get_nav_menu_items( $secondary_menu_id );
		$db_ids = wp_list_pluck( $menu_items, 'db_id' );
		$this->assertContains( $item_id, $db_ids );
		$i = array_search( $item_id, $db_ids );
		$updated_item = $menu_items[ $i ];
		$post_value['post_status'] = $post_value['status'];
		unset( $post_value['status'] );
		foreach ( $post_value as $key => $value ) {
			$this->assertEquals( $value, $updated_item->$key, "Key $key mismatch" );
		}
	}

	/**
	 * Test preview method for inserted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::preview()
	 */
	function test_preview_inserted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_create_nav_menu( 'Primary' );
		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_ids = array();
		for ( $i = 0; $i < 5; $i += 1 ) {
			$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-type' => 'post_type',
				'menu-item-object' => 'post',
				'menu-item-object-id' => $post_id,
				'menu-item-title' => "Item $i",
				'menu-item-status' => 'publish',
				'menu-item-position' => $i + 1,
			) );
			$item_ids[] = $item_id;
		}

		$post_value = array(
			'type' => 'post_type',
			'object' => 'post',
			'object_id' => $post_id,
			'title' => 'Inserted item',
			'status' => 'publish',
			'nav_menu_term_id' => $menu_id,
			'position' => count( $item_ids ) + 1,
		);

		$new_item_id = -10;
		$setting_id = "nav_menu_item[$new_item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, $post_value );
		unset( $post_value['nav_menu_term_id'] );

		$current_items = wp_get_nav_menu_items( $menu_id );
		$setting->preview();
		$preview_items = wp_get_nav_menu_items( $menu_id );
		$this->assertNotEquals( count( $current_items ), count( $preview_items ) );

		$last_item = array_pop( $preview_items );
		$this->assertEquals( $new_item_id, $last_item->db_id );
		$post_value['post_status'] = $post_value['status'];
		unset( $post_value['status'] );
		$post_value['menu_order'] = $post_value['position'];
		unset( $post_value['position'] );
		foreach ( $post_value as $key => $value ) {
			$this->assertEquals( $value, $last_item->$key, "Mismatch for $key property." );
		}
	}

	/**
	 * Test preview method for deleted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::preview()
	 */
	function test_preview_deleted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_create_nav_menu( 'Primary' );
		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_ids = array();
		for ( $i = 0; $i < 5; $i += 1 ) {
			$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-type' => 'post_type',
				'menu-item-object' => 'post',
				'menu-item-object-id' => $post_id,
				'menu-item-title' => "Item $i",
				'menu-item-status' => 'publish',
				'menu-item-position' => $i + 1,
			) );
			$item_ids[] = $item_id;
		}

		$delete_item_id = $item_ids[2];
		$setting_id = "nav_menu_item[$delete_item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, false );

		$current_items = wp_get_nav_menu_items( $menu_id );
		$this->assertContains( $delete_item_id, wp_list_pluck( $current_items, 'db_id' ) );
		$setting->preview();
		$preview_items = wp_get_nav_menu_items( $menu_id );
		$this->assertNotEquals( count( $current_items ), count( $preview_items ) );
		$this->assertContains( $delete_item_id, wp_list_pluck( $current_items, 'db_id' ) );
	}

	/**
	 * Test sanitize method.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::sanitize()
	 */
	function test_sanitize() {
		do_action( 'customize_register', $this->wp_customize );
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, 'nav_menu_item[123]' );

		$this->assertNull( $setting->sanitize( 'not an array' ) );
		$this->assertNull( $setting->sanitize( 123 ) );

		$unsanitized = array(
			'object_id' => 'bad',
			'object' => '<b>hello</b>',
			'menu_item_parent' => 'asdasd',
			'position' => -123,
			'type' => 'custom<b>',
			'title' => 'Hi<script>alert(1)</script>',
			'url' => 'javascript:alert(1)',
			'target' => '" onclick="',
			'attr_title' => '<b>evil</b>',
			'description' => '<b>Hello world</b>',
			'classes' => 'hello " inject="',
			'xfn' => 'hello " inject="',
			'status' => 'forbidden',
			'original_title' => 'Hi<script>alert(1)</script>',
			'nav_menu_term_id' => 'heilo',
		);

		$sanitized = $setting->sanitize( $unsanitized );
		$this->assertEqualSets( array_keys( $unsanitized ), array_keys( $sanitized ) );

		$this->assertEquals( 0, $sanitized['object_id'] );
		$this->assertEquals( 'bhellob', $sanitized['object'] );
		$this->assertEquals( 0, $sanitized['menu_item_parent'] );
		$this->assertEquals( 0, $sanitized['position'] );
		$this->assertEquals( 'customb', $sanitized['type'] );
		$this->assertEquals( 'Hi', $sanitized['title'] );
		$this->assertEquals( '', $sanitized['url'] );
		$this->assertEquals( 'onclick', $sanitized['target'] );
		$this->assertEquals( 'evil', $sanitized['attr_title'] );
		$this->assertEquals( 'Hello world', $sanitized['description'] );
		$this->assertEquals( 'hello  inject', $sanitized['classes'] );
		$this->assertEquals( 'hello  inject', $sanitized['xfn'] );
		$this->assertEquals( 'publish', $sanitized['status'] );
		$this->assertEquals( 'Hi', $sanitized['original_title'] );
		$this->assertEquals( 0, $sanitized['nav_menu_term_id'] );
	}

	/**
	 * Test protected update() method via the save() method, for updated menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::update()
	 */
	function test_save_updated() {
		do_action( 'customize_register', $this->wp_customize );

		$first_post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$second_post_id = $this->factory->post->create( array( 'post_title' => 'Hola Muno' ) );

		$primary_menu_id = wp_create_nav_menu( 'Primary' );
		$secondary_menu_id = wp_create_nav_menu( 'Secondary' );
		$item_title = 'Greetings';
		$item_id = wp_update_nav_menu_item( $primary_menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $first_post_id,
			'menu-item-title' => $item_title,
			'menu-item-status' => 'publish',
		) );
		$this->assertNotEmpty( wp_get_nav_menu_items( $primary_menu_id, array( 'post_status' => 'publish,draft' ) ) );

		$post_value = array(
			'type' => 'post_type',
			'object' => 'post',
			'object_id' => $second_post_id,
			'title' => 'Saludos',
			'status' => 'publish',
			'nav_menu_term_id' => $secondary_menu_id,
		);
		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, $post_value );
		unset( $post_value['nav_menu_term_id'] );
		$setting->save();

		// Make sure the menu item appears in the new menu.
		$this->assertNotContains( $item_id, wp_list_pluck( wp_get_nav_menu_items( $primary_menu_id ), 'db_id' ) );
		$menu_items = wp_get_nav_menu_items( $secondary_menu_id );
		$db_ids = wp_list_pluck( $menu_items, 'db_id' );
		$this->assertContains( $item_id, $db_ids );
		$i = array_search( $item_id, $db_ids );
		$updated_item = $menu_items[ $i ];
		$post_value['post_status'] = $post_value['status'];
		unset( $post_value['status'] );
		foreach ( $post_value as $key => $value ) {
			$this->assertEquals( $value, $updated_item->$key, "Key $key mismatch" );
		}

		// Verify the Ajax responses is being amended.
		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_item_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_item_updates'] );
		$this->assertArrayHasKey( 'post_id', $update_result );
		$this->assertArrayHasKey( 'previous_post_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );

		$this->assertEquals( $item_id, $update_result['post_id'] );
		$this->assertNull( $update_result['previous_post_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'updated', $update_result['status'] );
	}

	/**
	 * Test protected update() method via the save() method, for inserted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::update()
	 */
	function test_save_inserted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_create_nav_menu( 'Primary' );
		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_ids = array();
		for ( $i = 0; $i < 5; $i += 1 ) {
			$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-type' => 'post_type',
				'menu-item-object' => 'post',
				'menu-item-object-id' => $post_id,
				'menu-item-title' => "Item $i",
				'menu-item-status' => 'publish',
				'menu-item-position' => $i + 1,
			) );
			$item_ids[] = $item_id;
		}

		$post_value = array(
			'type' => 'post_type',
			'object' => 'post',
			'object_id' => $post_id,
			'title' => 'Inserted item',
			'status' => 'publish',
			'nav_menu_term_id' => $menu_id,
			'position' => count( $item_ids ) + 1,
		);

		$new_item_id = -10;
		$setting_id = "nav_menu_item[$new_item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, $post_value );
		unset( $post_value['nav_menu_term_id'] );

		$current_items = wp_get_nav_menu_items( $menu_id );
		$setting->save();
		$preview_items = wp_get_nav_menu_items( $menu_id );
		$this->assertNotEquals( count( $current_items ), count( $preview_items ) );

		$last_item = array_pop( $preview_items );
		$this->assertEquals( $setting->post_id, $last_item->db_id );
		$post_value['post_status'] = $post_value['status'];
		unset( $post_value['status'] );
		$post_value['menu_order'] = $post_value['position'];
		unset( $post_value['position'] );
		foreach ( $post_value as $key => $value ) {
			$this->assertEquals( $value, $last_item->$key, "Mismatch for $key property." );
		}

		// Verify the Ajax responses is being amended.
		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_item_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_item_updates'] );
		$this->assertArrayHasKey( 'post_id', $update_result );
		$this->assertArrayHasKey( 'previous_post_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );

		$this->assertEquals( $setting->post_id, $update_result['post_id'] );
		$this->assertEquals( $new_item_id, $update_result['previous_post_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'inserted', $update_result['status'] );
	}

	/**
	 * Test protected update() method via the save() method, for deleted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::update()
	 */
	function test_save_deleted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_create_nav_menu( 'Primary' );
		$post_id = $this->factory->post->create( array( 'post_title' => 'Hello World' ) );
		$item_ids = array();
		for ( $i = 0; $i < 5; $i += 1 ) {
			$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
				'menu-item-type' => 'post_type',
				'menu-item-object' => 'post',
				'menu-item-object-id' => $post_id,
				'menu-item-title' => "Item $i",
				'menu-item-status' => 'publish',
				'menu-item-position' => $i + 1,
			) );
			$item_ids[] = $item_id;
		}

		$delete_item_id = $item_ids[2];
		$setting_id = "nav_menu_item[$delete_item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting_id, false );

		$current_items = wp_get_nav_menu_items( $menu_id );
		$this->assertContains( $delete_item_id, wp_list_pluck( $current_items, 'db_id' ) );
		$setting->save();
		$preview_items = wp_get_nav_menu_items( $menu_id );
		$this->assertNotEquals( count( $current_items ), count( $preview_items ) );
		$this->assertContains( $delete_item_id, wp_list_pluck( $current_items, 'db_id' ) );

		// Verify the Ajax responses is being amended.
		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_item_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_item_updates'] );
		$this->assertArrayHasKey( 'post_id', $update_result );
		$this->assertArrayHasKey( 'previous_post_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );

		$this->assertEquals( $delete_item_id, $update_result['post_id'] );
		$this->assertNull( $update_result['previous_post_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'deleted', $update_result['status'] );
	}

}
