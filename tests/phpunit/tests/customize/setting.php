<?php

/**
 * Tests for the WP_Customize_Setting class.
 *
 * @group customize
 */
class Tests_WP_Customize_Setting extends WP_UnitTestCase {

	/**
	 * @var WP_Customize_Manager
	 */
	protected $manager;

	/**
	 * @var stdClass an instance which serves as a symbol to do identity checks with
	 */
	public $undefined;

	function setUp() {
		parent::setUp();
		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		$this->manager = $GLOBALS['wp_customize'];
		$this->undefined = new stdClass();
	}

	function tearDown() {
		$this->manager = null;
		unset( $GLOBALS['wp_customize'] );
		parent::tearDown();
	}

	function test_constructor_without_args() {
		$setting = new WP_Customize_Setting( $this->manager, 'foo' );
		$this->assertEquals( $this->manager, $setting->manager );
		$this->assertEquals( 'foo', $setting->id );
		$this->assertEquals( 'theme_mod', $setting->type );
		$this->assertEquals( 'edit_theme_options', $setting->capability );
		$this->assertEquals( '', $setting->theme_supports );
		$this->assertEquals( '', $setting->default );
		$this->assertEquals( 'refresh', $setting->transport );
		$this->assertEquals( '', $setting->sanitize_callback );
		$this->assertEquals( '', $setting->sanitize_js_callback );
		$this->assertFalse( has_filter( "customize_validate_{$setting->id}" ) );
		$this->assertFalse( has_filter( "customize_sanitize_{$setting->id}" ) );
		$this->assertFalse( has_filter( "customize_sanitize_js_{$setting->id}" ) );
		$this->assertEquals( false, $setting->dirty );
	}

	function test_constructor_with_args() {
		$args = array(
			'type' => 'option',
			'capability' => 'edit_posts',
			'theme_supports' => 'widgets',
			'default' => 'barbar',
			'transport' => 'postMessage',
			'validate_callback' => create_function( '$value', 'return $value . ":validate_callback";' ),
			'sanitize_callback' => create_function( '$value', 'return $value . ":sanitize_callback";' ),
			'sanitize_js_callback' => create_function( '$value', 'return $value . ":sanitize_js_callback";' ),
		);
		$setting = new WP_Customize_Setting( $this->manager, 'bar', $args );
		$this->assertEquals( 'bar', $setting->id );
		foreach ( $args as $key => $value ) {
			$this->assertEquals( $value, $setting->$key );
		}
		$this->assertEquals( 10, has_filter( "customize_validate_{$setting->id}", $args['validate_callback'] ) );
		$this->assertEquals( 10, has_filter( "customize_sanitize_{$setting->id}", $args['sanitize_callback'] ) );
		$this->assertEquals( 10, has_filter( "customize_sanitize_js_{$setting->id}" ), $args['sanitize_js_callback'] );
	}

	public $post_data_overrides = array(
		'unset_option_overridden' => 'unset_option_post_override_value\\o/',
		'unset_theme_mod_overridden' => 'unset_theme_mod_post_override_value\\o/',
		'set_option_overridden' => 'set_option_post_override_value\\o/',
		'set_theme_mod_overridden' => 'set_theme_mod_post_override_value\\o/',
		'unset_option_multi_overridden[foo]' => 'unset_option_multi_overridden[foo]_post_override_value\\o/',
		'unset_theme_mod_multi_overridden[foo]' => 'unset_theme_mod_multi_overridden[foo]_post_override_value\\o/',
		'set_option_multi_overridden[foo]' => 'set_option_multi_overridden[foo]_post_override_value\\o/',
		'set_theme_mod_multi_overridden[foo]' => 'set_theme_mod_multi_overridden[foo]_post_override_value\\o/',
	);

	public $standard_type_configs = array(
		'option' => array(
			'getter' => 'get_option',
			'setter' => 'update_option',
		),
		'theme_mod' => array(
			'getter' => 'get_theme_mod',
			'setter' => 'set_theme_mod',
		),
	);

	/**
	 * Run assertions on non-multidimensional standard settings.
	 *
	 * @see WP_Customize_Setting::value()
	 */
	function test_preview_standard_types_non_multidimensional() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_POST['customized'] = wp_slash( wp_json_encode( $this->post_data_overrides ) );

