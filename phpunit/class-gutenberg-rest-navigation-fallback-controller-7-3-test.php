<?php
/**
 * Unit tests covering Gutenberg_REST_Navigation_Fallback_Controller_7_3 functionality.
 *
 * @package gutenberg
 *
 * @coversDefaultClass Gutenberg_REST_Navigation_Fallback_Controller_7_3
 */

/**
 * @group navigation
 * @group restapi
 */
class Gutenberg_REST_Navigation_Fallback_Controller_7_3_Test extends WP_Test_REST_TestCase {
	const ROUTE = '/wp-block-editor/v1/navigation-fallback';

	const NAVIGATION_MANAGER_ROLE = 'gutenberg_navigation_fallback_manager';

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Editor user ID.
	 *
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * User ID for a custom role with only block Navigation Menu capabilities.
	 *
	 * @var int
	 */
	protected static $navigation_manager_id;

	/**
	 * Capabilities a test added to the administrator role, to remove in tear_down.
	 *
	 * @var string[]
	 */
	private $administrator_caps_to_remove = array();

	/**
	 * Creates shared users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		remove_role( self::NAVIGATION_MANAGER_ROLE );
		add_role(
			self::NAVIGATION_MANAGER_ROLE,
			'Navigation Menu Manager',
			array_merge(
				array( 'read' => true ),
				array_fill_keys( gutenberg_get_wp_navigation_menu_capability_names(), true )
			)
		);

		self::$admin_id              = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id             = $factory->user->create( array( 'role' => 'editor' ) );
		self::$navigation_manager_id = $factory->user->create( array( 'role' => self::NAVIGATION_MANAGER_ROLE ) );
	}

	/**
	 * Deletes shared users and the custom role.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$navigation_manager_id );
		remove_role( self::NAVIGATION_MANAGER_ROLE );
	}

	/**
	 * Restores the administrator role and the current user.
	 */
	public function tear_down() {
		$administrator = get_role( 'administrator' );
		foreach ( $this->administrator_caps_to_remove as $capability ) {
			$administrator->remove_cap( $capability );
		}
		$this->administrator_caps_to_remove = array();

		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Dispatches a request to the fallback route.
	 *
	 * @param string $context Request context.
	 * @return WP_REST_Response REST response.
	 */
	private function request_fallback( $context = 'view' ) {
		$request = new WP_REST_Request( 'GET', self::ROUTE );
		$request->set_param( 'context', $context );
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Returns the number of published block Navigation Menus.
	 *
	 * @return int Number of published menus.
	 */
	private function count_published_menus() {
		return (int) wp_count_posts( 'wp_navigation' )->publish;
	}

	/**
	 * The route is served by the 7.3 controller, not Core's.
	 */
	public function test_route_is_served_by_the_7_3_controller() {
		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( self::ROUTE, $routes );
		$this->assertInstanceOf(
			'Gutenberg_REST_Navigation_Fallback_Controller_7_3',
			$routes[ self::ROUTE ][0]['callback'][0],
			'The 7.3 controller should register the first handler, which serves the route.'
		);
		$this->assertInstanceOf(
			'Gutenberg_REST_Navigation_Fallback_Controller_7_3',
			$routes[ self::ROUTE ][0]['permission_callback'][0]
		);
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_navigation_manager_can_create_fallback_without_theme_or_post_caps() {
		wp_set_current_user( self::$navigation_manager_id );

		$this->assertFalse( current_user_can( 'edit_theme_options' ) );
		$this->assertFalse( current_user_can( 'edit_posts' ) );

		$response = $this->request_fallback();

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertSame( 'wp_navigation', get_post_type( $data['id'] ) );
		$this->assertSame( 'publish', get_post_status( $data['id'] ) );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_administrator_can_create_fallback() {
		wp_set_current_user( self::$admin_id );

		$response = $this->request_fallback( 'edit' );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_editor_cannot_create_fallback() {
		wp_set_current_user( self::$editor_id );
		$before = $this->count_published_menus();

		$response = $this->request_fallback();

		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
		$this->assertSame( $before, $this->count_published_menus() );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_logged_out_user_cannot_create_fallback() {
		$response = $this->request_fallback();

		$this->assertErrorResponse( 'rest_cannot_create', $response, 401 );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_publish_capability_is_required() {
		$this->administrator_caps_to_remove[] = 'publish_navigation_menus';
		get_role( 'administrator' )->add_cap( 'publish_navigation_menus', false );
		wp_set_current_user( self::$admin_id );
		$before = $this->count_published_menus();

		$this->assertTrue( current_user_can( 'create_navigation_menus' ) );

		$response = $this->request_fallback();

		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
		$this->assertSame( $before, $this->count_published_menus() );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_edit_context_requires_edit_capability() {
		$this->administrator_caps_to_remove[] = 'edit_navigation_menus';
		get_role( 'administrator' )->add_cap( 'edit_navigation_menus', false );
		wp_set_current_user( self::$admin_id );

		$this->assertErrorResponse( 'rest_forbidden_context', $this->request_fallback( 'edit' ), 403 );
		$this->assertSame( 200, $this->request_fallback()->get_status() );
	}

	/**
	 * @covers ::get_item_permissions_check
	 */
	public function test_administrator_with_stored_navigation_menu_denials_cannot_create_fallback() {
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->administrator_caps_to_remove[] = $capability;
			get_role( 'administrator' )->add_cap( $capability, false );
		}
		wp_set_current_user( self::$admin_id );
		$before = $this->count_published_menus();

		$this->assertTrue( current_user_can( 'edit_theme_options' ) );

		$response = $this->request_fallback();

		$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
		$this->assertSame( $before, $this->count_published_menus() );
	}
}
