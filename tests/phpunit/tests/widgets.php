<?php

/**
 * Test functions and classes for widgets and sidebars.
 *
 * @group widgets
 */
class Tests_Widgets extends WP_UnitTestCase {
	public $sidebar_index;
	public $valid_sidebar;

	function clean_up_global_scope() {
		global $wp_widget_factory, $wp_registered_sidebars, $wp_registered_widgets, $wp_registered_widget_controls, $wp_registered_widget_updates;

		$wp_registered_sidebars = array();
		$wp_registered_widgets = array();
		$wp_registered_widget_controls = array();
		$wp_registered_widget_updates = array();
		$wp_widget_factory->widgets = array();

		parent::clean_up_global_scope();
	}

	function tearDown() {
		global $wp_customize;
		$wp_customize = null;

		parent::tearDown();
	}

	/**
	 * @see register_widget()
	 * @see unregister_widget()
	 */
	function test_register_and_unregister_widget_core_widget() {
		global $wp_widget_factory;

		$widget_class = 'WP_Widget_Search';
		register_widget( $widget_class );
		$this->assertArrayHasKey( $widget_class, $wp_widget_factory->widgets );

		unregister_widget( $widget_class );
		$this->assertArrayNotHasKey( $widget_class, $wp_widget_factory->widgets );
	}

	/**
	 * Test that registering a widget class and registering a widget instance work together.
	 *
	 * @see register_widget()
	 * @see unregister_widget()
	 * @ticket 28216
	 */
	function test_register_and_unregister_widget_instance() {
		global $wp_widget_factory, $wp_registered_widgets;
		$this->assertEmpty( $wp_widget_factory->widgets );
		$this->assertEmpty( $wp_registered_widgets );

		update_option( 'widget_search', array(
			2 => array( 'title' => '' ),
			'_multiwidget' => 1,
		) );
		update_option( 'widget_better_search', array(
			3 => array( 'title' => '' ),
			'_multiwidget' => 1,
		) );
		update_option( 'widget_best_search', array(
			4 => array( 'title' => '' ),
			'_multiwidget' => 1,
		) );

		register_widget( 'WP_Widget_Search' );
		$this->assertArrayHasKey( 'WP_Widget_Search', $wp_widget_factory->widgets );

		$widget_better_search = new WP_Widget_Search();
		$widget_better_search->id_base = 'better_search';
		$widget_better_search->name = 'Better Search';
		$widget_better_search->option_name = 'widget_' . $widget_better_search->id_base;
		$widget_better_search->widget_options['classname'] = 'widget_' . $widget_better_search->id_base;
		$widget_better_search->control_options['id_base'] = $widget_better_search->id_base;
		register_widget( $widget_better_search );
		$this->assertContains( $widget_better_search, $wp_widget_factory->widgets );

		$widget_best_search = new WP_Widget_Search();
		$widget_best_search->id_base = 'best_search';
		$widget_best_search->name = 'Best Search';
		$widget_best_search->option_name = 'widget_' . $widget_best_search->id_base;
		$widget_best_search->widget_options['classname'] = 'widget_' . $widget_best_search->id_base;
		$widget_best_search->control_options['id_base'] = $widget_best_search->id_base;
		register_widget( $widget_best_search );
		$this->assertContains( $widget_best_search, $wp_widget_factory->widgets );

		$this->assertCount( 3, $wp_widget_factory->widgets );
		$this->assertArrayHasKey( 'WP_Widget_Search', $wp_widget_factory->widgets );
		$this->assertContains( $widget_better_search, $wp_widget_factory->widgets );
		$this->assertContains( $widget_best_search, $wp_widget_factory->widgets );

		$wp_widget_factory->_register_widgets();

		$this->assertArrayHasKey( 'search-2', $wp_registered_widgets );
		$this->assertArrayHasKey( 'better_search-3', $wp_registered_widgets );
		$this->assertArrayHasKey( 'best_search-4', $wp_registered_widgets );
		$this->assertInstanceOf( 'WP_Widget_Search', $wp_registered_widgets['search-2']['callback'][0] );
		$this->assertSame( $widget_better_search, $wp_registered_widgets['better_search-3']['callback'][0] );
		$this->assertSame( $widget_best_search, $wp_registered_widgets['best_search-4']['callback'][0] );

		$this->assertContains( $widget_better_search, $wp_widget_factory->widgets );
		$this->assertContains( $widget_best_search, $wp_widget_factory->widgets );
		$this->assertArrayHasKey( 'WP_Widget_Search', $wp_widget_factory->widgets );
		unregister_widget( 'WP_Widget_Search' );
		unregister_widget( $widget_better_search );
		unregister_widget( $widget_best_search );
		$this->assertNotContains( $widget_better_search, $wp_widget_factory->widgets );
		$this->assertNotContains( $widget_best_search, $wp_widget_factory->widgets );
		$this->assertArrayNotHasKey( 'WP_Widget_Search', $wp_widget_factory->widgets );
	}

