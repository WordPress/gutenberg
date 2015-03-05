<?php

/**
 * Tests for the WP_Customize_Manager class.
 *
 * @group customize
 */
class Tests_WP_Customize_Manager extends WP_UnitTestCase {

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

	/**
	 * Instantiate class, set global $wp_customize, and return instance.
	 *
	 * @return WP_Customize_Manager
	 */
	function instantiate() {
		$GLOBALS['wp_customize'] = new WP_Customize_Manager();
		return $GLOBALS['wp_customize'];
	}

	/**
	 * Test WP_Customize_Manager::doing_ajax().
	 *
	 * @group ajax
	 */
	function test_doing_ajax() {
		if ( ! defined( 'DOING_AJAX' ) ) {
			define( 'DOING_AJAX', true );
		}

		$manager = $this->instantiate();
		$this->assertTrue( $manager->doing_ajax() );

		$_REQUEST['action'] = 'customize_save';
		$this->assertTrue( $manager->doing_ajax( 'customize_save' ) );
		$this->assertFalse( $manager->doing_ajax( 'update-widget' ) );
	}

	/**
	 * Test ! WP_Customize_Manager::doing_ajax().
	 */
	function test_not_doing_ajax() {
		if ( defined( 'DOING_AJAX' ) && DOING_AJAX ) {
			$this->markTestSkipped( 'Cannot test when DOING_AJAX' );
		}

		$manager = $this->instantiate();
		$this->assertFalse( $manager->doing_ajax() );
	}

	/**
	 * Test WP_Customize_Manager::unsanitized_post_values().
	 *
	 * @ticket 30988
	 */
	function test_unsanitized_post_values() {
		$manager = $this->instantiate();

		$customized = array(
			'foo' => 'bar',
			'baz[quux]' => 123,
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $customized ) );
		$post_values = $manager->unsanitized_post_values();
		$this->assertEquals( $customized, $post_values );
	}

	/**
	 * Test the WP_Customize_Manager::post_value() method.
	 *
	 * @ticket 30988
	 */
	function test_post_value() {
		$posted_settings = array(
			'foo' => 'OOF',
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $posted_settings ) );

		$manager = $this->instantiate();

		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );
		$foo_setting = $manager->get_setting( 'foo' );
		$this->assertEquals( 'foo_default', $manager->get_setting( 'foo' )->value(), 'Expected non-previewed setting to return default when value() method called.' );
		$this->assertEquals( $posted_settings['foo'], $manager->post_value( $foo_setting, 'post_value_foo_default' ), 'Expected post_value($foo_setting) to return value supplied in $_POST[customized][foo]' );

		$manager->add_setting( 'bar', array( 'default' => 'bar_default' ) );
		$bar_setting = $manager->get_setting( 'bar' );
		$this->assertEquals( 'post_value_bar_default', $manager->post_value( $bar_setting, 'post_value_bar_default' ), 'Expected post_value($bar_setting, $default) to return $default since no value supplied in $_POST[customized][bar]' );
	}

	/**
	 * Test the WP_Customize_Manager::add_dynamic_settings() method.
	 *
	 * @ticket 30936
	 */
	function test_add_dynamic_settings() {
		$manager = $this->instantiate();
		$setting_ids = array( 'foo', 'bar' );
		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );
		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected there to not be a bar setting up front.' );
		$manager->add_dynamic_settings( $setting_ids );
		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected the bar setting to remain absent since filters not added.' );

		$this->action_customize_register_for_dynamic_settings();
		$manager->add_dynamic_settings( $setting_ids );
		$this->assertNotEmpty( $manager->get_setting( 'bar' ), 'Expected bar setting to be created since filters were added.' );
		$this->assertEquals( 'foo_default', $manager->get_setting( 'foo' )->default, 'Expected static foo setting to not get overridden by dynamic setting.' );
		$this->assertEquals( 'dynamic_bar_default', $manager->get_setting( 'bar' )->default, 'Expected dynamic setting bar to have default providd by filter.' );
	}

	/**
	 * Test the WP_Customize_Manager::register_dynamic_settings() method.
	 *
	 * This is similar to test_add_dynamic_settings, except the settings are passed via $_POST['customized'].
	 *
	 * @ticket 30936
	 */
	function test_register_dynamic_settings() {
		$posted_settings = array(
			'foo' => 'OOF',
			'bar' => 'RAB',
		);
		$_POST['customized'] = wp_slash( wp_json_encode( $posted_settings ) );

		add_action( 'customize_register', array( $this, 'action_customize_register_for_dynamic_settings' ) );

		$manager = $this->instantiate();
		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );

		$this->assertEmpty( $manager->get_setting( 'bar' ), 'Expected dynamic setting "bar" to not be registered.' );
		do_action( 'customize_register', $manager );
		$this->assertNotEmpty( $manager->get_setting( 'bar' ), 'Expected dynamic setting "bar" to be automatically registered after customize_register action.' );
		$this->assertEmpty( $manager->get_setting( 'baz' ), 'Expected unrecognized dynamic setting "baz" to remain unregistered.' );
	}

	/**
	 * In lieu of closures, callback for customize_register action added in test_register_dynamic_settings().
	 */
	function action_customize_register_for_dynamic_settings() {
		add_filter( 'customize_dynamic_setting_args', array( $this, 'filter_customize_dynamic_setting_args_for_test_dynamic_settings' ), 10, 2 );
		add_filter( 'customize_dynamic_setting_class', array( $this, 'filter_customize_dynamic_setting_class_for_test_dynamic_settings' ), 10, 3 );
	}

	/**
	 * In lieu of closures, callback for customize_dynamic_setting_args filter added for test_register_dynamic_settings().
	 */
	function filter_customize_dynamic_setting_args_for_test_dynamic_settings( $setting_args, $setting_id ) {
		$this->assertEquals( false, $setting_args, 'Expected $setting_args to be false by default.' );
		$this->assertInternalType( 'string', $setting_id );
		if ( in_array( $setting_id, array( 'foo', 'bar' ) ) ) {
			$setting_args = array( 'default' => "dynamic_{$setting_id}_default" );
		}
		return $setting_args;
	}

	/**
	 * In lieu of closures, callback for customize_dynamic_setting_class filter added for test_register_dynamic_settings().
	 */
	function filter_customize_dynamic_setting_class_for_test_dynamic_settings( $setting_class, $setting_id, $setting_args ) {
		$this->assertEquals( 'WP_Customize_Setting', $setting_class );
		$this->assertInternalType( 'string', $setting_id );
		$this->assertInternalType( 'array', $setting_args );
		return $setting_class;
	}
}
