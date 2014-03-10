<?php
class Test_Widget_Customizer extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();

		// Create a new user then add 'edit_theme_options' capability
		$user_id = $this->factory->user->create();
		$user    = wp_set_current_user( $user_id );
		$user->add_cap( 'edit_theme_options' );

		// Pretending in customize page.
		if ( ! isset( $_REQUEST['wp_customize'] ) ) {
			$_REQUEST['wp_customize'] = 'on';
		}

		if ( ! class_exists( 'WP_Customize_Manager' ) )
			require_once ABSPATH . WPINC . '/class-wp-customize-manager.php';

		// Init Customize class.
		if ( ! isset( $GLOBALS['wp_customize'] ) )
			$GLOBALS['wp_customize'] = new WP_Customize_Manager;

		// Removes any registered actions (in which some themes use) and re-register action
		// from this plugin.
		remove_all_actions( 'customize_register' );
		add_action( 'customize_register', array( 'Widget_Customizer', 'customize_register' ) );

		set_current_screen( 'customize' );

		do_action( 'customize_register', $GLOBALS['wp_customize'] );
	}

	public function test_plugins_loaded() {
		$this->assertTrue( class_exists( 'Widget_Customizer' ), 'class Widget_Customizer does not exists' );
		$this->assertGreaterThan( 0, has_action( 'plugins_loaded', array( 'Widget_Customizer', 'setup' ) ), 'setup method is not properly invoked during plugins_loaded' );
	}

	public function test_setup_i18n() {
		global $l10n;

		$test_string = __( 'Test string', 'widget-customizer' );
		$this->assertArrayHasKey( 'widget-customizer', $l10n, 'Text domain is not loaded or has the wrong name' );
	}

	public function test_setup_actions() {
		// Makes sure all registered actions are invoked in expected hooks

		$this->assertGreaterThan( 0, has_action( 'after_setup_theme', array( 'Widget_Customizer', 'setup_widget_addition_previews' ) ), 'preview_new_widgets method is not properly invoked during after_setup_theme' );

		$this->assertGreaterThan( 0, has_action( 'customize_register', array( 'Widget_Customizer', 'customize_register' ) ), 'customize_register method is not properly invoked during customize_register' );

		$this->assertGreaterThan( 0, has_action( sprintf( 'wp_ajax_%s', Widget_Customizer::UPDATE_WIDGET_AJAX_ACTION ), array( 'Widget_Customizer', 'wp_ajax_update_widget' ) ), 'wp_ajax_update_widget method is not properly invoked during wp_ajax_' . Widget_Customizer::UPDATE_WIDGET_AJAX_ACTION );

		$this->assertGreaterThan( 0, has_action( 'customize_controls_enqueue_scripts', array( 'Widget_Customizer', 'customize_controls_enqueue_deps' ) ), 'customize_controls_enqueue_deps method is not properly invoked during customize_controls_enqueue_scripts' );

		$this->assertGreaterThan( 0, has_action( 'customize_preview_init', array( 'Widget_Customizer', 'customize_preview_init' ) ), 'customize_preview_init method is not properly invoked during customize_preview_init' );

		$this->assertGreaterThan( 0, has_action( 'widgets_admin_page', array( 'Widget_Customizer', 'widget_customizer_link' ) ), 'widget_customizer_link method is not properly invoked during widgets_admin_page' );

		$this->assertGreaterThan( 0, has_action( 'dynamic_sidebar', array( 'Widget_Customizer', 'tally_sidebars_via_dynamic_sidebar_actions' ) ), 'tally_sidebars_via_dynamic_sidebar_actions method is not properly invoked during dynamic_sidebar' );
	}

	public function test_setup_filters() {
		// Makes sure all registered filters are invoked in expected hooks

		$this->assertEquals( 10, has_action( 'temp_is_active_sidebar', array( 'Widget_Customizer', 'tally_sidebars_via_is_active_sidebar_calls' ) ), 'tally_sidebars_via_is_active_sidebar_calls method is not properly invoked during temp_is_active_sidebar' );

		$this->assertEquals( 10, has_action( 'temp_dynamic_sidebar_has_widgets', array( 'Widget_Customizer', 'tally_sidebars_via_dynamic_sidebar_calls' ) ), 'tally_sidebars_via_dynamic_sidebar_calls method is not properly invoked during temp_dynamic_sidebar_has_widgets' );
	}

	public function test_plugin_meta() {
		$this->assertEquals( 'widget-customizer', Widget_Customizer::get_plugin_meta( 'TextDomain' ), 'Unexpected TextDomain value of plugin data' );
		$this->assertEquals( '/languages', Widget_Customizer::get_plugin_meta( 'DomainPath' ), 'Unexpected DomainPath value of plugin data' );
		$this->assertEquals( 'Widget Customizer', Widget_Customizer::get_plugin_meta( 'Name' ), 'Unexpected Version value plugin data' );
	}

	public function test_preview_new_widgets() {
		// @todo Adds test here. Please note that this is the most tricky test as it tests AJAX request.
	}

	public function test_customize_register() {
		// Since two classes are expected to be loaded in here, tests it if those classess exist.
		$expected_classes_loaded = (
			class_exists( 'Sidebar_Widgets_WP_Customize_Control' )
			&&
			class_exists( 'Widget_Form_WP_Customize_Control' )
		);

		$this->assertTrue( $expected_classes_loaded, 'Sidebar_Widgets_WP_Customize_Control and Widget_Form_WP_Customize_Control are not loaded properly' );

		// @todo Puts more assertions
	}

	public function test_customize_controls_enqueue_deps() {
		global $wp_scripts;

		remove_all_actions( 'customize_controls_enqueue_scripts' );
		add_action( 'customize_controls_enqueue_scripts', array( 'Widget_Customizer', 'customize_controls_enqueue_deps' ) );
		do_action( 'customize_controls_enqueue_scripts' );

		$this->assertTrue( wp_script_is( 'jquery-ui-sortable', 'enqueued' ), 'jquery-ui-sortable script is not properly enqueued' );
		$this->assertTrue( wp_script_is( 'jquery-ui-droppable', 'enqueued' ), 'jquery-ui-droppable script is not properly enqueued' );
		$this->assertTrue( wp_script_is( 'widget-customizer', 'enqueued' ), 'widget-customizer script is not properly enqueued' );

		$this->assertTrue( wp_style_is( 'widget-customizer', 'enqueued' ), 'widget-customizer style is not properly enqueued' );

		$this->assertNotEmpty( $wp_scripts->get_data( 'widget-customizer', 'data' ), 'widget-customizer data is empty' );
	}
}
