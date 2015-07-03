<?php

/**
 * Tests WP_Customize_Nav_Menu_Setting.
 *
 * @group customize
 */
class Test_WP_Customize_Nav_Menu_Setting extends WP_UnitTestCase {

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
	 * Helper for getting the nav_menu_options option.
	 *
	 * @return array
	 */
	function get_nav_menu_items_option() {
		return get_option( 'nav_menu_options', array( 'auto_add' => array() ) );
	}

	/**
	 * Test constants and statics.
	 */
	function test_constants() {
		do_action( 'customize_register', $this->wp_customize );
		$this->assertTrue( taxonomy_exists( WP_Customize_Nav_Menu_Setting::TAXONOMY ) );
	}

	/**
	 * Test constructor.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::__construct()
	 */
	function test_construct() {
		do_action( 'customize_register', $this->wp_customize );

		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, 'nav_menu[123]' );
		$this->assertEquals( 'nav_menu', $setting->type );
		$this->assertEquals( 'postMessage', $setting->transport );
		$this->assertEquals( 123, $setting->term_id );
		$this->assertNull( $setting->previous_term_id );
		$this->assertNull( $setting->update_status );
		$this->assertNull( $setting->update_error );
		$this->assertInternalType( 'array', $setting->default );
		foreach ( array( 'name', 'description', 'parent' ) as $key ) {
			$this->assertArrayHasKey( $key, $setting->default );
		}
		$this->assertEquals( '', $setting->default['name'] );
		$this->assertEquals( '', $setting->default['description'] );
		$this->assertEquals( 0, $setting->default['parent'] );

		$exception = null;
		try {
			$bad_setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, 'foo_bar_baz' );
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
		unset( $_wp_customize->nav_menus );

