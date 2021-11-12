<?php

/**
 * @group  webfonts
 * @covers WP_Webfonts_Controller
 */
class WP_Webfonts_Controller_Test extends WP_UnitTestCase {
	private $controller;
	private $webfont_registry_mock;
	private $provider_registry_mock;

	public static function setUpBeforeClass() {
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-registry.php';
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-provider-registry.php';
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/class-wp-webfonts-controller.php';
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/providers/class-wp-webfonts-provider.php';
		require_once dirname( dirname( __DIR__ ) ) . '/lib/webfonts-api/providers/class-wp-webfonts-google-provider.php';
		require_once __DIR__ . '/mocks/class-my-custom-webfonts-provider-mock.php';
	}

	public function setUp() {
		parent::setUp();

		$this->webfont_registry_mock  = $this->getMockBuilder( 'WP_Webfonts_Registry' )
											->disableOriginalConstructor()
											->getMock();
		$this->provider_registry_mock = $this->getMockBuilder( 'WP_Webfonts_Provider_Registry' )
											->getMock();
		$this->controller             = new WP_Webfonts_Controller(
			$this->webfont_registry_mock,
			$this->provider_registry_mock
		);
	}

	/**
	 * @covers WP_Webfonts_Controller::init
	 *
	 * @dataProvider data_init
	 *
	 * @param string $hook       Expected hook name.
	 * @param bool   $did_action Whether the action fired or not.
	 */
	public function test_init( $hook, $did_action ) {
		$this->provider_registry_mock
			->expects( $this->once() )
			->method( 'init' );

		if ( $did_action ) {
			do_action( 'wp_enqueue_scripts' );
		}

		$this->controller->init();

		$this->assertSame(
			10,
			has_action( $hook, array( $this->controller, 'generate_and_enqueue_styles' ) )
		);
		$this->assertSame(
			10,
			has_action( 'admin_init', array( $this->controller, 'generate_and_enqueue_editor_styles' ) )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_init() {
		return array(
			'did_action fired'        => array(
				'hook'       => 'wp_print_footer_scripts',
				'did_action' => true,
			),
			'did_action did not fire' => array(
				'hook'       => 'wp_enqueue_scripts',
				'did_action' => false,
			),
		);
	}

	/**
	 * By default, the Webfonts API should not request webfonts from
	 * a remote provider. Test the permissions logic works as expected.
	 *
	 * @covers WP_Webfonts_Controller::generate_and_enqueue_styles
	 *
	 * @dataProvider data_generate_and_enqueue_editor_styles
	 *
	 * @param string $stylesheet_handle Handle for the registered stylesheet.
	 */
	public function test_generate_and_enqueue_styles_default( $stylesheet_handle ) {
		/*
		 * Set the stylesheet_handle property.
		 * This is set in WP_Webfonts_Controller::init(); however, init is not part
		 * of this test (as it has its own test).
		 */
		$property = new ReflectionProperty( $this->controller, 'stylesheet_handle' );
		$property->setAccessible( true );
		$property->setValue( $this->controller, $stylesheet_handle );

		// Set up the provider mock.
		$provider  = $this->getMockBuilder( 'WP_Webfonts_Google_Provider' )->getMock();
		$providers = array(
			'google' => $provider,
		);
		$this->provider_registry_mock
			->expects( $this->once() )
			->method( 'get_all_registered' )
			->willReturn( $providers );
		// The Google Fonts provider should never be called.
		$provider
			->expects( $this->never() )
			->method( 'set_webfonts' );

		// Fire the method being tested.
		$this->controller->generate_and_enqueue_styles();
		$this->expectOutputString( '' );
		wp_print_styles( $stylesheet_handle );
	}

	/**
	 * @covers WP_Webfonts_Controller::generate_and_enqueue_styles
	 * @covers WP_Webfonts_Controller::generate_and_enqueue_editor_styles
	 *
	 * @dataProvider data_generate_and_enqueue_editor_styles
	 *
	 * @param string $stylesheet_handle Handle for the registered stylesheet.
	 */
	public function test_generate_and_enqueue_styles_with_permission( $stylesheet_handle ) {
		add_filter( 'has_remote_webfonts_request_permission', '__return_true' );

		/*
		 * Set the stylesheet_handle property.
		 * This is set in WP_Webfonts_Controller::init(); however, init is not part
		 * of this test (as it has its own test).
		 */
		$property = new ReflectionProperty( $this->controller, 'stylesheet_handle' );
		$property->setAccessible( true );
		$property->setValue( $this->controller, $stylesheet_handle );

		// Set up the provider mock.
		$provider  = new My_Custom_Webfonts_Provider_Mock();
		$providers = array(
			'my-custom-provider' => $provider,
		);
		$this->provider_registry_mock
			->expects( $this->once() )
			->method( 'get_all_registered' )
			->willReturn( $providers );

		// Set up the webfonts registry mock.
		$webfonts = array(
			'source-serif-pro.normal.200 900' => array(
				'provider'    => 'my-custom-provider',
				'font-family' => 'Source Serif Pro',
				'font-style'  => 'normal',
				'font-weight' => '200 900',
			),
			'source-serif-pro.italic.200 900' => array(
				'provider'    => 'my-custom-provider',
				'font-family' => 'Source Serif Pro',
				'font-style'  => 'italic',
				'font-weight' => '200 900',
			),
		);
		$this->webfont_registry_mock
			->expects( $this->once() )
			->method( 'get_by_provider' )
			->with( $this->equalTo( 'my-custom-provider' ) )
			->willReturn( $webfonts );

		// Fire the method being tested.
		$this->controller->generate_and_enqueue_styles();

		/*
		 * As this method adds an inline style, the test needs to print it.
		 * Print the webfont styles and test the output matches expectation.
		 */
		$expected  = "<style id='{$stylesheet_handle}-inline-css'>\n";
		$expected .= $provider->get_css() . "\n";
		$expected .= "</style>\n";
		$this->expectOutputString( $expected );
		wp_print_styles( $stylesheet_handle );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_generate_and_enqueue_editor_styles() {
		return array(
			'for wp_enqueue_scripts'      => array( 'webfonts' ),
			'for wp_print_footer_scripts' => array( 'webfonts-footer' ),
		);
	}

	/**
	 * @covers WP_Webfonts_Controller::webfonts
	 */
	public function test_webfonts() {
		$this->assertSame( $this->webfont_registry_mock, $this->controller->webfonts() );
	}

	/**
	 * @covers WP_Webfonts_Controller::providers
	 */
	public function test_providers() {
		$this->assertSame( $this->provider_registry_mock, $this->controller->providers() );
	}
}
