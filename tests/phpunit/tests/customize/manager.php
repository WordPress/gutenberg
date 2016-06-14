<?php
/**
 * WP_Customize_Manager tests.
 *
 * @package WordPress
 */

/**
 * Tests for the WP_Customize_Manager class.
 *
 * @group customize
 */
class Tests_WP_Customize_Manager extends WP_UnitTestCase {

	/**
	 * Customize manager instance re-instantiated with each test.
	 *
	 * @var WP_Customize_Manager
	 */
	public $manager;

	/**
	 * Symbol.
	 *
	 * @var stdClass
	 */
	public $undefined;

	/**
	 * Set up test.
	 */
	function setUp() {
		parent::setUp();
		require_once( ABSPATH . WPINC . '/class-wp-customize-manager.php' );
		$this->manager = $this->instantiate();
		$this->undefined = new stdClass();
	}

	/**
	 * Tear down test.
	 */
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

		$manager = $this->manager;
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

		$manager = $this->manager;
		$this->assertFalse( $manager->doing_ajax() );
	}

	/**
	 * Test WP_Customize_Manager::unsanitized_post_values().
	 *
	 * @ticket 30988
	 */
	function test_unsanitized_post_values() {
		$manager = $this->manager;

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

		$manager = $this->manager;

		$manager->add_setting( 'foo', array( 'default' => 'foo_default' ) );
		$foo_setting = $manager->get_setting( 'foo' );
		$this->assertEquals( 'foo_default', $manager->get_setting( 'foo' )->value(), 'Expected non-previewed setting to return default when value() method called.' );
		$this->assertEquals( $posted_settings['foo'], $manager->post_value( $foo_setting, 'post_value_foo_default' ), 'Expected post_value($foo_setting) to return value supplied in $_POST[customized][foo]' );

		$manager->add_setting( 'bar', array( 'default' => 'bar_default' ) );
		$bar_setting = $manager->get_setting( 'bar' );
		$this->assertEquals( 'post_value_bar_default', $manager->post_value( $bar_setting, 'post_value_bar_default' ), 'Expected post_value($bar_setting, $default) to return $default since no value supplied in $_POST[customized][bar]' );
	}

	/**
	 * Test the WP_Customize_Manager::post_value() method for a setting value that fails validation.
	 *
	 * @ticket 34893
	 */
	function test_invalid_post_value() {
		$default_value = 'foo_default';
		$setting = $this->manager->add_setting( 'foo', array(
			'validate_callback' => array( $this, 'filter_customize_validate_foo' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_foo' ),
		) );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$post_value = 'bar';
		$this->manager->set_post_value( 'foo', $post_value );
		$this->assertEquals( strtoupper( $post_value ), $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( strtoupper( $post_value ), $setting->post_value( $default_value ) );

		$this->manager->set_post_value( 'foo', 'return_wp_error_in_sanitize' );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$this->manager->set_post_value( 'foo', 'return_null_in_sanitize' );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );

		$post_value = '<script>evil</script>';
		$this->manager->set_post_value( 'foo', $post_value );
		$this->assertEquals( $default_value, $this->manager->post_value( $setting, $default_value ) );
		$this->assertEquals( $default_value, $setting->post_value( $default_value ) );
	}

	/**
	 * Filter customize_validate callback.
	 *
	 * @param mixed $value Value.
	 * @return string|WP_Error
	 */
	function filter_customize_sanitize_foo( $value ) {
		if ( 'return_null_in_sanitize' === $value ) {
			$value = null;
		} elseif ( is_string( $value ) ) {
			$value = strtoupper( $value );
			if ( false !== stripos( $value, 'return_wp_error_in_sanitize' ) ) {
				$value = new WP_Error( 'invalid_value_in_sanitize', __( 'Invalid value.' ), array( 'source' => 'filter_customize_sanitize_foo' ) );
			}
		}
		return $value;
	}

	/**
	 * Filter customize_validate callback.
	 *
	 * @param WP_Error $validity Validity.
	 * @param mixed    $value    Value.
	 * @return WP_Error
	 */
	function filter_customize_validate_foo( $validity, $value ) {
		if ( false !== stripos( $value, '<script' ) ) {
			$validity->add( 'invalid_value_in_validate', __( 'Invalid value.' ), array( 'source' => 'filter_customize_validate_foo' ) );
		}
		return $validity;
	}

	/**
	 * Test WP_Customize_Manager::validate_setting_values().
	 *
	 * @see WP_Customize_Manager::validate_setting_values()
	 */
	function test_validate_setting_values() {
		$setting = $this->manager->add_setting( 'foo', array(
			'validate_callback' => array( $this, 'filter_customize_validate_foo' ),
			'sanitize_callback' => array( $this, 'filter_customize_sanitize_foo' ),
		) );

		$post_value = 'bar';
		$this->manager->set_post_value( 'foo', $post_value );
		$validities = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $validities );
		$this->assertEquals( array( 'foo' => true ), $validities );

		$this->manager->set_post_value( 'foo', 'return_wp_error_in_sanitize' );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$error = $invalid_settings[ $setting->id ];
		$this->assertEquals( 'invalid_value_in_sanitize', $error->get_error_code() );
		$this->assertEquals( array( 'source' => 'filter_customize_sanitize_foo' ), $error->get_error_data() );

		$this->manager->set_post_value( 'foo', 'return_null_in_sanitize' );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$this->assertNull( $invalid_settings[ $setting->id ]->get_error_data() );

		$post_value = '<script>evil</script>';
		$this->manager->set_post_value( 'foo', $post_value );
		$invalid_settings = $this->manager->validate_setting_values( $this->manager->unsanitized_post_values() );
		$this->assertCount( 1, $invalid_settings );
		$this->assertArrayHasKey( $setting->id, $invalid_settings );
		$this->assertInstanceOf( 'WP_Error', $invalid_settings[ $setting->id ] );
		$error = $invalid_settings[ $setting->id ];
		$this->assertEquals( 'invalid_value_in_validate', $error->get_error_code() );
		$this->assertEquals( array( 'source' => 'filter_customize_validate_foo' ), $error->get_error_data() );
	}

	/**
	 * Test WP_Customize_Manager::prepare_setting_validity_for_js().
	 *
	 * @see WP_Customize_Manager::prepare_setting_validity_for_js()
	 */
	function test_prepare_setting_validity_for_js() {
		$this->assertTrue( $this->manager->prepare_setting_validity_for_js( true ) );
		$error = new WP_Error();
		$error->add( 'bad_letter', 'Bad letter' );
		$error->add( 'bad_letter', 'Bad letra' );
		$error->add( 'bad_number', 'Bad number', array( 'number' => 123 ) );
		$validity = $this->manager->prepare_setting_validity_for_js( $error );
		$this->assertInternalType( 'array', $validity );
		foreach ( $error->errors as $code => $messages ) {
			$this->assertArrayHasKey( $code, $validity );
			$this->assertInternalType( 'array', $validity[ $code ] );
			$this->assertEquals( join( ' ', $messages ), $validity[ $code ]['message'] );
			$this->assertArrayHasKey( 'data', $validity[ $code ] );
			$this->assertArrayHasKey( 'from_server', $validity[ $code ]['data'] );
		}
		$this->assertArrayHasKey( 'number', $validity['bad_number']['data'] );
		$this->assertEquals( 123, $validity['bad_number']['data']['number'] );
	}

	/**
	 * Test WP_Customize_Manager::set_post_value().
	 *
	 * @see WP_Customize_Manager::set_post_value()
	 */
	function test_set_post_value() {
		$this->manager->add_setting( 'foo', array(
			'sanitize_callback' => array( $this, 'sanitize_foo_for_test_set_post_value' ),
		) );
		$setting = $this->manager->get_setting( 'foo' );

		$this->assertEmpty( $this->captured_customize_post_value_set_actions );
		add_action( 'customize_post_value_set', array( $this, 'capture_customize_post_value_set_actions' ), 10, 3 );
		add_action( 'customize_post_value_set_foo', array( $this, 'capture_customize_post_value_set_actions' ), 10, 2 );
		$this->manager->set_post_value( $setting->id, '123abc' );
		$this->assertCount( 2, $this->captured_customize_post_value_set_actions );
		$this->assertEquals( 'customize_post_value_set_foo', $this->captured_customize_post_value_set_actions[0]['action'] );
		$this->assertEquals( 'customize_post_value_set', $this->captured_customize_post_value_set_actions[1]['action'] );
		$this->assertEquals( array( '123abc', $this->manager ), $this->captured_customize_post_value_set_actions[0]['args'] );
		$this->assertEquals( array( $setting->id, '123abc', $this->manager ), $this->captured_customize_post_value_set_actions[1]['args'] );

		$unsanitized = $this->manager->unsanitized_post_values();
		$this->assertArrayHasKey( $setting->id, $unsanitized );

		$this->assertEquals( '123abc', $unsanitized[ $setting->id ] );
		$this->assertEquals( 123, $setting->post_value() );
	}

	/**
	 * Sanitize a value for Tests_WP_Customize_Manager::test_set_post_value().
	 *
	 * @see Tests_WP_Customize_Manager::test_set_post_value()
	 *
	 * @param mixed $value Value.
	 * @return int Value.
	 */
	function sanitize_foo_for_test_set_post_value( $value ) {
		return intval( $value );
	}

	/**
	 * Store data coming from customize_post_value_set action calls.
	 *
	 * @see Tests_WP_Customize_Manager::capture_customize_post_value_set_actions()
	 * @var array
	 */
	protected $captured_customize_post_value_set_actions = array();

	/**
	 * Capture the actions fired when calling WP_Customize_Manager::set_post_value().
	 *
	 * @see Tests_WP_Customize_Manager::test_set_post_value()
	 */
	function capture_customize_post_value_set_actions() {
		$action = current_action();
		$args = func_get_args();
		$this->captured_customize_post_value_set_actions[] = compact( 'action', 'args' );
	}

	/**
	 * Test the WP_Customize_Manager::add_dynamic_settings() method.
	 *
	 * @ticket 30936
	 */
	function test_add_dynamic_settings() {
		$manager = $this->manager;
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

		$manager = $this->manager;
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
	 *
	 * @param array  $setting_args Setting args.
	 * @param string $setting_id   Setting ID.
	 * @return array
	 */
	function filter_customize_dynamic_setting_args_for_test_dynamic_settings( $setting_args, $setting_id ) {
		$this->assertInternalType( 'string', $setting_id );
		if ( in_array( $setting_id, array( 'foo', 'bar' ) ) ) {
			$setting_args = array( 'default' => "dynamic_{$setting_id}_default" );
		}
		return $setting_args;
	}

	/**
	 * In lieu of closures, callback for customize_dynamic_setting_class filter added for test_register_dynamic_settings().
	 *
	 * @param string $setting_class Setting class.
	 * @param string $setting_id    Setting ID.
	 * @param array  $setting_args  Setting args.
	 * @return string
	 */
	function filter_customize_dynamic_setting_class_for_test_dynamic_settings( $setting_class, $setting_id, $setting_args ) {
		$this->assertEquals( 'WP_Customize_Setting', $setting_class );
		$this->assertInternalType( 'string', $setting_id );
		$this->assertInternalType( 'array', $setting_args );
		return $setting_class;
	}

	/**
	 * Test is_ios() method.
	 *
	 * @see WP_Customize_Manager::is_ios()
	 */
	function test_is_ios() {
		$this->markTestSkipped( 'WP_Customize_Manager::is_ios() cannot be tested because it uses wp_is_mobile() which contains a static var.' );
	}

	/**
	 * Test get_document_title_template() method.
	 *
	 * @see WP_Customize_Manager::get_document_title_template()
	 */
	function test_get_document_title_template() {
		$tpl = $this->manager->get_document_title_template();
		$this->assertContains( '%s', $tpl );
	}

	/**
	 * Test get_preview_url()/set_preview_url methods.
	 *
	 * @see WP_Customize_Manager::get_preview_url()
	 * @see WP_Customize_Manager::set_preview_url()
	 */
	function test_preview_url() {
		$this->assertEquals( home_url( '/' ), $this->manager->get_preview_url() );
		$preview_url = home_url( '/foo/bar/baz/' );
		$this->manager->set_preview_url( $preview_url );
		$this->assertEquals( $preview_url, $this->manager->get_preview_url() );
		$this->manager->set_preview_url( 'http://illegalsite.example.com/food/' );
		$this->assertEquals( home_url( '/' ), $this->manager->get_preview_url() );
	}

	/**
	 * Test get_return_url()/set_return_url() methods.
	 *
	 * @see WP_Customize_Manager::get_return_url()
	 * @see WP_Customize_Manager::set_return_url()
	 */
	function test_return_url() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$this->assertEquals( home_url( '/' ), $this->manager->get_return_url() );

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->assertTrue( current_user_can( 'edit_theme_options' ) );
		$this->assertEquals( home_url( '/' ), $this->manager->get_return_url() );

		$preview_url = home_url( '/foo/' );
		$this->manager->set_preview_url( $preview_url );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$_SERVER['HTTP_REFERER'] = wp_slash( admin_url( 'customize.php' ) );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		// See #35355.
		$_SERVER['HTTP_REFERER'] = wp_slash( admin_url( 'wp-login.php' ) );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$url = home_url( '/referred/' );
		$_SERVER['HTTP_REFERER'] = wp_slash( $url );
		$this->assertEquals( $url, $this->manager->get_return_url() );

		$url = 'http://badreferer.example.com/';
		$_SERVER['HTTP_REFERER'] = wp_slash( $url );
		$this->assertNotEquals( $url, $this->manager->get_return_url() );
		$this->assertEquals( $preview_url, $this->manager->get_return_url() );

		$this->manager->set_return_url( admin_url( 'edit.php?trashed=1' ) );
		$this->assertEquals( admin_url( 'edit.php' ), $this->manager->get_return_url() );
	}

	/**
	 * Test get_autofocus()/set_autofocus() methods.
	 *
	 * @see WP_Customize_Manager::get_autofocus()
	 * @see WP_Customize_Manager::set_autofocus()
	 */
	function test_autofocus() {
		$this->assertEmpty( $this->manager->get_autofocus() );

		$this->manager->set_autofocus( array( 'unrecognized' => 'food' ) );
		$this->assertEmpty( $this->manager->get_autofocus() );

		$autofocus = array( 'control' => 'blogname' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'section' => 'colors' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'panel' => 'widgets' );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEquals( $autofocus, $this->manager->get_autofocus() );

		$autofocus = array( 'control' => array( 'blogname', 'blogdescription' ) );
		$this->manager->set_autofocus( $autofocus );
		$this->assertEmpty( $this->manager->get_autofocus() );
	}

	/**
	 * Test get_nonces() method.
	 *
	 * @see WP_Customize_Manager::get_nonces()
	 */
	function test_nonces() {
		$nonces = $this->manager->get_nonces();
		$this->assertInternalType( 'array', $nonces );
		$this->assertArrayHasKey( 'save', $nonces );
		$this->assertArrayHasKey( 'preview', $nonces );

		add_filter( 'customize_refresh_nonces', array( $this, 'filter_customize_refresh_nonces' ), 10, 2 );
		$nonces = $this->manager->get_nonces();
		$this->assertArrayHasKey( 'foo', $nonces );
		$this->assertEquals( wp_create_nonce( 'foo' ), $nonces['foo'] );
	}

	/**
	 * Filter for customize_refresh_nonces.
	 *
	 * @param array                $nonces  Nonces.
	 * @param WP_Customize_Manager $manager Manager.
	 * @return array Nonces.
	 */
	function filter_customize_refresh_nonces( $nonces, $manager ) {
		$this->assertInstanceOf( 'WP_Customize_Manager', $manager );
		$nonces['foo'] = wp_create_nonce( 'foo' );
		return $nonces;
	}

	/**
	 * Test customize_pane_settings() method.
	 *
	 * @see WP_Customize_Manager::customize_pane_settings()
	 */
	function test_customize_pane_settings() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->manager->register_controls();
		$this->manager->prepare_controls();
		$autofocus = array( 'control' => 'blogname' );
		$this->manager->set_autofocus( $autofocus );

		ob_start();
		$this->manager->customize_pane_settings();
		$content = ob_get_clean();

		$this->assertContains( 'var _wpCustomizeSettings =', $content );
		$this->assertContains( '"blogname"', $content );
		$this->assertContains( '"type":"option"', $content );
		$this->assertContains( '_wpCustomizeSettings.controls', $content );
		$this->assertContains( '_wpCustomizeSettings.settings', $content );
		$this->assertContains( '</script>', $content );

		$this->assertNotEmpty( preg_match( '#var _wpCustomizeSettings\s*=\s*({.*?});\s*\n#', $content, $matches ) );
		$json = $matches[1];
		$data = json_decode( $json, true );
		$this->assertNotEmpty( $data );

		$this->assertEqualSets( array( 'theme', 'url', 'browser', 'panels', 'sections', 'nonce', 'autofocus', 'documentTitleTmpl', 'previewableDevices' ), array_keys( $data ) );
		$this->assertEquals( $autofocus, $data['autofocus'] );
		$this->assertArrayHasKey( 'save', $data['nonce'] );
		$this->assertArrayHasKey( 'preview', $data['nonce'] );
	}

	/**
	 * Test customize_preview_settings() method.
	 *
	 * @see WP_Customize_Manager::customize_preview_settings()
	 */
	function test_customize_preview_settings() {
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$this->manager->register_controls();
		$this->manager->prepare_controls();
		$this->manager->set_post_value( 'foo', 'bar' );
		$_POST['customize_messenger_channel'] = 'preview-0';

		ob_start();
		$this->manager->customize_preview_settings();
		$content = ob_get_clean();

		$this->assertEquals( 1, preg_match( '/var _wpCustomizeSettings = ({.+});/', $content, $matches ) );
		$settings = json_decode( $matches[1], true );

		$this->assertArrayHasKey( 'theme', $settings );
		$this->assertArrayHasKey( 'url', $settings );
		$this->assertArrayHasKey( 'channel', $settings );
		$this->assertArrayHasKey( 'activePanels', $settings );
		$this->assertArrayHasKey( 'activeSections', $settings );
		$this->assertArrayHasKey( 'activeControls', $settings );
		$this->assertArrayHasKey( 'settingValidities', $settings );
		$this->assertArrayHasKey( 'nonce', $settings );
		$this->assertArrayHasKey( '_dirty', $settings );

		$this->assertArrayHasKey( 'preview', $settings['nonce'] );
		$this->assertEquals( array( 'foo' ), $settings['_dirty'] );
	}

	/**
	 * @ticket 33552
	 */
	function test_customize_loaded_components_filter() {
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Widgets', $manager->widgets );
		$this->assertInstanceOf( 'WP_Customize_Nav_Menus', $manager->nav_menus );

		add_filter( 'customize_loaded_components', array( $this, 'return_array_containing_widgets' ), 10, 2 );
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Widgets', $manager->widgets );
		$this->assertEmpty( $manager->nav_menus );
		remove_all_filters( 'customize_loaded_components' );

		add_filter( 'customize_loaded_components', array( $this, 'return_array_containing_nav_menus' ), 10, 2 );
		$manager = new WP_Customize_Manager();
		$this->assertInstanceOf( 'WP_Customize_Nav_Menus', $manager->nav_menus );
		$this->assertEmpty( $manager->widgets );
		remove_all_filters( 'customize_loaded_components' );

		add_filter( 'customize_loaded_components', '__return_empty_array' );
		$manager = new WP_Customize_Manager();
		$this->assertEmpty( $manager->widgets );
		$this->assertEmpty( $manager->nav_menus );
		remove_all_filters( 'customize_loaded_components' );
	}

	/**
	 * @see Tests_WP_Customize_Manager::test_customize_loaded_components_filter()
	 *
	 * @param array                $components         Components.
	 * @param WP_Customize_Manager $customize_manager  Manager.
	 *
	 * @return array Components.
	 */
	function return_array_containing_widgets( $components, $customize_manager ) {
		$this->assertInternalType( 'array', $components );
		$this->assertContains( 'widgets', $components );
		$this->assertContains( 'nav_menus', $components );
		$this->assertInternalType( 'array', $components );
		$this->assertInstanceOf( 'WP_Customize_Manager', $customize_manager );
		return array( 'widgets' );
	}

	/**
	 * @see Tests_WP_Customize_Manager::test_customize_loaded_components_filter()
	 *
	 * @param array                $components         Components.
	 * @param WP_Customize_Manager $customize_manager  Manager.
	 *
	 * @return array Components.
	 */
	function return_array_containing_nav_menus( $components, $customize_manager ) {
		$this->assertInternalType( 'array', $components );
		$this->assertContains( 'widgets', $components );
		$this->assertContains( 'nav_menus', $components );
		$this->assertInternalType( 'array', $components );
		$this->assertInstanceOf( 'WP_Customize_Manager', $customize_manager );
		return array( 'nav_menus' );
	}

	/**
	 * @ticket 30225
	 * @ticket 34594
	 */
	function test_prepare_controls_stable_sorting() {
		$manager = new WP_Customize_Manager();
		$manager->register_controls();
		$section_id = 'foo-section';
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$manager->add_section( $section_id, array(
			'title'      => 'Section',
			'priority'   => 1,
		) );

		$added_control_ids = array();
		$count = 9;
		for ( $i = 0; $i < $count; $i += 1 ) {
			$id = 'sort-test-' . $i;
			$added_control_ids[] = $id;
			$manager->add_setting( $id );
			$control = new WP_Customize_Control( $manager, $id, array(
				'section' => $section_id,
				'priority' => 1,
				'setting' => $id,
			) );
			$manager->add_control( $control );
		}

		$manager->prepare_controls();

		$sorted_control_ids = wp_list_pluck( $manager->get_section( $section_id )->controls, 'id' );
		$this->assertEquals( $added_control_ids, $sorted_control_ids );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_section_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$section_id = 'foo-section';
		$result_section = $manager->add_section( $section_id, array(
			'title'    => 'Section',
			'priority' => 1,
		) );

		$this->assertInstanceOf( 'WP_Customize_Section', $result_section );
		$this->assertEquals( $section_id, $result_section->id );

		$section = new WP_Customize_Section( $manager, $section_id, array(
			'title'    => 'Section 2',
			'priority' => 2,
		) );
		$result_section = $manager->add_section( $section );

		$this->assertInstanceOf( 'WP_Customize_Section', $result_section );
		$this->assertEquals( $section_id, $result_section->id );
		$this->assertEquals( $section, $result_section );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_setting_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$setting_id = 'foo-setting';
		$result_setting = $manager->add_setting( $setting_id );

		$this->assertInstanceOf( 'WP_Customize_Setting', $result_setting );
		$this->assertEquals( $setting_id, $result_setting->id );

		$setting = new WP_Customize_Setting( $manager, $setting_id );
		$result_setting = $manager->add_setting( $setting );

		$this->assertInstanceOf( 'WP_Customize_Setting', $result_setting );
		$this->assertEquals( $setting, $result_setting );
		$this->assertEquals( $setting_id, $result_setting->id );
	}

	/**
	 * @ticket 34597
	 */
	function test_add_setting_honoring_dynamic() {
		$manager = new WP_Customize_Manager();

		$setting_id = 'dynamic';
		$setting = $manager->add_setting( $setting_id );
		$this->assertEquals( 'WP_Customize_Setting', get_class( $setting ) );
		$this->assertObjectNotHasAttribute( 'custom', $setting );
		$manager->remove_setting( $setting_id );

		add_filter( 'customize_dynamic_setting_class', array( $this, 'return_dynamic_customize_setting_class' ), 10, 3 );
		add_filter( 'customize_dynamic_setting_args', array( $this, 'return_dynamic_customize_setting_args' ), 10, 2 );
		$setting = $manager->add_setting( $setting_id );
		$this->assertEquals( 'Test_Dynamic_Customize_Setting', get_class( $setting ) );
		$this->assertObjectHasAttribute( 'custom', $setting );
		$this->assertEquals( 'foo', $setting->custom );
	}

	/**
	 * Return 'Test_Dynamic_Customize_Setting' in 'customize_dynamic_setting_class.
	 *
	 * @param string $class Setting class.
	 * @param array  $args  Setting args.
	 * @param string $id    Setting ID.
	 * @return string       Setting class.
	 */
	function return_dynamic_customize_setting_class( $class, $id, $args ) {
		unset( $args );
		if ( 0 === strpos( $id, 'dynamic' ) ) {
			$class = 'Test_Dynamic_Customize_Setting';
		}
		return $class;
	}

	/**
	 * Return 'Test_Dynamic_Customize_Setting' in 'customize_dynamic_setting_class.
	 *
	 * @param array  $args Setting args.
	 * @param string $id   Setting ID.
	 * @return string      Setting args.
	 */
	function return_dynamic_customize_setting_args( $args, $id ) {
		if ( 0 === strpos( $id, 'dynamic' ) ) {
			$args['custom'] = 'foo';
		}
		return $args;
	}

	/**
	 * @ticket 34596
	 */
	function test_add_panel_return_instance() {
		$manager = new WP_Customize_Manager();
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$panel_id = 'foo-panel';
		$result_panel = $manager->add_panel( $panel_id, array(
			'title'    => 'Test Panel',
			'priority' => 2,
		) );

		$this->assertInstanceOf( 'WP_Customize_Panel', $result_panel );
		$this->assertEquals( $panel_id, $result_panel->id );

		$panel = new WP_Customize_Panel( $manager, $panel_id, array(
			'title' => 'Test Panel 2',
		) );
		$result_panel = $manager->add_panel( $panel );

		$this->assertInstanceOf( 'WP_Customize_Panel', $result_panel );
		$this->assertEquals( $panel, $result_panel );
		$this->assertEquals( $panel_id, $result_panel->id );
	}

	/**
	 * @ticket 34596
	 */
	function test_add_control_return_instance() {
		$manager = new WP_Customize_Manager();
		$section_id = 'foo-section';
		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$manager->add_section( $section_id, array(
			'title'    => 'Section',
			'priority' => 1,
		) );

		$control_id = 'foo-control';
		$manager->add_setting( $control_id );

		$result_control = $manager->add_control( $control_id, array(
			'section'  => $section_id,
			'priority' => 1,
			'setting'  => $control_id,
		) );
		$this->assertInstanceOf( 'WP_Customize_Control', $result_control );
		$this->assertEquals( $control_id, $result_control->id );

		$control = new WP_Customize_Control( $manager, $control_id, array(
			'section'  => $section_id,
			'priority' => 1,
			'setting'  => $control_id,
		) );
		$result_control = $manager->add_control( $control );

		$this->assertInstanceOf( 'WP_Customize_Control', $result_control );
		$this->assertEquals( $control, $result_control );
		$this->assertEquals( $control_id, $result_control->id );
	}


	/**
	 * Testing the return values both with and without filter.
	 *
	 * @ticket 31195
	 */
	function test_get_previewable_devices() {

		// Setup the instance.
		$manager = new WP_Customize_Manager();

		// The default devices list.
		$default_devices = array(
			'desktop' => array(
				'label'   => __( 'Enter desktop preview mode' ),
				'default' => true,
			),
			'tablet'  => array(
				'label' => __( 'Enter tablet preview mode' ),
			),
			'mobile'  => array(
				'label' => __( 'Enter mobile preview mode' ),
			),
		);

		// Control test.
		$devices = $manager->get_previewable_devices();
		$this->assertSame( $default_devices, $devices );

		// Adding the filter.
		add_filter( 'customize_previewable_devices', array( $this, 'filter_customize_previewable_devices' ) );
		$devices = $manager->get_previewable_devices();
		$this->assertSame( $this->filtered_device_list(), $devices );

		// Clean up.
		remove_filter( 'customize_previewable_devices', array( $this, 'filter_customize_previewable_devices' ) );
	}

	/**
	 * Helper method for test_get_previewable_devices.
	 *
	 * @return array
	 */
	function filtered_device_list() {
		return array(
			'custom-device' => array(
				'label' => __( 'Enter custom-device preview mode' ),
				'default' => true,
			),
		);
	}

	/**
	 * Callback for the customize_previewable_devices filter.
	 *
	 * @param array $devices The list of devices.
	 *
	 * @return array
	 */
	function filter_customize_previewable_devices( $devices ) {
		return $this->filtered_device_list();
	}
}

require_once ABSPATH . WPINC . '/class-wp-customize-setting.php';

/**
 * Class Test_Dynamic_Customize_Setting
 *
 * @see Tests_WP_Customize_Manager::test_add_setting_honoring_dynamic()
 */
class Test_Dynamic_Customize_Setting extends WP_Customize_Setting {
	public $type = 'dynamic';
	public $custom;
}
