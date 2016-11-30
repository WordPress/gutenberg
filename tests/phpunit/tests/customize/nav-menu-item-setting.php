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
			'_invalid' => false,
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

		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );

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
	 * Test value method with post without nav menu item title (label).
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_value_type_post_type_without_label() {
		do_action( 'customize_register', $this->wp_customize );

		$original_title = 'Hello World';
		$post_id = self::factory()->post->create( array( 'post_title' => $original_title ) );

		$menu_id = wp_create_nav_menu( 'Menu' );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'post',
			'menu-item-object-id' => $post_id,
			'menu-item-title' => '',
			'menu-item-status' => 'publish',
		) );

		$setting_id = "nav_menu_item[$item_id]";
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );

		$value = $setting->value();
		$this->assertEquals( '', $value['title'] );
		$this->assertEquals( $original_title, $value['original_title'] );
	}

	/**
	 * Test value method with taxonomy.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value()
	 */
	function test_value_type_taxonomy() {
		do_action( 'customize_register', $this->wp_customize );

		$tax_id = self::factory()->category->create( array( 'name' => 'Salutations' ) );

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

		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
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

		$first_post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
		$second_post_id = self::factory()->post->create( array( 'post_title' => 'Hola Muno' ) );

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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
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

		$menu_id = wp_create_nav_menu( 'Primary' );
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, 'nav_menu_item[123]' );

		$this->assertNull( $setting->sanitize( 'not an array' ) );
		$this->assertNull( $setting->sanitize( 123 ) );

		$unsanitized = array(
			'object_id' => 'bad',
			'object' => '<b>hello</b>',
			'menu_item_parent' => 'asdasd',
			'position' => -123,
			'type' => 'custom<b>',
			'title' => '\o/ o\'o Hi<script>unfilteredHtml()</script>',
			'url' => 'javascript:alert(1)',
			'target' => '" onclick="',
			'attr_title' => '\o/ o\'o <b>bolded</b><script>unfilteredHtml()</script>',
			'description' => '\o/ o\'o <b>Hello world</b><script>unfilteredHtml()</script>',
			'classes' => 'hello " inject="',
			'xfn' => 'hello " inject="',
			'status' => 'forbidden',
			'original_title' => 'Hi<script>unfilteredHtml()</script>',
			'nav_menu_term_id' => 'heilo',
			'_invalid' => false,
		);

		$expected_sanitized = array(
			'object_id' => 0,
			'object' => 'bhellob',
			'menu_item_parent' => 0,
			'position' => -123,
			'type' => 'customb',
			'title' => current_user_can( 'unfiltered_html' ) ? '\o/ o\'o Hi<script>unfilteredHtml()</script>' : '\o/ o\'o HiunfilteredHtml()',
			'url' => '',
			'target' => 'onclick',
			'attr_title' => current_user_can( 'unfiltered_html' ) ? '\o/ o\'o <b>bolded</b><script>unfilteredHtml()</script>' : '\o/ o\'o <b>bolded</b>unfilteredHtml()',
			'description' => current_user_can( 'unfiltered_html' ) ? '\o/ o\'o <b>Hello world</b><script>unfilteredHtml()</script>' : '\o/ o\'o <b>Hello world</b>unfilteredHtml()',
			'classes' => 'hello  inject',
			'xfn' => 'hello  inject',
			'status' => 'draft',
			'original_title' => 'Hi',
			'nav_menu_term_id' => 0,
		);

		$sanitized = $setting->sanitize( $unsanitized );
		$this->assertEqualSets( array_keys( $unsanitized ), array_keys( $sanitized ) );

		foreach ( $expected_sanitized as $key => $value ) {
			$this->assertEquals( $value, $sanitized[ $key ], "Expected $key to be sanitized." );
		}

		$nav_menu_item_id = wp_update_nav_menu_item( $menu_id, 0, wp_slash( array(
			'menu-item-object-id' => $unsanitized['object_id'],
			'menu-item-object' => $unsanitized['object'],
			'menu-item-parent-id' => $unsanitized['menu_item_parent'],
			'menu-item-position' => $unsanitized['position'],
			'menu-item-type' => $unsanitized['type'],
			'menu-item-title' => $unsanitized['title'],
			'menu-item-url' => $unsanitized['url'],
			'menu-item-description' => $unsanitized['description'],
			'menu-item-attr-title' => $unsanitized['attr_title'],
			'menu-item-target' => $unsanitized['target'],
			'menu-item-classes' => $unsanitized['classes'],
			'menu-item-xfn' => $unsanitized['xfn'],
			'menu-item-status' => $unsanitized['status'],
		) ) );

		$post = get_post( $nav_menu_item_id );
		$nav_menu_item = wp_setup_nav_menu_item( clone $post );

		$this->assertEquals( $expected_sanitized['object_id'], $nav_menu_item->object_id );
		$this->assertEquals( $expected_sanitized['object'], $nav_menu_item->object );
		$this->assertEquals( $expected_sanitized['menu_item_parent'], $nav_menu_item->menu_item_parent );
		$this->assertEquals( $expected_sanitized['position'], $post->menu_order );
		$this->assertEquals( $expected_sanitized['type'], $nav_menu_item->type );
		$this->assertEquals( $expected_sanitized['title'], $post->post_title );
		$this->assertEquals( $expected_sanitized['url'], $nav_menu_item->url );
		$this->assertEquals( $expected_sanitized['description'], $post->post_content );
		$this->assertEquals( $expected_sanitized['attr_title'], $post->post_excerpt );
		$this->assertEquals( $expected_sanitized['target'], $nav_menu_item->target );
		$this->assertEquals( $expected_sanitized['classes'], implode( ' ', $nav_menu_item->classes ) );
		$this->assertEquals( $expected_sanitized['xfn'], $nav_menu_item->xfn );
		$this->assertEquals( $expected_sanitized['status'], $post->post_status );
	}

	/**
	 * Test protected update() method via the save() method, for updated menu.
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::update()
	 */
	function test_save_updated() {
		do_action( 'customize_register', $this->wp_customize );

		$first_post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
		$second_post_id = self::factory()->post->create( array( 'post_title' => 'Hola Muno' ) );

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
			'title' => 'Saludos \o/ o\'o',
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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
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
		$post_id = self::factory()->post->create( array( 'post_title' => 'Hello World' ) );
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

	/**
	 * @ticket 33665
	 */
	function test_invalid_nav_menu_item() {
		$menu_id = wp_create_nav_menu( 'Primary' );
		register_post_type( 'poem', array(
			'public' => true,
		) );

		$post_id = self::factory()->post->create( array( 'post_type' => 'poem', 'post_title' => 'Code is poetry.' ) );
		$post = get_post( $post_id );
		$item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'poem',
			'menu-item-object-id' => $post_id,
			'menu-item-title' => $post->post_title,
			'menu-item-status' => 'publish',
			'menu-item-position' => 1,
		) );
		$setting_id = "nav_menu_item[$item_id]";

		do_action( 'customize_register', $this->wp_customize );
		$setting = $this->wp_customize->get_setting( $setting_id );
		$this->assertNotEmpty( $setting );
		$value = $setting->value();
		$this->assertFalse( $value['_invalid'] );
		$value_object = $setting->value_as_wp_post_nav_menu_item();
		$this->assertFalse( $value_object->_invalid );

		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$value = $setting->value();
		$this->assertFalse( $value['_invalid'] );
		$value_object = $setting->value_as_wp_post_nav_menu_item();
		$this->assertFalse( $value_object->_invalid );

		_unregister_post_type( 'poem' );
		$setting = new WP_Customize_Nav_Menu_Item_Setting( $this->wp_customize, $setting_id );
		$value = $setting->value();
		$this->assertTrue( $value['_invalid'] );
		$value_object = $setting->value_as_wp_post_nav_menu_item();
		$this->assertTrue( $value_object->_invalid );
	}

	/**
	 * Test WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item().
	 *
	 * @see WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item()
	 */
	function test_value_as_wp_post_nav_menu_item() {
		$post_id = self::factory()->post->create();

		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[123]'
		);
		$post_value = array(
			'object_id'        => $post_id,
			'object'           => 'post',
			'menu_item_parent' => 0,
			'position'         => 2,
			'type'             => 'custom_type',
			'title'            => 'Hello \o/ o\'o World',
			'url'              => '',
			'target'           => '',
			'attr_title'       => '">att \o/ o\'o empted <b>baddie</b>',
			'description'      => 'Attempted \o/ o\'o <b>markup</b>',
			'classes'          => '',
			'xfn'              => '',
			'status'           => 'publish',
			'original_title'   => '',
			'nav_menu_term_id' => 0,
			'_invalid'         => false,
		);
		$this->wp_customize->set_post_value( $setting->id, $post_value );

		$setting->preview();

		$item_value = $setting->value();
		$this->assertArrayHasKey( 'type_label', $item_value );
		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( 'Custom Link', $nav_menu_item->type_label );
		$this->assertEquals( $item_value['type_label'], $nav_menu_item->type_label );
		add_filter( 'wp_setup_nav_menu_item', array( $this, 'filter_type_label' ) );
		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( 'Custom Label', $nav_menu_item->type_label );

		$this->assertObjectNotHasAttribute( 'nav_menu_term_id', $nav_menu_item );
		$this->assertObjectNotHasAttribute( 'status', $nav_menu_item );
		$this->assertEquals( 'publish', $nav_menu_item->post_status );
		$this->assertEquals( 'nav_menu_item', $nav_menu_item->post_type );
		$this->assertObjectNotHasAttribute( 'position', $nav_menu_item );
		$this->assertEquals( $post_value['position'], $nav_menu_item->menu_order );
		$this->assertEquals( $post_value['title'], $nav_menu_item->post_title );
		$this->assertEquals( 123, $nav_menu_item->ID );
		$this->assertEquals( 123, $nav_menu_item->db_id );
		$this->assertEquals( wp_get_current_user()->ID, $nav_menu_item->post_author );
		$this->assertObjectHasAttribute( 'type_label', $nav_menu_item );
		$expected = apply_filters( 'nav_menu_attr_title', wp_unslash( apply_filters( 'excerpt_save_pre', wp_slash( $post_value['attr_title'] ) ) ) );
		$this->assertEquals( $expected, $nav_menu_item->attr_title );
		$this->assertEquals( 'Attempted \o/ o&#8217;o markup', $nav_menu_item->description );
	}

	/**
	 * Test WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item() to set url for posts, terms, and post type archives.
	 *
	 * @ticket 38945
	 * @covers WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item()
	 */
	function test_value_as_wp_post_nav_menu_item_term_urls() {
		$term_id = self::factory()->term->create( array( 'taxonomy' => 'category' ) );
		register_post_type( 'press_release', array(
			'has_archive' => true,
		) );
		$post_id = self::factory()->post->create( array( 'post_type' => 'press_release' ) );

		// Term.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-1]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'type' => 'taxonomy',
			'object' => 'category',
			'object_id' => $term_id,
			'title' => 'Category',
			'url' => '',
		) );
		$setting->preview();
		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( get_term_link( $term_id ), $nav_menu_item->url );

		// Post.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-2]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'type' => 'post_type',
			'object' => 'press_release',
			'object_id' => $post_id,
			'title' => 'PR',
			'url' => '',
		) );
		$setting->preview();
		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( get_permalink( $post_id ), $nav_menu_item->url );

		// Post type archive.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-3]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'type' => 'post_type_archive',
			'object' => 'press_release',
			'title' => 'PR',
			'url' => '',
		) );
		$setting->preview();
		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( get_post_type_archive_link( 'press_release' ), $nav_menu_item->url );
	}

	/**
	 * Test WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item() for obtaining original title.
	 *
	 * @ticket 38945
	 * @covers WP_Customize_Nav_Menu_Item_Setting::get_original_title()
	 */
	function test_get_original_title() {
		$menu_id = wp_create_nav_menu( 'Menu' );
		register_post_type( 'press_release', array(
			'has_archive' => true,
			'labels' => array(
				'name' => 'PRs',
				'singular_name' => 'PR',
				'archives' => 'All PRs',
			),
		) );
		$original_post_title = 'The PR Post';
		$post_id = self::factory()->post->create( array( 'post_type' => 'press_release', 'post_title' => $original_post_title ) );
		$original_term_title = 'The Category Term';
		$term_id = self::factory()->term->create( array( 'taxonomy' => 'category', 'name' => $original_term_title ) );

		// Post: existing nav menu item.
		$nav_menu_item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-object-id' => $post_id,
			'menu-item-type' => 'post_type',
			'menu-item-object' => 'press_release',
			'menu-item-title' => '',
			'menu-item-status' => 'publish',
		) );
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[' . $nav_menu_item_id . ']'
		);
		$item_value = $setting->value();
		$this->assertEquals( $original_post_title, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( $original_post_title, $item->original_title );
		$this->assertEquals( $original_post_title, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->singular_name, $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );

		// Post: staged nav menu item.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-1]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'object_id' => $post_id,
			'type' => 'post_type',
			'object' => 'press_release',
			'title' => '',
			'status' => 'publish',
		) );
		$setting->preview();
		$item_value = $setting->value();
		$this->assertEquals( $original_post_title, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( $original_post_title, $item->original_title );
		$this->assertEquals( $original_post_title, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->singular_name, $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );

		// Term: existing nav menu item.
		$nav_menu_item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-object-id' => $term_id,
			'menu-item-type' => 'taxonomy',
			'menu-item-object' => 'category',
			'menu-item-title' => '',
			'menu-item-status' => 'publish',
		) );
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[' . $nav_menu_item_id . ']'
		);
		$item_value = $setting->value();
		$this->assertEquals( $original_term_title, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( $original_term_title, $item->original_title );
		$this->assertEquals( $original_term_title, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( get_taxonomy( 'category' )->labels->singular_name, $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );

		// Term: staged nav menu item.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-2]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'object_id' => $term_id,
			'type' => 'taxonomy',
			'object' => 'category',
			'title' => '',
			'status' => 'publish',
		) );
		$setting->preview();
		$item_value = $setting->value();
		$this->assertEquals( $original_term_title, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( $original_term_title, $item->original_title );
		$this->assertEquals( $original_term_title, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( get_taxonomy( 'category' )->labels->singular_name, $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );

		// Post Type Archive: existing nav menu item.
		$nav_menu_item_id = wp_update_nav_menu_item( $menu_id, 0, array(
			'menu-item-type' => 'post_type_archive',
			'menu-item-object' => 'press_release',
			'menu-item-title' => '',
			'menu-item-status' => 'publish',
		) );
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[' . $nav_menu_item_id . ']'
		);
		$item_value = $setting->value();
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item->original_title );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( __( 'Post Type Archive' ), $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );

		// Post Type Archive: staged nav menu item.
		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[-3]'
		);
		$this->wp_customize->set_post_value( $setting->id, array(
			'type' => 'post_type_archive',
			'object' => 'press_release',
			'title' => '',
			'status' => 'publish',
		) );
		$setting->preview();
		$item_value = $setting->value();
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item_value['original_title'] );
		$this->assertEquals( '', $item_value['title'] );
		$item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertObjectHasAttribute( 'type_label', $item );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item->original_title );
		$this->assertEquals( get_post_type_object( 'press_release' )->labels->archives, $item->title );
		$this->assertArrayHasKey( 'type_label', $item_value );
		$this->assertEquals( __( 'Post Type Archive' ), $item_value['type_label'] );
		$this->assertEquals( $item->type_label, $item_value['type_label'] );
	}

	/**
	 * Test WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item() where title is empty.
	 *
	 * @ticket 38015
	 * @see WP_Customize_Nav_Menu_Item_Setting::value_as_wp_post_nav_menu_item()
	 */
	function test_value_as_wp_post_nav_menu_item_with_empty_title() {
		$original_title = 'The Original Title';
		$post_id = self::factory()->post->create( array( 'post_title' => $original_title ) );

		$setting = new WP_Customize_Nav_Menu_Item_Setting(
			$this->wp_customize,
			'nav_menu_item[123]'
		);

		$post_value = array_merge(
			$setting->default,
			array(
				'object_id'        => $post_id,
				'object'           => 'post',
				'type'             => 'post_type',
				'status'           => 'publish',
				'nav_menu_term_id' => 0,
			)
		);
		$this->wp_customize->set_post_value( $setting->id, $post_value );

		$setting->preview();

		$nav_menu_item = $setting->value_as_wp_post_nav_menu_item();
		$this->assertEquals( $original_title, $nav_menu_item->title );
	}
}