	/**
	 * @group sidebar
	 */
	function test_register_sidebars_single() {

		global $wp_registered_sidebars;

		register_sidebars( 1, array( 'id' => 'wp-unit-test' ) );

		$this->assertTrue( isset( $wp_registered_sidebars['wp-unit-test'] ) );

	}

	/**
	 * @group sidebar
	 */
	function test_register_sidebars_multiple() {

		global $wp_registered_sidebars;

		$result = array();
		$num = 3;
		$id_base = 'WP Unit Test';
		register_sidebars( $num, array( 'name' => $id_base . ' %d' ) );

		$names = wp_list_pluck( $wp_registered_sidebars, 'name' );
		for ( $i = 1; $i <= $num; $i++ ) {
			if ( in_array( "$id_base $i", $names ) ) {
				$result[] = true;
			}
		}

		$this->assertEquals( $num, count( $result ) );

	}

	/**
	 * @group sidebar
	 */
	function test_register_sidebar_with_no_id() {
		global $wp_registered_sidebars;

		$this->setExpectedIncorrectUsage( 'register_sidebar' );

		// Incorrectly register a couple of sidebars for fun.
		register_sidebar();
		register_sidebar();

		$derived_sidebar_id = "sidebar-2"; // Number of sidebars in the global + 1.

		$this->assertArrayHasKey( $derived_sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * @group sidebar
	 */
	function test_unregister_sidebar_registered_with_no_id() {
		global $wp_registered_sidebars;

		$this->setExpectedIncorrectUsage( 'register_sidebar' );

		// Incorrectly register a couple of sidebars for fun.
		register_sidebar();
		register_sidebar();

		$derived_sidebar_id = "sidebar-2"; // Number of sidebars in the global + 1.

		unregister_sidebar( $derived_sidebar_id );

		$this->assertArrayNotHasKey( $derived_sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * @group sidebar
	 */
	function test_register_sidebar_with_string_id() {

		global $wp_registered_sidebars;

		$sidebar_id = 'wp-unit-test';
		register_sidebar( array( 'id' => $sidebar_id ) );

		$this->assertArrayHasKey( $sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * @group sidebar
	 */
	function test_unregister_sidebar_with_string_id() {
		global $wp_registered_sidebars;

		$sidebar_id = 'wp-unit-tests';
		register_sidebar( array( 'id' => $sidebar_id ) );

		unregister_sidebar( $sidebar_id );
		$this->assertArrayNotHasKey( $sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * @group sidebar
	 */
	function test_register_sidebar_with_numeric_id() {
		global $wp_registered_sidebars;

		$sidebar_id = 2;
		register_sidebar( array( 'id' => $sidebar_id ) );

		$this->assertArrayHasKey( $sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * @group sidebar
	 */
	function test_unregister_sidebar_with_numeric_id() {
		global $wp_registered_sidebars;

		$sidebar_id = 2;
		register_sidebar( array( 'id' => $sidebar_id ) );

		unregister_sidebar( $sidebar_id );
		$this->assertArrayNotHasKey( $sidebar_id, $wp_registered_sidebars );
	}

	/**
	 * Utility hook callback used to store a sidebar ID mid-function.
	 */
	function retrieve_sidebar_id( $index, $valid_sidebar ) {
		$this->sidebar_index = $index;
		$this->valid_sidebar = $valid_sidebar;
	}

	/**
	 * @group sidebar
	 */
	function test_dynamic_sidebar_using_sidebar_registered_with_no_id() {
		$this->setExpectedIncorrectUsage( 'register_sidebar' );

		// Incorrectly register a couple of sidebars for fun.
		register_sidebar();
		register_sidebar();

		$derived_sidebar_id = "sidebar-2"; // Number of sidebars in the global + 1.

		add_action( 'dynamic_sidebar_before', array( $this, 'retrieve_sidebar_id' ), 10, 2 );

		dynamic_sidebar( 2 );

		$this->assertSame( $derived_sidebar_id, $this->sidebar_index );
	}

	/**
	 * @group sidebar
	 */
	function test_dynamic_sidebar_using_invalid_sidebar_id() {
		register_sidebar( array( 'id' => 'wp-unit-text' ) );

		add_action( 'dynamic_sidebar_before', array( $this, 'retrieve_sidebar_id' ), 10, 2 );

		// 5 is a fake sidebar ID.
		dynamic_sidebar( 5 );

		/*
		 * If the sidebar ID is invalid, the second argument passed to
		 * the 'dynamic_sidebar_before' hook will be false.
		 */
		$this->assertSame( false, $this->valid_sidebar );
	}

	/**
	 * @group sidebar
	 */
	function test_dynamic_sidebar_numeric_id() {
		$sidebar_id = 2;
		register_sidebar( array( 'id' => $sidebar_id ) );

		add_action( 'dynamic_sidebar_before', array( $this, 'retrieve_sidebar_id' ), 10, 2 );

		dynamic_sidebar( $sidebar_id );

		$this->assertSame( "sidebar-{$sidebar_id}", $this->sidebar_index );
	}

	/**
	 * @group sidebar
	 */
	function test_dynamic_sidebar_string_id() {
		$sidebar_id = 'wp-unit-tests';
		register_sidebar( array( 'id' => $sidebar_id ) );

		add_action( 'dynamic_sidebar_before', array( $this, 'retrieve_sidebar_id' ), 10, 2 );

		dynamic_sidebar( $sidebar_id );

		$this->assertSame( $sidebar_id, $this->sidebar_index );
	}

	/**
	 * @see WP_Widget_Search::form()
	 */
	function test_wp_widget_search_form() {
		$widget = new WP_Widget_Search( 'foo', 'Foo' );
		ob_start();
		$args = array(
			'before_widget' => '<section>',
			'after_widget' => "</section>\n",
			'before_title' => '<h2>',
			'after_title' => "</h2>\n",
		);
		$instance = array( 'title' => 'Buscar' );
		$widget->_set( 2 );
		$widget->widget( $args, $instance );
		$output = ob_get_clean();
		$this->assertNotContains( 'no-options-widget', $output );
		$this->assertContains( '<h2>Buscar</h2>', $output );
		$this->assertContains( '<section>', $output );
		$this->assertContains( '</section>', $output );
	}

	/**
	 * @see WP_Widget::form()
	 */
	function test_wp_widget_form() {
		$widget = new WP_Widget( 'foo', 'Foo' );
		ob_start();
		$retval = $widget->form( array() );
		$output = ob_get_clean();
		$this->assertEquals( 'noform', $retval );
		$this->assertContains( 'no-options-widget', $output );
	}

	/**
	 * @see WP_Widget::__construct()
	 */
	function test_wp_widget_constructor() {
		$id_base = 'foo';
		$name = 'Foo';
		$foo_widget = new WP_Widget( $id_base, $name );

		$this->assertEquals( $id_base, $foo_widget->id_base );
		$this->assertEquals( $name, $foo_widget->name );
		$this->assertEquals( "widget_{$id_base}", $foo_widget->option_name );
		$this->assertArrayHasKey( 'classname', $foo_widget->widget_options );
		$this->assertEquals( "widget_{$id_base}", $foo_widget->widget_options['classname'] );
		$this->assertArrayHasKey( 'id_base', $foo_widget->control_options );
		$this->assertEquals( $id_base, $foo_widget->control_options['id_base'] );

		$id_base = 'bar';
		$name = 'Bar';
		$widget_options = array(
			'classname' => 'bar_classname',
		);
		$control_options = array(
			'id_base' => 'bar_id_base',
		);
		$bar_widget = new WP_Widget( $id_base, $name, $widget_options, $control_options );
		$this->assertEquals( $widget_options['classname'], $bar_widget->widget_options['classname'] );
		$this->assertEquals( $control_options['id_base'], $bar_widget->control_options['id_base'] );
	}

	/**
	 * @see WP_Widget::get_field_name()
	 * @dataProvider data_wp_widget_get_field_name
	 *
	 */
	function test_wp_widget_get_field_name( $expected, $value_to_test ) {
		$widget = new WP_Widget( 'foo', 'Foo' );
		$widget->_set( 2 );
		$this->assertEquals( $expected, $widget->get_field_name( $value_to_test ) );
	}

	/**
	 * Data provider.
	 *
	 * Passes the expected field name and the value to test.
	 *
	 * @since 4.4.0
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $expected      The expected field id to be returned.
	 *         @type string $value_to_test The value being passed to the get_field_name method.
	 *     }
	 * }
	 */
	function data_wp_widget_get_field_name( ) {

		return array(
			array(
				'widget-foo[2][title]',
				'title',
			),
			array(
				'widget-foo[2][posttypes][]',
				'posttypes[]',
			),
			array(
				'widget-foo[2][posttypes][4]',
				'posttypes[4]',
			),
			array(
				'widget-foo[2][posttypes][4][]',
				'posttypes[4][]',
			),
			array(
				'widget-foo[2][posttypes][4][][6]',
				'posttypes[4][][6]',
			),
		);
	}

	/**
	 * @see WP_Widget::get_field_id()
	 * @dataProvider data_wp_widget_get_field_id
	 *
	 */
	function test_wp_widget_get_field_id( $expected, $value_to_test ) {
		$widget = new WP_Widget( 'foo', 'Foo' );
		$widget->_set( 2 );
		$this->assertEquals( $expected, $widget->get_field_id( $value_to_test ) );
	}


	/**
	 * Data provider.
	 *
	 * Passes the expected field id and the value to be used in the tests.
	 *
	 * @since 4.4.0
	 *
	 * @return array {
	 *     @type array {
	 *         @type string $expected      The expected field id to be returned.
	 *         @type string $value_to_test The value being passed to the get_field_id method.
	 *     }
	 * }
	 */
	function data_wp_widget_get_field_id() {
		return array(
			array(
				'widget-foo-2-title',
				'title',
			),
			array(
				'widget-foo-2-posttypes',
				'posttypes[]',
			),
			array(
				'widget-foo-2-posttypes-4',
				'posttypes[4]',
			),
			array(
				'widget-foo-2-posttypes-4',
				'posttypes[4][]',
			),
			array(
				'widget-foo-2-posttypes-4-6',
				'posttypes[4][][6]',
			),
		);
	}

	/**
	 * @see WP_Widget::_register()
	 */
	function test_wp_widget__register() {
		global $wp_registered_widgets;

		$settings = get_option( 'widget_search' );
		unset( $settings['_multiwidget'] );
		$this->assertArrayHasKey( 2, $settings );

		$this->assertEmpty( $wp_registered_widgets );
		wp_widgets_init();

		// Note: We cannot use array_keys() here because $settings could be an ArrayIterator
		foreach ( $settings as $widget_number => $instance ) {
			$widget_id = "search-$widget_number";
			$this->assertArrayHasKey( $widget_id, $wp_registered_widgets );
		}
	}

	// @todo test WP_Widget::display_callback()

	/**
	 * @see WP_Widget::is_preview()
	 */
	function test_wp_widget_is_preview() {
		global $wp_customize;

		$widget = new WP_Widget( 'foo', 'Foo' );

		$this->assertEmpty( $wp_customize );
		$this->assertFalse( $widget->is_preview() );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';
		$wp_customize = new WP_Customize_Manager();
		$wp_customize->start_previewing_theme();

		$this->assertTrue( $widget->is_preview() );
	}

	// @todo test WP_Widget::update_callback()
	// @todo test WP_Widget::form_callback()
	// @todo test WP_Widget::_register_one()

	/**
	 * @see WP_Widget::get_settings()
	 */
	function test_wp_widget_get_settings() {
		global $wp_registered_widgets;

		$option_value = get_option( 'widget_search' );
		$this->assertArrayHasKey( '_multiwidget', $option_value );
		$this->assertEquals( 1, $option_value['_multiwidget'] );
		$this->assertArrayHasKey( 2, $option_value );
		$instance = $option_value[2];
		$this->assertInternalType( 'array', $instance );
		$this->assertArrayHasKey( 'title', $instance );
		unset( $option_value['_multiwidget'] );

		// Pretend this widget is new.
		delete_option( 'widget_nav_menu' );
		$never_used = get_option( 'widget_nav_menu', array() );
		$this->assertEquals( array(), (array) $never_used );

		wp_widgets_init();
		$wp_widget_search = $wp_registered_widgets['search-2']['callback'][0];

		$settings = $wp_widget_search->get_settings();
		// @todo $this->assertArrayNotHasKey( '_multiwidget', $settings ); ?
		$this->assertArrayHasKey( 2, $settings );

		foreach ( $option_value as $widget_number => $instance ) {
			$this->assertEquals( $settings[ $widget_number ], $option_value[ $widget_number ] );
		}

		// After widgets_init(), get_settings() should create the widget option.
		$never_used = get_option( 'widget_nav_menu' );
		$this->assertEquals( 1, $never_used['_multiwidget'] );
		$this->assertArrayNotHasKey( 0, $never_used );
	}

	/**
	 * @see WP_Widget::save_settings()
	 */
	function test_wp_widget_save_settings() {
		global $wp_registered_widgets;

		wp_widgets_init();
		$wp_widget_search = $wp_registered_widgets['search-2']['callback'][0];

		$settings = $wp_widget_search->get_settings();
		$overridden_title = 'Unit Tested';

		/*
		 * Note that if a plugin is filtering $settings to be an ArrayIterator,
		 * then doing this:
		 *     $settings[2]['title'] = $overridden_title;
		 * Will fail with this:
		 * > Indirect modification of overloaded element of X has no effect.
		 * So this is why the value must be obtained.
		 */
		$instance = $settings[2];
		$instance['title'] = $overridden_title;
		$settings[2] = $instance;

		$wp_widget_search->save_settings( $settings );

		$option_value = get_option( $wp_widget_search->option_name );
		$this->assertArrayHasKey( '_multiwidget', $option_value );
		$this->assertEquals( $overridden_title, $option_value[2]['title'] );
	}

	/**
	 * @see WP_Widget::save_settings()
	 */
	function test_wp_widget_save_settings_delete() {
		global $wp_registered_widgets;

		wp_widgets_init();
		$wp_widget_search = $wp_registered_widgets['search-2']['callback'][0];

		$settings = $wp_widget_search->get_settings();
		$this->assertArrayHasKey( 2, $settings );
		unset( $settings[2] );
		$wp_widget_search->save_settings( $settings );
		$option_value = get_option( $wp_widget_search->option_name );
		$this->assertArrayNotHasKey( 2, $option_value );
	}

	/**
	 * @see wp_widget_control()
	 */
	function test_wp_widget_control() {
		global $wp_registered_widgets;

		wp_widgets_init();
		require_once ABSPATH . '/wp-admin/includes/widgets.php';
		$widget_id = 'search-2';
		$widget = $wp_registered_widgets[ $widget_id ];
		$params = array(
			'widget_id' => $widget['id'],
			'widget_name' => $widget['name'],
		);
		$args = wp_list_widget_controls_dynamic_sidebar( array( 0 => $params, 1 => $widget['params'][0] ) );

		ob_start();
		call_user_func_array( 'wp_widget_control', $args );
		$control = ob_get_clean();
		$this->assertNotEmpty( $control );

		$this->assertContains( '<div class="widget-top">', $control );
		$this->assertContains( '<div class="widget-title-action">', $control );
		$this->assertContains( '<div class="widget-title">', $control );
		$this->assertContains( '<form method="post">', $control );
		$this->assertContains( '<div class="widget-content">', $control );
		$this->assertContains( '<input class="widefat"', $control );
		$this->assertContains( '<input type="hidden" name="id_base" class="id_base" value="search"', $control );
		$this->assertContains( '<div class="widget-control-actions">', $control );
		$this->assertContains( '<div class="alignleft">', $control );
		$this->assertContains( 'widget-control-remove', $control );
		$this->assertContains( 'widget-control-close', $control );
		$this->assertContains( '<div class="alignright">', $control );
		$this->assertContains( '<input type="submit" name="savewidget"', $control );

		$param_overrides = array(
			'before_form' => '<!-- before_form -->',
			'after_form' => '<!-- after_form -->',
			'before_widget_content' => '<!-- before_widget_content -->',
			'after_widget_content' => '<!-- after_widget_content -->',
		);
		$params = array_merge( $params, $param_overrides );
		$args = wp_list_widget_controls_dynamic_sidebar( array( 0 => $params, 1 => $widget['params'][0] ) );

		ob_start();
		call_user_func_array( 'wp_widget_control', $args );
		$control = ob_get_clean();
		$this->assertNotEmpty( $control );
		$this->assertNotContains( '<form method="post">', $control );
		$this->assertNotContains( '<div class="widget-content">', $control );

		foreach ( $param_overrides as $contained ) {
			$this->assertContains( $contained, $control );
		}
	}

	function test_the_widget_custom_before_title_arg() {
		register_widget( 'WP_Widget_Text' );

		ob_start();
		the_widget(
			'WP_Widget_Text',
			array( 'title' => 'Notes', 'text' => 'Sample text' ),
			array( 'before_widget' => '<span class="special %s">', 'after_widget' => '</span>' )
		);
		$actual = ob_get_clean();

		unregister_widget( 'WP_Widget_Text' );

		$this->assertRegExp( '/<span class="special widget_text">/', $actual );

	}

	/**
	 * Tests that no 'Undefined index' exception is thrown when trying to
	 * display an unregistered widget.
	 *
	 * @see \the_widget()
	 */
	function test_the_widget_with_unregistered_widget() {
		$this->setExpectedIncorrectUsage( 'the_widget' );
		the_widget( 'Widget_Class' );
	}

	/**
	 * Register nav menu sidebars.
	 *
	 * @param array $sidebars Sidebar slugs.
	 */
	function register_sidebars( $sidebars ) {
		foreach ( $sidebars as $sidebar ) {
			register_sidebar( array( 'id' => $sidebar ) );
		}
	}

	/**
	 * Tests for when 'sidebars_widgets' theme mod is populated.
	 *
	 * @covers retrieve_widgets()
	 */
	function test_retrieve_widgets_with_theme_mod() {
		global $sidebars_widgets, $_wp_sidebars_widgets;

		wp_widgets_init();
		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2', 'sidebar-3', 'wp_inactive_widgets' ) );

		// Test restoring sidebars widgets when previously activated.
		set_theme_mod( 'sidebars_widgets', array(
			'time' => time(),
			'data' => array(
				'sidebar-1' => array( 'tag_cloud-1' ),
				'sidebar-2' => array(),
				'sidebar-3' => array( 'unregistered_widget-1', 'text-1', 'media_image-1' ),
				'orphaned_widgets_1' => array( 'media_video-2' ),
			),
		) );

		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'fantasy'   => array( 'archives-2' ),
			'wp_inactive_widgets' => array(),
		);

		$result = retrieve_widgets( true );

		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $result, $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		$this->assertContains( 'tag_cloud-1', $sidebars_widgets['sidebar-1'] );
		$this->assertContains( 'text-1', $sidebars_widgets['sidebar-2'] );
		$this->assertContains( 'media_image-1', $sidebars_widgets['sidebar-3'] );
		$this->assertArrayNotHasKey( 'orphaned_widgets_1', $sidebars_widgets );

		// Unregistered widget should be filtered out.
		$this->assertNotContains( 'unregistered_widget-1', $sidebars_widgets['sidebar-3'] );

		// 6 default widgets - 1 active text widget + 1 orphaned widget = 6.
		$this->assertCount( 6, $sidebars_widgets['wp_inactive_widgets'] );

		$this->assertContains( 'meta-2',            $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'search-2',          $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'archives-2',        $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'categories-2',      $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-posts-2',    $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-comments-2', $sidebars_widgets['wp_inactive_widgets'] );

		// Sidebar_widgets option was updated.
		$this->assertEquals( $sidebars_widgets, wp_get_sidebars_widgets() );
	}

	/**
	 * Tests for when sidebars widgets matches registered sidebars.
	 *
	 * @covers retrieve_widgets()
	 */
	function test_retrieve_widgets_with_sidebars_widgets_matching_registered_sidebars() {
		global $sidebars_widgets;

		wp_widgets_init();
		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2','sidebar-3', 'wp_inactive_widgets' ) );

		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'sidebar-3' => array( 'custom_widget-1' ),
			'wp_inactive_widgets' => array(),
		);

		$result = retrieve_widgets( true );

		// $sidebars_widgets matches registered sidebars.
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $result, $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		$this->assertContains( 'tag_cloud-1', $sidebars_widgets['sidebar-1'] );
		$this->assertContains( 'text-1', $sidebars_widgets['sidebar-2'] );

		// Invalid widget removed, even when $sidebars_widgets matches registered sidebars.
		$this->assertEmpty( $sidebars_widgets['sidebar-3'] );

		// No lost widgets when $sidebars_widgets matches registered sidebars.
		$this->assertEmpty( $sidebars_widgets['wp_inactive_widgets'] );
	}

	/**
	 * Tests for when sidebars widgets doesn't match registered sidebars.
	 *
	 * @covers retrieve_widgets()
	 */
	function test_retrieve_widgets_with_sidebars_widgets_not_matching_registered_sidebars() {
		global $sidebars_widgets, $_wp_sidebars_widgets;

		wp_widgets_init();
		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2','sidebar-3', 'wp_inactive_widgets' ) );

		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'fantasy'   => array( 'unregistered_widget-1' ),
			'wp_inactive_widgets' => array(),
		);

		// Theme changed.
		$result = retrieve_widgets( true );

		$_wp_sidebars_widgets = array();
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $result, $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		// Current theme doesn't have a fantasy-sidebar.
		$this->assertArrayNotHasKey( 'fantasy', $sidebars_widgets );
		$this->assertArrayHasKey( 'sidebar-3', $sidebars_widgets );

		$this->assertContains( 'tag_cloud-1', $sidebars_widgets['sidebar-1'] );
		$this->assertContains( 'text-1', $sidebars_widgets['sidebar-2'] );
		$this->assertEmpty( $sidebars_widgets['sidebar-3'] );

		// We should not have orphaned widgets, because widget was not registered.
		$this->assertArrayNotHasKey( 'orphaned_widgets_1', $sidebars_widgets );

		// 6 default widgets.
		$this->assertCount( 6, $sidebars_widgets['wp_inactive_widgets'] );

		$this->assertContains( 'archives-2',        $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'meta-2',            $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'search-2',          $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'categories-2',      $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-posts-2',    $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-comments-2', $sidebars_widgets['wp_inactive_widgets'] );

		// Sidebar_widgets option was updated.
		$this->assertEquals( $sidebars_widgets, wp_get_sidebars_widgets() );

		// Reset.
		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'fantasy'   => array( 'archives-2' ),
			'wp_inactive_widgets' => array(),
		);

		// Theme did not change.
		$result = retrieve_widgets();

		$_wp_sidebars_widgets = array();
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $result, $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		// This sidebar is not registered anymore.
		$this->assertArrayNotHasKey( 'fantasy', $sidebars_widgets );
		$this->assertArrayHasKey( 'sidebar-3', $sidebars_widgets );

		$this->assertContains( 'tag_cloud-1', $sidebars_widgets['sidebar-1'] );
		$this->assertContains( 'text-1', $sidebars_widgets['sidebar-2'] );

		// 6 default widgets - 1 active text widget = 5.
		$this->assertCount( 6, $sidebars_widgets['wp_inactive_widgets'] );

		$this->assertContains( 'meta-2',            $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'search-2',          $sidebars_widgets['wp_inactive_widgets'] );
		// archives-2 ends up as inactive because fantasy sidebar doesn't exist.
		$this->assertContains( 'archives-2',        $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'categories-2',      $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-posts-2',    $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-comments-2', $sidebars_widgets['wp_inactive_widgets'] );

		// Sidebar_widgets option was updated.
		$this->assertEquals( $sidebars_widgets, wp_get_sidebars_widgets() );
	}

	/**
	 * Tests for Customizer mode.
	 *
	 * @covers retrieve_widgets()
	 */
	function test_retrieve_widgets_for_customizer() {
		global $sidebars_widgets, $_wp_sidebars_widgets;

		wp_widgets_init();
		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2','sidebar-3', 'wp_inactive_widgets' ) );

		$old_sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'sidebar-3' => array( 'unregistered_widget-1' ),
			'fantasy'   => array( 'archives-2' ),
			'wp_inactive_widgets' => array(),
		);
		set_theme_mod( 'sidebars_widgets', $old_sidebars_widgets );

		$result = retrieve_widgets( 'customize' );

		$_wp_sidebars_widgets = array();
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( $result, $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		$this->assertContains( 'tag_cloud-1', $sidebars_widgets['sidebar-1'] );
		$this->assertContains( 'text-1', $sidebars_widgets['sidebar-2'] );
		$this->assertArrayHasKey( 'sidebar-3', $sidebars_widgets );
		$this->assertEmpty( $sidebars_widgets['sidebar-3'] );
		$this->assertCount( 6, $sidebars_widgets['wp_inactive_widgets'] );

		$this->assertContains( 'meta-2',            $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'search-2',          $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'archives-2',        $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'categories-2',      $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-posts-2',    $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'recent-comments-2', $sidebars_widgets['wp_inactive_widgets'] );

		// Theme mod with previous widgets was not removed.
		$this->assertEqualSets( $old_sidebars_widgets, get_theme_mod( 'sidebars_widgets' ) );

		// Sidebar_widgets option was not updated.
		$this->assertNotEquals( $sidebars_widgets, wp_get_sidebars_widgets() );
	}

	function test_retreive_widgets_with_single_widget() {
		global $sidebars_widgets;

		wp_widgets_init();

		// Register single-dimension widget.
		wp_register_sidebar_widget( 'single', 'Single', '__return_false', array(), array() );
		wp_register_widget_control( 'single', 'Single', '__return_false', array(), array() );

		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2', 'wp_inactive_widgets' ) );

		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'wp_inactive_widgets' => array(),
		);

		// Theme changed.
		$result = retrieve_widgets( true );

		$this->assertContains( 'single', $result['wp_inactive_widgets'] );
	}

	/**
	 * Tests for orphaned widgets being moved into inactive widgets.
	 *
	 * @covers retrieve_widgets()
	 */
	function test_retrieve_widgets_move_orphaned_widgets_to_inactive() {
		global $sidebars_widgets;

		wp_widgets_init();
		$this->register_sidebars( array( 'sidebar-1', 'sidebar-2', 'sidebar-3', 'wp_inactive_widgets' ) );

		$sidebars_widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'wp_inactive_widgets' => array( 'search-2', 'archives-2' ),
			'orphaned_widgets_1'  => array( 'calendar-1' ),
		);

		retrieve_widgets();

		$this->assertInternalType( 'array', $sidebars_widgets );

		foreach ( $sidebars_widgets as $widgets ) {
			$this->assertInternalType( 'array', $widgets );
		}

		// 6 default widgets + 1 orphaned calendar widget = 7.
		$this->assertCount( 7, $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertContains( 'calendar-1', $sidebars_widgets['wp_inactive_widgets'] );
		$this->assertArrayNotHasKey( 'orphaned_widgets_1', $sidebars_widgets );

		// Sidebar_widgets option was updated.
		$this->assertEquals( $sidebars_widgets, wp_get_sidebars_widgets() );
	}

	/**
	 * Test _wp_remove_unregistered_widgets.
	 *
	 * @covers _wp_remove_unregistered_widgets()
	 */
	public function test__wp_remove_unregistered_widgets() {
		$widgets = array(
			'sidebar-1' => array( 'tag_cloud-1' ),
			'sidebar-2' => array( 'text-1' ),
			'fantasy'   => array( 'archives-2' ),
			'wp_inactive_widgets' => array(),
			'array_version' => 3,
		);

		$whitelist = array( 'tag_cloud-1', 'text-1' );

		$filtered_widgets = _wp_remove_unregistered_widgets( $widgets, $whitelist );

		$this->assertInternalType( 'array', $filtered_widgets );
		$this->assertArrayHasKey( 'fantasy', $filtered_widgets );
		$this->assertEmpty( $filtered_widgets['fantasy'] );
		$this->assertArrayHasKey( 'array_version', $filtered_widgets );
		$this->assertEquals( 3, $filtered_widgets['array_version'] );
		$this->assertInternalType( 'integer', $filtered_widgets['array_version'] );
	}

	/**
	 * wp_map_sidebars_widgets Tests.
	 */

	/**
	 * Two themes with one sidebar each should just map, switching to a theme not previously-active.
	 *
	 * @covers wp_map_sidebars_widgets()
	 */
	public function test_one_sidebar_each() {
		$this->register_sidebars( array( 'primary' ) );
		$prev_theme_sidebars = array(
			'unique-slug' => 1,
		);

		$new_next_theme_sidebars = wp_map_sidebars_widgets( $prev_theme_sidebars );

		$expected_sidebars = array(
			'primary' => 1,
			'wp_inactive_widgets' => array(),
		);
		$this->assertEquals( $expected_sidebars, $new_next_theme_sidebars );
	}

	/**
	 * Sidebars with the same name should map, switching to a theme not previously-active.
	 *
	 * @covers wp_map_sidebars_widgets()
	 */
	public function test_sidebars_with_same_slug() {
		$this->register_sidebars( array( 'primary', 'secondary' ) );
		$prev_theme_sidebars = array(
			'primary' => 1,
			'secondary' => 2,
			'wp_inactive_widgets' => array(),
		);

		$new_next_theme_sidebars = wp_map_sidebars_widgets( $prev_theme_sidebars );

		$this->assertEquals( $prev_theme_sidebars, $new_next_theme_sidebars );
	}

	/**
	 * Make educated guesses on theme sidebars.
	 *
	 * @covers wp_map_sidebars_widgets()
	 */
	public function test_sidebar_guessing() {
		$this->register_sidebars( array( 'primary', 'secondary' ) );

		$prev_theme_sidebars = array(
			'header' => array(),
			'footer' => array(),
		);

		$new_next_theme_sidebars = wp_map_sidebars_widgets( $prev_theme_sidebars );

		$expected_sidebars = array(
			'primary' => array(),
			'secondary' => array(),
			'wp_inactive_widgets' => array(),
		);
		$this->assertEquals( $expected_sidebars, $new_next_theme_sidebars );
	}

	/**
	 * Make sure two sidebars that fall in the same group don't get the same menu assigned.
	 *
	 * @covers wp_map_sidebars_widgets()
	 */
	public function test_sidebar_guessing_one_menu_per_group() {
		$this->register_sidebars( array( 'primary' ) );
		$prev_theme_sidebars = array(
			'top-menu' => array(),
			'secondary' => array(),
		);

		$new_next_theme_sidebars = wp_map_sidebars_widgets( $prev_theme_sidebars );

		$expected_sidebars = array(
			'main' => array(),
			'wp_inactive_widgets' => array(),
		);
		$this->assertEqualSets( $expected_sidebars, $new_next_theme_sidebars );
	}

	/**
	 * Make sure two sidebars that fall in the same group get menus assigned from the same group.
	 *
	 * @covers wp_map_sidebars_widgets()
	 */
	public function test_sidebar_guessing_one_menu_per_sidebar() {
		$this->register_sidebars( array( 'primary', 'main' ) );

		$prev_theme_sidebars = array(
			'navigation-menu' => array(),
			'top-menu' => array(),
		);

		$new_next_theme_sidebars = wp_map_sidebars_widgets( $prev_theme_sidebars );

		$expected_sidebars = array(
			'main' => array(),
			'primary' => array(),
			'wp_inactive_widgets' => array(),
		);
		$this->assertEquals( $expected_sidebars, $new_next_theme_sidebars );
	}
}