		// Try non-multidimensional settings.
		foreach ( $this->standard_type_configs as $type => $type_options ) {
			// Non-multidimensional: See what effect the preview filter has on a non-existent setting (default value should be seen).
			$name = "unset_{$type}_without_post_value";
			$default = "default_value_{$name}";
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $this->undefined, call_user_func( $type_options['getter'], $name, $this->undefined ) );
			$this->assertEquals( $default, $setting->value() );
			$this->assertTrue( $setting->preview(), 'Preview should not no-op since setting has no existing value.' );
			$this->assertEquals( $default, call_user_func( $type_options['getter'], $name, $this->undefined ), sprintf( 'Expected %s(%s) to return setting default: %s.', $type_options['getter'], $name, $default ) );
			$this->assertEquals( $default, $setting->value() );

			// Non-multidimensional: See what effect the preview has on an extant setting (default value should not be seen).
			$name = "set_{$type}_without_post_value";
			$default = "default_value_{$name}";
			$initial_value = "initial_value_{$name}";
			call_user_func( $type_options['setter'], $name, $initial_value );
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $initial_value, call_user_func( $type_options['getter'], $name ) );
			$this->assertEquals( $initial_value, $setting->value() );
			$this->assertFalse( $setting->preview(), 'Preview should no-op since setting value was extant and no post value was present.' );
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->type}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( $initial_value, call_user_func( $type_options['getter'], $name ) );
			$this->assertEquals( $initial_value, $setting->value() );

			// Non-multidimensional: Try updating a value that had a no-op preview.
			$overridden_value = "overridden_value_$name";
			call_user_func( $type_options['setter'], $name, $overridden_value );
			$message = 'Initial value should be overridden because initial preview() was no-op due to setting having existing value and/or post value was absent.';
			$this->assertEquals( $overridden_value, call_user_func( $type_options['getter'], $name ), $message );
			$this->assertEquals( $overridden_value, $setting->value(), $message );
			$this->assertNotEquals( $initial_value, $setting->value(), $message );

			// Non-multidimensional: Ensure that setting a post value *after* preview() is called results in the post value being seen (deferred preview).
			$post_value = "post_value_for_{$setting->id}_set_after_preview_called";
			$this->assertEquals( 0, did_action( "customize_post_value_set_{$setting->id}" ) );
			$this->manager->set_post_value( $setting->id, $post_value );
			$this->assertEquals( 1, did_action( "customize_post_value_set_{$setting->id}" ) );
			$this->assertNotEquals( $overridden_value, $setting->value() );
			$this->assertEquals( $post_value, call_user_func( $type_options['getter'], $name ) );
			$this->assertEquals( $post_value, $setting->value() );

			// Non-multidimensional: Test unset setting being overridden by a post value.
			$name = "unset_{$type}_overridden";
			$default = "default_value_{$name}";
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $this->undefined, call_user_func( $type_options['getter'], $name, $this->undefined ) );
			$this->assertEquals( $default, $setting->value() );
			$this->assertTrue( $setting->preview(), 'Preview applies because setting has post_data_overrides.' ); // Activate post_data.
			$this->assertEquals( $this->post_data_overrides[ $name ], call_user_func( $type_options['getter'], $name, $this->undefined ) );
			$this->assertEquals( $this->post_data_overrides[ $name ], $setting->value() );

			// Non-multidimensional: Test set setting being overridden by a post value.
			$name = "set_{$type}_overridden";
			$default = "default_value_{$name}";
			$initial_value = "initial_value_{$name}";
			call_user_func( $type_options['setter'], $name, $initial_value );
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $initial_value, call_user_func( $type_options['getter'], $name, $this->undefined ) );
			$this->assertEquals( $initial_value, $setting->value() );
			$this->assertTrue( $setting->preview(), 'Preview applies because setting has post_data_overrides.' ); // Activate post_data.
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->type}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( $this->post_data_overrides[ $name ], call_user_func( $type_options['getter'], $name, $this->undefined ) );
			$this->assertEquals( $this->post_data_overrides[ $name ], $setting->value() );
		}
	}

	/**
	 * Run assertions on multidimensional standard settings.
	 *
	 * @see WP_Customize_Setting::preview()
	 * @see WP_Customize_Setting::value()
	 */
	function test_preview_standard_types_multidimensional() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$_POST['customized'] = wp_slash( wp_json_encode( $this->post_data_overrides ) );

		foreach ( $this->standard_type_configs as $type => $type_options ) {
			// Multidimensional: See what effect the preview filter has on a non-existent setting (default value should be seen).
			$base_name = "unset_{$type}_multi";
			$name = $base_name . '[foo]';
			$default = "default_value_{$name}";
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $this->undefined, call_user_func( $type_options['getter'], $base_name, $this->undefined ) );
			$this->assertEquals( $default, $setting->value() );
			$this->assertTrue( $setting->preview(), "Preview for $setting->id should apply because setting is not in DB." );
			$base_value = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertArrayHasKey( 'foo', $base_value );
			$this->assertEquals( $default, $base_value['foo'] );

			// Multidimensional: See what effect the preview has on an extant setting (default value should not be seen) without post value.
			$base_name = "set_{$type}_multi";
			$name = $base_name . '[foo]';
			$default = "default_value_{$name}";
			$initial_value = "initial_value_{$name}";
			$base_initial_value = array( 'foo' => $initial_value, 'bar' => 'persisted' );
			call_user_func( $type_options['setter'], $base_name, $base_initial_value );
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$base_value = call_user_func( $type_options['getter'], $base_name, array() );
			$this->assertEquals( $initial_value, $base_value['foo'] );
			$this->assertEquals( $initial_value, $setting->value() );
			$this->assertFalse( $setting->preview(), "Preview for $setting->id should no-op because setting is in DB and post value is absent." );
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->type}" ) ); // Only applicable for custom types (not options or theme_mods).
			$base_value = call_user_func( $type_options['getter'], $base_name, array() );
			$this->assertEquals( $initial_value, $base_value['foo'] );
			$this->assertEquals( $initial_value, $setting->value() );

			// Multidimensional: Ensure that setting a post value *after* preview() is called results in the post value being seen (deferred preview).
			$override_value = "post_value_for_{$setting->id}_set_after_preview_called";
			$this->manager->set_post_value( $setting->id, $override_value );
			$base_value = call_user_func( $type_options['getter'], $base_name, array() );
			$this->assertEquals( $override_value, $base_value['foo'] );
			$this->assertEquals( $override_value, $setting->value() );

			// Multidimensional: Test unset setting being overridden by a post value.
			$base_name = "unset_{$type}_multi_overridden";
			$name = $base_name . '[foo]';
			$default = "default_value_{$name}";
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$this->assertEquals( $this->undefined, call_user_func( $type_options['getter'], $base_name, $this->undefined ) );
			$this->assertEquals( $default, $setting->value() );
			$this->assertTrue( $setting->preview(), "Preview for $setting->id should apply because a post value is present." );
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->type}" ) ); // Only applicable for custom types (not options or theme_mods).
			$base_value = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertArrayHasKey( 'foo', $base_value );
			$this->assertEquals( $this->post_data_overrides[ $name ], $base_value['foo'] );

			// Multidimensional: Test set setting being overridden by a post value.
			$base_name = "set_{$type}_multi_overridden";
			$name = $base_name . '[foo]';
			$default = "default_value_{$name}";
			$initial_value = "initial_value_{$name}";
			$base_initial_value = array( 'foo' => $initial_value, 'bar' => 'persisted' );
			call_user_func( $type_options['setter'], $base_name, $base_initial_value );
			$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
			$base_value = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertArrayHasKey( 'foo', $base_value );
			$this->assertArrayHasKey( 'bar', $base_value );
			$this->assertEquals( $base_initial_value['foo'], $base_value['foo'] );

			$getter = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertEquals( $base_initial_value['bar'], $getter['bar'] );
			$this->assertEquals( $initial_value, $setting->value() );
			$this->assertTrue( $setting->preview(), "Preview for $setting->id should apply because post value is present." );
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ) ); // Only applicable for custom types (not options or theme_mods).
			$this->assertEquals( 0, did_action( "customize_preview_{$setting->type}" ) ); // Only applicable for custom types (not options or theme_mods).
			$base_value = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertArrayHasKey( 'foo', $base_value );
			$this->assertEquals( $this->post_data_overrides[ $name ], $base_value['foo'] );
			$this->assertArrayHasKey( 'bar', call_user_func( $type_options['getter'], $base_name, $this->undefined ) );

			$getter = call_user_func( $type_options['getter'], $base_name, $this->undefined );
			$this->assertEquals( $base_initial_value['bar'], $getter['bar'] );
		}
	}

	/**
	 * @var array storage for saved custom type data that are tested in self::test_preview_custom_type()
	 */
	protected $custom_type_data_saved;

	/**
	 * @var array storage for previewed custom type data that are tested in self::test_preview_custom_type()
	 */
	protected $custom_type_data_previewed;

	function custom_type_getter( $name, $default = null ) {
		if ( did_action( "customize_preview_{$name}" ) && array_key_exists( $name, $this->custom_type_data_previewed ) ) {
			$value = $this->custom_type_data_previewed[ $name ];
		} else if ( array_key_exists( $name, $this->custom_type_data_saved ) ) {
			$value = $this->custom_type_data_saved[ $name ];
		} else {
			$value = $default;
		}
		return $value;
	}

	function custom_type_setter( $name, $value ) {
		$this->custom_type_data_saved[ $name ] = $value;
	}

	/**
	 * Filter for `customize_value_{$id_base}`.
	 *
	 * @param mixed $default
	 * @param WP_Customize_Setting $setting
	 *
	 * @return mixed|null
	 */
	function custom_type_value_filter( $default, $setting = null ) {
		$name = preg_replace( '/^customize_value_/', '', current_filter() );
		$this->assertInstanceOf( 'WP_Customize_Setting', $setting );
		$id_data = $setting->id_data();
		$this->assertEquals( $name, $id_data['base'] );
		return $this->custom_type_getter( $name, $default );
	}

	/**
	 * @param WP_Customize_Setting $setting
	 */
	function custom_type_preview( $setting ) {
		$previewed_value = $setting->post_value( $this->undefined );
		if ( $this->undefined !== $previewed_value ) {
			$this->custom_type_data_previewed[ $setting->id ] = $previewed_value;
		}
	}
	/**
	 * Run assertions on custom settings.
	 *
	 * @see WP_Customize_Setting::preview()
	 */
	function test_preview_custom_type() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$type = 'custom_type';
		$post_data_overrides = array(
			"unset_{$type}_with_post_value" => "unset_{$type}_without_post_value\\o/",
			"set_{$type}_with_post_value" => "set_{$type}_without_post_value\\o/",
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $post_data_overrides ) );

		$this->custom_type_data_saved = array();
		$this->custom_type_data_previewed = array();

		add_action( "customize_preview_{$type}", array( $this, 'custom_type_preview' ) );

		// Custom type not existing and no post value override.
		$name = "unset_{$type}_without_post_value";
		$default = "default_value_{$name}";
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
		// Note: #29316 will allow us to have one filter for all settings of a given type, which is what we need.
		add_filter( "customize_value_{$name}", array( $this, 'custom_type_value_filter' ), 10, 2 );
		$this->assertEquals( $this->undefined, $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $default, $setting->value() );
		$this->assertTrue( $setting->preview() );
		$this->assertEquals( 1, did_action( "customize_preview_{$setting->id}" ) );
		$this->assertEquals( 1, did_action( "customize_preview_{$setting->type}" ) );
		$this->assertEquals( $this->undefined, $this->custom_type_getter( $name, $this->undefined ) ); // Note: for a non-custom type this is $default
		$this->assertEquals( $default, $setting->value() ); // Should be same as above.

		// Custom type existing and no post value override.
		$name = "set_{$type}_without_post_value";
		$default = "default_value_{$name}";
		$initial_value = "initial_value_{$name}";
		$this->custom_type_setter( $name, $initial_value );
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
		// Note: #29316 will allow us to have one filter for all settings of a given type, which is what we need.
		add_filter( "customize_value_{$name}", array( $this, 'custom_type_value_filter' ), 10, 2 );
		$this->assertEquals( $initial_value, $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $initial_value, $setting->value() );
		$this->assertFalse( $setting->preview(), "Preview for $setting->id should not apply because existing type without an override." );
		$this->assertEquals( 0, did_action( "customize_preview_{$setting->id}" ), 'Zero preview actions because initial value is set with no incoming post value, so there is no preview to apply.' );
		$this->assertEquals( 1, did_action( "customize_preview_{$setting->type}" ) );
		$this->assertEquals( $initial_value, $this->custom_type_getter( $name, $this->undefined ) ); // Should be same as above.
		$this->assertEquals( $initial_value, $setting->value() ); // Should be same as above.

		// Custom type deferred preview (setting post value after preview ran).
		$override_value = "custom_type_value_{$name}_override_deferred_preview";
		$this->manager->set_post_value( $setting->id, $override_value );
		$this->assertEquals( $override_value, $this->custom_type_getter( $name, $this->undefined ) ); // Should be same as above.
		$this->assertEquals( $override_value, $setting->value() ); // Should be same as above.

		// Custom type not existing and with a post value override.
		$name = "unset_{$type}_with_post_value";
		$default = "default_value_{$name}";
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
		// Note: #29316 will allow us to have one filter for all settings of a given type, which is what we need.
		add_filter( "customize_value_{$name}", array( $this, 'custom_type_value_filter' ), 10, 2 );
		$this->assertEquals( $this->undefined, $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $default, $setting->value() );
		$this->assertTrue( $setting->preview() );
		$this->assertEquals( 1, did_action( "customize_preview_{$setting->id}" ), 'One preview action now because initial value was not set and/or there is no incoming post value, so there is is a preview to apply.' );
		$this->assertEquals( 3, did_action( "customize_preview_{$setting->type}" ) );
		$this->assertEquals( $post_data_overrides[ $name ], $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $post_data_overrides[ $name ], $setting->value() );

		// Custom type not existing and with a post value override.
		$name = "set_{$type}_with_post_value";
		$default = "default_value_{$name}";
		$initial_value = "initial_value_{$name}";
		$this->custom_type_setter( $name, $initial_value );
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
		// Note: #29316 will allow us to have one filter for all settings of a given type, which is what we need.
		add_filter( "customize_value_{$name}", array( $this, 'custom_type_value_filter' ), 10, 2 );
		$this->assertEquals( $initial_value, $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $initial_value, $setting->value() );
		$this->assertTrue( $setting->preview() );
		$this->assertEquals( 1, did_action( "customize_preview_{$setting->id}" ) );
		$this->assertEquals( 4, did_action( "customize_preview_{$setting->type}" ) );
		$this->assertEquals( $post_data_overrides[ $name ], $this->custom_type_getter( $name, $this->undefined ) );
		$this->assertEquals( $post_data_overrides[ $name ], $setting->value() );

		// Custom type that does not handle supplying the post value from the customize_value_{$id_base} filter.
		$setting_id = 'custom_without_previewing_value_filter';
		$setting = $this->manager->add_setting( $setting_id, array(
			'type' => 'custom_preview_test',
			'default' => 123,
			'sanitize_callback' => array( $this->manager->nav_menus, 'intval_base10' ),
		) );
		$this->assertSame( 123, $setting->value() );
		$this->manager->set_post_value( $setting_id, '456' );
		$setting->preview();
		$this->assertSame( 456, $setting->value() );

		unset( $this->custom_type_data_previewed, $this->custom_type_data_saved );
	}

	/**
	 * Test specific fix for setting's default value not applying on preview window
	 *
	 * @ticket 30988
	 */
	function test_non_posted_setting_applying_default_value_in_preview() {
		$type = 'option';
		$name = 'unset_option_without_post_value';
		$default = "default_value_{$name}";
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type', 'default' ) );
		$this->assertEquals( $this->undefined, get_option( $name, $this->undefined ) );
		$this->assertEquals( $default, $setting->value() );
		$this->assertTrue( $setting->preview() );
		$this->assertEquals( $default, get_option( $name, $this->undefined ), sprintf( 'Expected get_option(%s) to return setting default: %s.', $name, $default ) );
		$this->assertEquals( $default, $setting->value() );
	}

	/**
	 * Test setting save method for custom type.
	 *
	 * @see WP_Customize_Setting::save()
	 * @see WP_Customize_Setting::update()
	 */
	function test_update_custom_type() {
		$type = 'custom';
		$name = 'foo';
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type' ) );
		$this->manager->add_setting( $setting );
		add_action( 'customize_update_custom', array( $this, 'handle_customize_update_custom_foo_action' ), 10, 2 );
		add_action( 'customize_save_foo', array( $this, 'handle_customize_save_custom_foo_action' ), 10, 2 );

		// Try saving before value set.
		$this->assertTrue( 0 === did_action( 'customize_update_custom' ) );
		$this->assertTrue( 0 === did_action( 'customize_save_foo' ) );
		$this->assertFalse( $setting->save() );
		$this->assertTrue( 0 === did_action( 'customize_update_custom' ) );
		$this->assertTrue( 0 === did_action( 'customize_save_foo' ) );

		// Try setting post value without user as admin.
		$this->manager->set_post_value( $setting->id, 'hello world \\o/' );
		$this->assertFalse( $setting->save() );
		$this->assertTrue( 0 === did_action( 'customize_update_custom' ) );
		$this->assertTrue( 0 === did_action( 'customize_save_foo' ) );

		// Satisfy all requirements for save to happen.
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->assertTrue( false !== $setting->save() );
		$this->assertTrue( 1 === did_action( 'customize_update_custom' ) );
		$this->assertTrue( 1 === did_action( 'customize_save_foo' ) );
	}

	/**
	 * Check customize_update_custom action.
	 *
	 * @see Tests_WP_Customize_Setting::test_update_custom_type()
	 * @param mixed $value
	 * @param WP_Customize_Setting $setting
	 */
	function handle_customize_update_custom_foo_action( $value, $setting = null ) {
		$this->assertEquals( 'hello world \\o/', $value );
		$this->assertInstanceOf( 'WP_Customize_Setting', $setting );
	}

	/**
	 * Check customize_save_foo action.
	 *
	 * @see Tests_WP_Customize_Setting::test_update_custom_type()
	 * @param WP_Customize_Setting $setting
	 */
	function handle_customize_save_custom_foo_action( $setting ) {
		$this->assertInstanceOf( 'WP_Customize_Setting', $setting );
		$this->assertEquals( 'custom', $setting->type );
		$this->assertEquals( 'foo', $setting->id );
	}

	/**
	 * Ensure that is_current_blog_previewed returns the expected values.
	 *
	 * This is applicable to both single and multisite. This doesn't do switch_to_blog()
	 *
	 * @ticket 31428
	 */
	function test_is_current_blog_previewed() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		$type = 'option';
		$name = 'blogname';
		$post_value = __FUNCTION__;
		$this->manager->set_post_value( $name, $post_value );
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type' ) );
		$this->assertFalse( $setting->is_current_blog_previewed() );
		$this->assertTrue( $setting->preview() );
		$this->assertTrue( $setting->is_current_blog_previewed() );

		$this->assertEquals( $post_value, $setting->value() );
		$this->assertEquals( $post_value, get_option( $name ) );
	}

	/**
	 * Ensure that previewing a setting is disabled when the current blog is switched.
	 *
	 * @ticket 31428
	 * @group multisite
	 */
	function test_previewing_with_switch_to_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Cannot test WP_Customize_Setting::is_current_blog_previewed() with switch_to_blog() if not on multisite.' );
		}

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$type = 'option';
		$name = 'blogdescription';
		$post_value = __FUNCTION__;
		$this->manager->set_post_value( $name, $post_value );
		$setting = new WP_Customize_Setting( $this->manager, $name, compact( 'type' ) );
		$this->assertFalse( $setting->is_current_blog_previewed() );
		$this->assertTrue( $setting->preview() );
		$this->assertTrue( $setting->is_current_blog_previewed() );

		$blog_id = self::factory()->blog->create();
		switch_to_blog( $blog_id );
		$this->assertFalse( $setting->is_current_blog_previewed() );
		$this->assertNotEquals( $post_value, $setting->value() );
		$this->assertNotEquals( $post_value, get_option( $name ) );
		restore_current_blog();
	}

	/**
	 * @ticket 33499
	 */
	function test_option_autoloading() {
		global $wpdb;
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$name = 'autoloaded1';
		$setting = new WP_Customize_Setting( $this->manager, $name, array(
			'type' => 'option',
		) );
		$value = 'value1';
		$this->manager->set_post_value( $setting->id, $value );
		$setting->save();
		$autoload = $wpdb->get_var( $wpdb->prepare( "SELECT autoload FROM $wpdb->options WHERE option_name = %s", $setting->id ) );
		$this->assertEquals( 'yes', $autoload );
		$this->assertEquals( $value, get_option( $name ) );

		$name = 'autoloaded2';
		$setting = new WP_Customize_Setting( $this->manager, $name, array(
			'type' => 'option',
			'autoload' => true,
		) );
		$value = 'value2';
		$this->manager->set_post_value( $setting->id, $value );
		$setting->save();
		$autoload = $wpdb->get_var( $wpdb->prepare( "SELECT autoload FROM $wpdb->options WHERE option_name = %s", $setting->id ) );
		$this->assertEquals( 'yes', $autoload );
		$this->assertEquals( $value, get_option( $name ) );

		$name = 'not-autoloaded1';
		$setting = new WP_Customize_Setting( $this->manager, $name, array(
			'type' => 'option',
			'autoload' => false,
		) );
		$value = 'value3';
		$this->manager->set_post_value( $setting->id, $value );
		$setting->save();
		$autoload = $wpdb->get_var( $wpdb->prepare( "SELECT autoload FROM $wpdb->options WHERE option_name = %s", $setting->id ) );
		$this->assertEquals( 'no', $autoload );
		$this->assertEquals( $value, get_option( $name ) );

		$id_base = 'multi-not-autoloaded';
		$setting1 = new WP_Customize_Setting( $this->manager, $id_base . '[foo]', array(
			'type' => 'option',
		) );
		$setting2 = new WP_Customize_Setting( $this->manager, $id_base . '[bar]', array(
			'type' => 'option',
			'autoload' => false,
		) );
		$this->manager->set_post_value( $setting1->id, 'value1' );
		$this->manager->set_post_value( $setting2->id, 'value2' );
		$setting1->save();
		$autoload = $wpdb->get_var( $wpdb->prepare( "SELECT autoload FROM $wpdb->options WHERE option_name = %s", $id_base ) );
		$this->assertEquals( 'no', $autoload, 'Even though setting1 did not indicate autoload (thus normally true), since another multidimensional option setting of the base did say autoload=false, it should be autoload=no' );
	}

	/**
	 * Test js_value and json methods.
	 *
	 * @see WP_Customize_Setting::js_value()
	 * @see WP_Customize_Setting::json()
	 */
	public function test_js_value() {
		$default = "\x00";
		$args = array(
			'type' => 'binary',
			'default' => $default,
			'transport' => 'postMessage',
			'dirty' => true,
			'sanitize_js_callback' => create_function( '$value', 'return base64_encode( $value );' ),
		);
		$setting = new WP_Customize_Setting( $this->manager, 'name', $args );

		$this->assertEquals( $default, $setting->value() );
		$this->assertEquals( base64_encode( $default ), $setting->js_value() );

		$exported = $setting->json();
		$this->assertArrayHasKey( 'type', $exported );
		$this->assertArrayHasKey( 'value', $exported );
		$this->assertArrayHasKey( 'transport', $exported );
		$this->assertArrayHasKey( 'dirty', $exported );
		$this->assertEquals( $setting->js_value(), $exported['value'] );
		$this->assertEquals( $args['type'], $setting->type );
		$this->assertEquals( $args['transport'], $setting->transport );
		$this->assertEquals( $args['dirty'], $setting->dirty );
	}

	/**
	 * Test validate.
	 *
	 * @see WP_Customize_Setting::validate()
	 */
	public function test_validate() {
		$setting = new WP_Customize_Setting( $this->manager, 'name', array(
			'type' => 'key',
			'validate_callback' => array( $this, 'filter_validate_for_test_validate' ),
		) );
		$validity = $setting->validate( 'BAD!' );
		$this->assertInstanceOf( 'WP_Error', $validity );
		$this->assertEquals( 'invalid_key', $validity->get_error_code() );
	}

	/**
	 * Validate callback.
	 *
	 * @see Tests_WP_Customize_Setting::test_validate()
	 *
	 * @param WP_Error $validity Validity.
	 * @param string   $value    Value.
	 *
	 * @return WP_Error
	 */
	public function filter_validate_for_test_validate( $validity, $value ) {
		$this->assertInstanceOf( 'WP_Error', $validity );
		$this->assertInternalType( 'string', $value );
		if ( sanitize_key( $value ) !== $value ) {
			$validity->add( 'invalid_key', 'Invalid key' );
		}
		return $validity;
	}

	/**
	 * Ensure that WP_Customize_Setting::value() can return a previewed value for aggregated multidimensionals.
	 *
	 * @ticket 37294
	 */
	public function test_multidimensional_value_when_previewed() {
		wp_set_current_user( $this->factory()->user->create( array( 'role' => 'administrator' ) ) );
		WP_Customize_Setting::reset_aggregated_multidimensionals();

		$initial_value = 456;
		set_theme_mod( 'nav_menu_locations', array(
			'primary' => $initial_value,
		) );
		$setting_id = 'nav_menu_locations[primary]';

		$setting = new WP_Customize_Setting( $this->manager, $setting_id );
		$this->assertEquals( $initial_value, $setting->value() );

		$override_value = -123456;
		$this->manager->set_post_value( $setting_id, $override_value );
		$setting->preview();

		$this->assertEquals( $override_value, $setting->value() );
	}
}