		$exception = null;
		try {
			$bad_setting = new WP_Customize_Nav_Menu_Setting( $_wp_customize, 'nav_menu_item[123]' );
			unset( $bad_setting );
		} catch ( Exception $e ) {
			$exception = $e;
		}
		$this->assertInstanceOf( 'Exception', $exception );
	}

	/**
	 * Test constructor for placeholder (draft) menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::__construct()
	 */
	function test_construct_placeholder() {
		do_action( 'customize_register', $this->wp_customize );
		$default = array(
			'name' => 'Lorem',
			'description' => 'ipsum',
			'parent' => 123,
		);
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, 'nav_menu[-5]', compact( 'default' ) );
		$this->assertEquals( -5, $setting->term_id );
		$this->assertEquals( $default, $setting->default );
	}

	/**
	 * Test value method.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::value()
	 */
	function test_value() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_name = 'Test 123';
		$parent_menu_id = wp_create_nav_menu( "Parent $menu_name" );
		$description = 'Hello my world.';
		$menu_id = wp_update_nav_menu_object( 0, array(
			'menu-name' => $menu_name,
			'parent' => $parent_menu_id,
			'description' => $description,
		) );

		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$value = $setting->value();
		$this->assertInternalType( 'array', $value );
		foreach ( array( 'name', 'description', 'parent' ) as $key ) {
			$this->assertArrayHasKey( $key, $value );
		}
		$this->assertEquals( $menu_name, $value['name'] );
		$this->assertEquals( $description, $value['description'] );
		$this->assertEquals( $parent_menu_id, $value['parent'] );

		$new_menu_name = 'Foo';
		wp_update_nav_menu_object( $menu_id, array( 'menu-name' => $new_menu_name ) );
		$updated_value = $setting->value();
		$this->assertEquals( $new_menu_name, $updated_value['name'] );
	}

	/**
	 * Test preview method for updated menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::preview()
	 */
	function test_preview_updated() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_update_nav_menu_object( 0, array(
			'menu-name' => 'Name 1',
			'description' => 'Description 1',
			'parent' => 0,
		) );
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertNotContains( $menu_id, $nav_menu_options['auto_add'] );

		$post_value = array(
			'name' => 'Name 2',
			'description' => 'Description 2',
			'parent' => 1,
			'auto_add' => true,
		);
		$this->wp_customize->set_post_value( $setting_id, $post_value );

		$value = $setting->value();
		$this->assertEquals( 'Name 1', $value['name'] );
		$this->assertEquals( 'Description 1', $value['description'] );
		$this->assertEquals( 0, $value['parent'] );

		$term = (array) wp_get_nav_menu_object( $menu_id );

		$this->assertEqualSets(
			wp_array_slice_assoc( $value, array( 'name', 'description', 'parent' ) ),
			wp_array_slice_assoc( $term, array( 'name', 'description', 'parent' ) )
		);

		$setting->preview();
		$value = $setting->value();
		$this->assertEquals( 'Name 2', $value['name'] );
		$this->assertEquals( 'Description 2', $value['description'] );
		$this->assertEquals( 1, $value['parent'] );
		$term = (array) wp_get_nav_menu_object( $menu_id );
		$this->assertEqualSets( $value, wp_array_slice_assoc( $term, array_keys( $value ) ) );

		$menu_object = wp_get_nav_menu_object( $menu_id );
		$this->assertEquals( (object) $term, $menu_object );
		$this->assertEquals( $post_value['name'], $menu_object->name );

		$nav_menu_options = get_option( 'nav_menu_options', array( 'auto_add' => array() ) );
		$this->assertContains( $menu_id, $nav_menu_options['auto_add'] );
	}

	/**
	 * Test preview method for inserted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::preview()
	 */
	function test_preview_inserted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = -123;
		$post_value = array(
			'name' => 'New Menu Name 1',
			'description' => 'New Menu Description 1',
			'parent' => 0,
			'auto_add' => false,
		);
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$this->wp_customize->set_post_value( $setting->id, $post_value );
		$setting->preview();
		$value = $setting->value();
		$this->assertEquals( $post_value, $value );

		$term = (array) wp_get_nav_menu_object( $menu_id );
		$this->assertNotEmpty( $term );
		$this->assertNotInstanceOf( 'WP_Error', $term );
		$this->assertEqualSets( $post_value, wp_array_slice_assoc( $term, array_keys( $value ) ) );
		$this->assertEquals( $menu_id, $term['term_id'] );
		$this->assertEquals( $menu_id, $term['term_taxonomy_id'] );

		$menu_object = wp_get_nav_menu_object( $menu_id );
		$this->assertEquals( (object) $term, $menu_object );
		$this->assertEquals( $post_value['name'], $menu_object->name );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertNotContains( $menu_id, $nav_menu_options['auto_add'] );
	}

	/**
	 * Test preview method for deleted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::preview()
	 */
	function test_preview_deleted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_update_nav_menu_object( 0, array(
			'menu-name' => 'Name 1',
			'description' => 'Description 1',
			'parent' => 0,
		) );
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );
		$nav_menu_options = $this->get_nav_menu_items_option();
		$nav_menu_options['auto_add'][] = $menu_id;
		update_option( 'nav_menu_options', $nav_menu_options );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertContains( $menu_id, $nav_menu_options['auto_add'] );

		$this->wp_customize->set_post_value( $setting_id, false );

		$this->assertInternalType( 'array', $setting->value() );
		$this->assertInternalType( 'object', wp_get_nav_menu_object( $menu_id ) );
		$setting->preview();
		$this->assertFalse( $setting->value() );
		$this->assertFalse( wp_get_nav_menu_object( $menu_id ) );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertNotContains( $menu_id, $nav_menu_options['auto_add'] );
	}

	/**
	 * Test sanitize method.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::sanitize()
	 */
	function test_sanitize() {
		do_action( 'customize_register', $this->wp_customize );
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, 'nav_menu[123]' );

		$this->assertNull( $setting->sanitize( 'not an array' ) );
		$this->assertNull( $setting->sanitize( 123 ) );

		$value = array(
			'name' => ' Hello <b>world</b> ',
			'description' => "New\nline",
			'parent' => -12,
			'auto_add' => true,
			'extra' => 'ignored',
		);
		$sanitized = $setting->sanitize( $value );
		$this->assertEquals( 'Hello &lt;b&gt;world&lt;/b&gt;', $sanitized['name'] );
		$this->assertEquals( 'New line', $sanitized['description'] );
		$this->assertEquals( 0, $sanitized['parent'] );
		$this->assertEquals( true, $sanitized['auto_add'] );
		$this->assertEqualSets( array( 'name', 'description', 'parent', 'auto_add' ), array_keys( $sanitized ) );

		$value['name'] = '    '; // Blank spaces.
		$sanitized = $setting->sanitize( $value );
		$this->assertEquals( '(unnamed)', $sanitized['name'] );
	}

	/**
	 * Test protected update() method via the save() method, for updated menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::update()
	 */
	function test_save_updated() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = wp_update_nav_menu_object( 0, array(
			'menu-name' => 'Name 1',
			'description' => 'Description 1',
			'parent' => 0,
		) );
		$nav_menu_options = $this->get_nav_menu_items_option();
		$nav_menu_options['auto_add'][] = $menu_id;
		update_option( 'nav_menu_options', $nav_menu_options );

		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$auto_add = false;
		$new_value = array(
			'name' => 'Name 2',
			'description' => 'Description 2',
			'parent' => 1,
			'auto_add' => $auto_add,
		);

		$this->wp_customize->set_post_value( $setting_id, $new_value );
		$setting->save();

		$menu_object = wp_get_nav_menu_object( $menu_id );
		foreach ( array( 'name', 'description', 'parent' ) as $key ) {
			$this->assertEquals( $new_value[ $key ], $menu_object->$key );
		}
		$this->assertEqualSets(
			wp_array_slice_assoc( $new_value, array( 'name', 'description', 'parent' ) ),
			wp_array_slice_assoc( (array) $menu_object, array( 'name', 'description', 'parent' ) )
		);
		$this->assertEquals( $new_value, $setting->value() );

		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_updates'] );
		$this->assertArrayHasKey( 'term_id', $update_result );
		$this->assertArrayHasKey( 'previous_term_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );
		$this->assertArrayHasKey( 'saved_value', $update_result );
		$this->assertEquals( $new_value, $update_result['saved_value'] );

		$this->assertEquals( $menu_id, $update_result['term_id'] );
		$this->assertNull( $update_result['previous_term_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'updated', $update_result['status'] );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertNotContains( $menu_id, $nav_menu_options['auto_add'] );
	}

	/**
	 * Test protected update() method via the save() method, for inserted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::update()
	 */
	function test_save_inserted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_id = -123;
		$post_value = array(
			'name' => 'New Menu Name 1',
			'description' => 'New Menu Description 1',
			'parent' => 0,
			'auto_add' => true,
		);
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );

		$this->wp_customize->set_post_value( $setting->id, $post_value );

		$this->assertNull( $setting->previous_term_id );
		$this->assertLessThan( 0, $setting->term_id );
		$setting->save();
		$this->assertEquals( $menu_id, $setting->previous_term_id );
		$this->assertGreaterThan( 0, $setting->term_id );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertContains( $setting->term_id, $nav_menu_options['auto_add'] );

		$menu = wp_get_nav_menu_object( $setting->term_id );
		unset( $post_value['auto_add'] );
		$this->assertEqualSets( $post_value, wp_array_slice_assoc( (array) $menu, array_keys( $post_value ) ) );

		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_updates'] );
		$this->assertArrayHasKey( 'term_id', $update_result );
		$this->assertArrayHasKey( 'previous_term_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );
		$this->assertArrayHasKey( 'saved_value', $update_result );
		$this->assertEquals( $setting->value(), $update_result['saved_value'] );

		$this->assertEquals( $menu->term_id, $update_result['term_id'] );
		$this->assertEquals( $menu_id, $update_result['previous_term_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'inserted', $update_result['status'] );
	}

	/**
	 * Test saving a new name that conflicts with an existing nav menu's name.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::update()
	 */
	function test_save_inserted_conflicted_name() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_name = 'Foo';
		wp_update_nav_menu_object( 0, array( 'menu-name' => $menu_name ) );

		$menu_id = -123;
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );
		$this->wp_customize->set_post_value( $setting->id, array( 'name' => $menu_name ) );
		$setting->save();

		$expected_resolved_menu_name = "$menu_name (2)";
		$new_menu = wp_get_nav_menu_object( $setting->term_id );
		$this->assertEquals( $expected_resolved_menu_name, $new_menu->name );

		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertEquals( $expected_resolved_menu_name, $save_response['nav_menu_updates'][0]['saved_value']['name'] );
	}

	/**
	 * Test protected update() method via the save() method, for deleted menu.
	 *
	 * @see WP_Customize_Nav_Menu_Setting::update()
	 */
	function test_save_deleted() {
		do_action( 'customize_register', $this->wp_customize );

		$menu_name = 'Lorem Ipsum';
		$menu_id = wp_create_nav_menu( $menu_name );
		$setting_id = "nav_menu[$menu_id]";
		$setting = new WP_Customize_Nav_Menu_Setting( $this->wp_customize, $setting_id );
		$nav_menu_options = $this->get_nav_menu_items_option();
		$nav_menu_options['auto_add'][] = $menu_id;
		update_option( 'nav_menu_options', $nav_menu_options );

		$menu = wp_get_nav_menu_object( $menu_id );
		$this->assertEquals( $menu_name, $menu->name );

		$this->wp_customize->set_post_value( $setting_id, false );
		$setting->save();

		$this->assertFalse( wp_get_nav_menu_object( $menu_id ) );

		$save_response = apply_filters( 'customize_save_response', array() );
		$this->assertArrayHasKey( 'nav_menu_updates', $save_response );
		$update_result = array_shift( $save_response['nav_menu_updates'] );
		$this->assertArrayHasKey( 'term_id', $update_result );
		$this->assertArrayHasKey( 'previous_term_id', $update_result );
		$this->assertArrayHasKey( 'error', $update_result );
		$this->assertArrayHasKey( 'status', $update_result );
		$this->assertArrayHasKey( 'saved_value', $update_result );
		$this->assertNull( $update_result['saved_value'] );

		$this->assertEquals( $menu_id, $update_result['term_id'] );
		$this->assertNull( $update_result['previous_term_id'] );
		$this->assertNull( $update_result['error'] );
		$this->assertEquals( 'deleted', $update_result['status'] );

		$nav_menu_options = $this->get_nav_menu_items_option();
		$this->assertNotContains( $menu_id, $nav_menu_options['auto_add'] );
	}

}
