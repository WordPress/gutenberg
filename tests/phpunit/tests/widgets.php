<?php

/**
 * Test functions and classes for widgets and sidebars.
 *
 * @group widgets
 */
class Tests_Widgets extends WP_UnitTestCase {

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
	 * @see register_sidebars()
	 */
	function test_register_sidebars_single() {

		global $wp_registered_sidebars;

		register_sidebars( 1, array( 'id' => 'wp-unit-test' ) );

		$this->assertTrue( isset( $wp_registered_sidebars['wp-unit-test'] ) );

	}

	/**
	 * @see register_sidebars()
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
	 * @see register_sidebar
	 * @see unregister_sidebar
	 */
	function test_register_and_unregister_sidebar() {

		global $wp_registered_sidebars;

		$sidebar_id = 'wp-unit-test';
		register_sidebar( array( 'id' => $sidebar_id ) );
		$this->assertArrayHasKey( $sidebar_id, $wp_registered_sidebars );

		unregister_sidebar( $sidebar_id );
		$this->assertArrayNotHasKey( 'wp-unit-test', $wp_registered_sidebars );
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
	 */
	function test_wp_widget_get_field_name() {
		$widget = new WP_Widget( 'foo', 'Foo' );
		$widget->_set( 2 );
		$this->assertEquals( 'widget-foo[2][title]', $widget->get_field_name( 'title' ) );
	}

	/**
	 * @see WP_Widget::get_field_id()
	 */
	function test_wp_widget_get_field_id() {
		$widget = new WP_Widget( 'foo', 'Foo' );
		$widget->_set( 2 );
		$this->assertEquals( 'widget-foo-2-title', $widget->get_field_id( 'title' ) );
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

		wp_set_current_user( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
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

		wp_widgets_init();
		$wp_widget_search = $wp_registered_widgets['search-2']['callback'][0];

		$settings = $wp_widget_search->get_settings();
		// @todo $this->assertArrayNotHasKey( '_multiwidget', $settings ); ?
		$this->assertArrayHasKey( 2, $settings );

		foreach ( $option_value as $widget_number => $instance ) {
			$this->assertEquals( $settings[ $widget_number ], $option_value[ $widget_number ] );
		}
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

}
