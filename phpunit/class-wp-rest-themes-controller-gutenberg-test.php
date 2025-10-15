<?php

class WPRESTThemesControllerGutenbergTest extends WP_Test_REST_Controller_Testcase {
	/**
	 * Admin user ID.
	 *
	 * @since 6.9.0
	 *
	 * @var int $admin_id
	 */
	protected static $admin_id;

	/**
	 * Contributor user ID.
	 *
	 * @since 6.9.0
	 *
	 * @var int $contributor_id
	 */
	protected static $contributor_id;

	/**
	 * The REST API route for themes.
	 *
	 * @since 6.9.0
	 *
	 * @var string $themes_route
	 */
	protected static $themes_route = '/wp/v2/themes';

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// Controller does not use get_context_param().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// Controller does not implement create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// Controller does not implement delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// Controller does not implement get_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// Controller does not implement get_item_schema().
	}

	/**
	 * @doesNotPerformAssertions
	*/
	public function test_get_items() {
		// Controller does not implement get_items().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// Controller does not implement prepare_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// Controller does not implement update_item().
	}

	/**
	 * Set up class test fixtures.
	 *
	 * @since 6.9.0
	 *
	 * @param WP_UnitTest_Factory $factory WordPress unit test factory.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$contributor_id = $factory->user->create(
			array(
				'role' => 'contributor',
			)
		);
	}

	/**
	 * Set up each test method.
	 *
	 * @since 6.9.0
	 */
	public function set_up() {
		parent::set_up();

		$themes_controller = new WP_REST_Themes_Controller_Gutenberg();
		$themes_controller->register_routes();

		wp_set_current_user( self::$admin_id );

		// In multisite, grant super admin privileges and network-enable the theme
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );

			// Network-enable the twentytwentyfive theme
			$allowed_themes = get_site_option( 'allowedthemes' );
			if ( ! is_array( $allowed_themes ) ) {
				$allowed_themes = array();
			}
			$allowed_themes['twentytwentyfive'] = true;
			update_site_option( 'allowedthemes', $allowed_themes );
		}
	}

	/**
	 * Test that the routes are registered correctly.
	 *
	 * @covers WP_REST_Themes_Controller_Gutenberg::register_routes
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::$themes_route, $routes );
		$this->assertArrayHasKey( self::$themes_route . '/activate', $routes );
	}

	/**
	 * Test that the activate_theme_permissions_check method returns an error for users without switch_themes capability.
	 *
	 * @covers WP_REST_Themes_Controller_Gutenberg::activate_theme_permissions_check
	 */
	public function test_activate_theme_permissions_check() {
		wp_set_current_user( self::$contributor_id );

		$request = new WP_REST_Request(
			'POST',
			self::$themes_route . '/activate'
		);
		$request->set_param( 'stylesheet', 'twentytwentyfive' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_cannot_activate_themes', $response->get_data()['code'] );
	}

	/**
	 * Test that the validate_theme method returns an error for non-existent themes.
	 *
	 * @covers WP_REST_Themes_Controller_Gutenberg::validate_theme
	 */
	public function test_activate_theme_validate_theme_returns_error_on_non_existent_theme() {
		$request = new WP_REST_Request(
			'POST',
			self::$themes_route . '/activate'
		);
		$request->set_param( 'stylesheet', 'non-existent-theme' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertSame( 'rest_theme_not_found', $response->get_data()['data']['details']['stylesheet']['code'] );
	}

	/**
	 * Test that the validate_theme method returns an error for themes that are not network enabled
	 * when on a multisite installation.
	 *
	 * @group ms-required
	 */
	public function test_activate_theme_validate_theme_returns_error_on_not_network_enabled_theme() {
		$request = new WP_REST_Request(
			'POST',
			self::$themes_route . '/activate'
		);
		$request->set_param( 'stylesheet', 'twentytwentyfour' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'rest_invalid_param', $response->get_data()['code'] );
		$this->assertSame( 'rest_theme_not_allowed', $response->get_data()['data']['details']['stylesheet']['code'] );
	}

	/**
	 * Test that the activate_theme method activates a valid theme.
	 *
	 * @covers WP_REST_Themes_Controller_Gutenberg::activate_theme
	 */
	public function test_activate_theme() {
		$request = new WP_REST_Request(
			'POST',
			self::$themes_route . '/activate'
		);
		$request->set_param( 'stylesheet', 'twentytwentyfive' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( 'Theme activated successfully.', $response->get_data()['message'] );
		$this->assertSame( 'twentytwentyfive', $response->get_data()['theme'] );
	}
}
