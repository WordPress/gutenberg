<?php
/**
 * REST API: REST_Nav_Menus_Controller_Test class
 *
 * @package    WordPress
 * @subpackage REST_API
 */

/**
 * Tests for REST API for Menus.
 *
 * @see WP_Test_REST_Controller_Testcase
 */
class REST_Nav_Menus_Controller_Test extends WP_Test_REST_Controller_Testcase {
	/**
	 * @var int
	 */
	public $menu_id;

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * @var int
	 */
	protected static $editor_id;

	/**
	 * @var int
	 */
	protected static $subscriber_id;

	/**
	 *
	 */
	const TAXONOMY = 'nav_menu';

	/**
	 * @var int
	 */
	protected static $per_page = 50;

	/**
	 * Create fake data before our tests run.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id      = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
		self::$editor_id     = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);
		self::$subscriber_id = $factory->user->create(
			array(
				'role' => 'subscriber',
			)
		);
	}

	/**
	 *
	 */
	public function setUp() {
		parent::setUp();
		// Unregister all nav menu locations.
		foreach ( array_keys( get_registered_nav_menus() ) as $location ) {
			unregister_nav_menu( $location );
		}

		$orig_args = array(
			'name'        => 'Original Name',
			'description' => 'Original Description',
			'slug'        => 'original-slug',
			'taxonomy'    => 'nav_menu',
		);

		$this->menu_id = $this->factory->term->create( $orig_args );

		register_meta(
			'term',
			'test_single_menu',
			array(
				'object_subtype' => self::TAXONOMY,
				'show_in_rest'   => true,
				'single'         => true,
				'type'           => 'string',
			)
		);
	}

	/**
	 * Register nav menu locations.
	 *
	 * @param array $locations Location slugs.
	 */
	public function register_nav_menu_locations( $locations ) {
		foreach ( $locations as $location ) {
			register_nav_menu( $location, ucfirst( $location ) );
		}
	}

	/**
	 *
	 */
	public function test_register_routes() {
		$routes = rest_get_server()->get_routes();
		$this->assertArrayHasKey( '/__experimental/menus', $routes );
		$this->assertArrayHasKey( '/__experimental/menus/(?P<id>[\d]+)', $routes );
	}

	/**
	 *
	 */
	public function test_context_param() {
		// Collection.
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menus' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
		// Single.
		$tag1     = $this->factory->tag->create( array( 'name' => 'Season 5' ) );
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menus/' . $tag1 );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$this->assertEquals( 'view', $data['endpoints'][0]['args']['context']['default'] );
		$this->assertEqualSets( array( 'view', 'embed', 'edit' ), $data['endpoints'][0]['args']['context']['enum'] );
	}

	/**
	 *
	 */
	public function test_registered_query_params() {
		$request  = new WP_REST_Request( 'OPTIONS', '/__experimental/menus' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();
		$keys     = array_keys( $data['endpoints'][0]['args'] );
		sort( $keys );
		$this->assertEquals(
			array(
				'context',
				'exclude',
				'hide_empty',
				'include',
				'offset',
				'order',
				'orderby',
				'page',
				'per_page',
				'post',
				'search',
				'slug',
			),
			$keys
		);
	}

	/**
	 *
	 */
	public function test_get_items() {
		wp_set_current_user( self::$admin_id );
		wp_update_nav_menu_object(
			0,
			array(
				'description' => 'Test get',
				'menu-name'   => 'test Name get',
			)
		);
		$request = new WP_REST_Request( 'GET', '/__experimental/menus' );
		$request->set_param( 'per_page', self::$per_page );
		$response = rest_get_server()->dispatch( $request );
		$this->check_get_taxonomy_terms_response( $response );
	}

	/**
	 *
	 */
	public function test_get_item() {
		wp_set_current_user( self::$admin_id );
		$nav_menu_id = wp_update_nav_menu_object(
			0,
			array(
				'description' => 'Test menu',
				'menu-name'   => 'test Name',
			)
		);

		$this->register_nav_menu_locations( array( 'primary' ) );
		set_theme_mod( 'nav_menu_locations', array( 'primary' => $nav_menu_id ) );

		$request  = new WP_REST_Request( 'GET', '/__experimental/menus/' . $nav_menu_id );
		$response = rest_get_server()->dispatch( $request );
		$this->check_get_taxonomy_term_response( $response, $nav_menu_id );
	}

	/**
	 *
	 */
	public function test_create_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menus' );
		$request->set_param( 'name', 'My Awesome menus' );
		$request->set_param( 'description', 'This menu is so awesome.' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$headers = $response->get_headers();
		$data    = $response->get_data();
		$this->assertContains( '/__experimental/menus/' . $data['id'], $headers['Location'] );
		$this->assertEquals( 'My Awesome menus', $data['name'] );
		$this->assertEquals( 'This menu is so awesome.', $data['description'] );
		$this->assertEquals( 'my-awesome-menus', $data['slug'] );
	}

	/**
	 *
	 */
	public function test_update_item() {
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menus/' . $this->menu_id );
		$request->set_param( 'name', 'New Name' );
		$request->set_param( 'description', 'New Description' );
		$request->set_param( 'auto_add', true );
		$request->set_param(
			'meta',
			array(
				'test_single_menu' => 'just meta',
			)
		);
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertEquals( 'New Name', $data['name'] );
		$this->assertEquals( 'New Description', $data['description'] );
		$this->assertEquals( true, $data['auto_add'] );
		$this->assertEquals( 'new-name', $data['slug'] );
		$this->assertEquals( 'just meta', $data['meta']['test_single_menu'] );
		$this->assertFalse( isset( $data['meta']['test_cat_meta'] ) );
	}

	/**
	 *
	 */
	public function test_delete_item() {
		wp_set_current_user( self::$admin_id );

		$nav_menu_id = wp_update_nav_menu_object(
			0,
			array(
				'description' => 'Deleted Menu',
				'menu-name'   => 'Deleted Menu',
			)
		);

		$term = get_term_by( 'id', $nav_menu_id, self::TAXONOMY );

		$request = new WP_REST_Request( 'DELETE', '/__experimental/menus/' . $term->term_id );
		$request->set_param( 'force', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertTrue( $data['deleted'] );
		$this->assertEquals( 'Deleted Menu', $data['previous']['name'] );
	}

	/**
	 *
	 */
	public function test_prepare_item() {
		$nav_menu_id = wp_update_nav_menu_object(
			0,
			array(
				'description' => 'Foo Menu',
				'menu-name'   => 'Foo Menu',
			)
		);

		$term = get_term_by( 'id', $nav_menu_id, self::TAXONOMY );
		wp_set_current_user( self::$admin_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menus/' . $term->term_id );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->check_taxonomy_term( $term, $data, $response->get_links() );
	}

	/**
	 *
	 */
	public function test_get_item_schema() {
		$request    = new WP_REST_Request( 'OPTIONS', '/__experimental/menus' );
		$response   = rest_get_server()->dispatch( $request );
		$data       = $response->get_data();
		$properties = $data['schema']['properties'];
		$this->assertEquals( 7, count( $properties ) );
		$this->assertArrayHasKey( 'id', $properties );
		$this->assertArrayHasKey( 'description', $properties );
		$this->assertArrayHasKey( 'meta', $properties );
		$this->assertArrayHasKey( 'name', $properties );
		$this->assertArrayHasKey( 'slug', $properties );
		$this->assertArrayHasKey( 'locations', $properties );
	}

	/**
	 *
	 */
	public function test_create_item_with_location_permission_correct() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'slug', 'so-awesome' );
		$request->set_param( 'locations', 'primary' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 201, $response->get_status() );
		$data      = $response->get_data();
		$term_id   = $data['id'];
		$locations = get_nav_menu_locations();
		$this->assertEquals( $locations['primary'], $term_id );
	}

	/**
	 *
	 */
	public function test_create_item_with_location_permission_incorrect() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'slug', 'so-awesome' );
		$request->set_param( 'locations', 'primary' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( rest_authorization_required_code(), $response->get_status() );
		$this->assertErrorResponse( 'rest_cannot_assign_location', $response, rest_authorization_required_code() );
	}

	/**
	 *
	 */
	public function test_create_item_with_auto_add_permission_incorrect() {
		wp_set_current_user( self::$editor_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'slug', 'so-awesome' );
		$request->set_param( 'auto_add', true );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( rest_authorization_required_code(), $response->get_status() );
		$this->assertErrorResponse( 'rest_cannot_set_auto_add', $response, rest_authorization_required_code() );
	}

	/**
	 *
	 */
	public function test_create_item_with_location_permission_no_location() {
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus' );
		$request->set_param( 'name', 'My Awesome Term' );
		$request->set_param( 'slug', 'so-awesome' );
		$request->set_param( 'locations', 'bar' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
		$this->assertErrorResponse( 'rest_menu_location_invalid', $response, 400 );
	}

	/**
	 *
	 */
	public function test_update_item_with_no_location() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menus/' . $this->menu_id );
		$request->set_param( 'name', 'New Name' );
		$request->set_param( 'description', 'New Description' );
		$request->set_param( 'slug', 'new-slug' );
		$request->set_param( 'locations', 'bar' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 400, $response->get_status() );
	}

	/**
	 *
	 */
	public function test_update_item_with_location_permission_correct() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		wp_set_current_user( self::$admin_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus/' . $this->menu_id );
		$request->set_param( 'name', 'New Name' );
		$request->set_param( 'description', 'New Description' );
		$request->set_param( 'slug', 'new-slug' );
		$request->set_param( 'locations', 'primary' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( 200, $response->get_status() );
		$locations = get_nav_menu_locations();
		$this->assertEquals( $locations['primary'], $this->menu_id );
	}

	/**
	 *
	 */
	public function test_update_item_with_location_permission_incorrect() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		wp_set_current_user( self::$subscriber_id );
		$request = new WP_REST_Request( 'POST', '/__experimental/menus/' . $this->menu_id );
		$request->set_param( 'name', 'New Name' );
		$request->set_param( 'description', 'New Description' );
		$request->set_param( 'slug', 'new-slug' );
		$request->set_param( 'locations', 'primary' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertEquals( rest_authorization_required_code(), $response->get_status() );
	}

	/**
	 *
	 */
	public function test_get_item_links() {
		wp_set_current_user( self::$admin_id );

		$nav_menu_id = wp_update_nav_menu_object(
			0,
			array(
				'description' => 'Foo Menu',
				'menu-name'   => 'Foo Menu',
			)
		);

		register_nav_menu( 'foo', 'Bar' );

		set_theme_mod( 'nav_menu_locations', array( 'foo' => $nav_menu_id ) );

		$request  = new WP_REST_Request( 'GET', sprintf( '/__experimental/menus/%d', $nav_menu_id ) );
		$response = rest_get_server()->dispatch( $request );

		$links = $response->get_links();
		$this->assertArrayHasKey( 'https://api.w.org/menu-location', $links );

		$location_url = rest_url( '/__experimental/menu-locations/foo' );
		$this->assertEquals( $location_url, $links['https://api.w.org/menu-location'][0]['href'] );
	}

	/**
	 *
	 */
	public function test_change_menu_location() {
		$this->register_nav_menu_locations( array( 'primary', 'secondary' ) );
		$secondary_id = self::factory()->term->create(
			array(
				'name'        => 'Secondary Name',
				'description' => 'Secondary Description',
				'slug'        => 'secondary-slug',
				'taxonomy'    => 'nav_menu',
			)
		);

		$locations              = get_nav_menu_locations();
		$locations['primary']   = $this->menu_id;
		$locations['secondary'] = $secondary_id;
		set_theme_mod( 'nav_menu_locations', $locations );

		wp_set_current_user( self::$admin_id );

		$request = new WP_REST_Request( 'POST', '/__experimental/menus/' . $this->menu_id );
		$request->set_body_params(
			array(
				'locations' => array( 'secondary' ),
			)
		);
		$response = rest_get_server()->dispatch( $request );

		$this->assertEquals( 200, $response->get_status() );

		$locations = get_nav_menu_locations();
		$this->assertArrayNotHasKey( 'primary', $locations );
		$this->assertArrayHasKey( 'secondary', $locations );
		$this->assertEquals( $this->menu_id, $locations['secondary'] );
	}

	/**
	 *
	 */
	public function test_get_items_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menus' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_item_no_permission() {
		wp_set_current_user( 0 );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menus/' . $this->menu_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 *
	 */
	public function test_get_items_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menus' );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 *
	 */
	public function test_get_item_wrong_permission() {
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/__experimental/menus/' . $this->menu_id );
		$response = rest_get_server()->dispatch( $request );
		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 */
	protected function check_get_taxonomy_terms_response( $response ) {
		$this->assertEquals( 200, $response->get_status() );
		$data = $response->get_data();
		$args = array(
			'hide_empty' => false,
		);
		$tags = get_terms( self::TAXONOMY, $args );
		$this->assertEquals( count( $tags ), count( $data ) );
		$this->assertEquals( $tags[0]->term_id, $data[0]['id'] );
		$this->assertEquals( $tags[0]->name, $data[0]['name'] );
		$this->assertEquals( $tags[0]->slug, $data[0]['slug'] );
		$this->assertEquals( $tags[0]->description, $data[0]['description'] );
	}

	/**
	 * @param WP_REST_Response $response Response Class.
	 * @param int              $id Term ID.
	 */
	protected function check_get_taxonomy_term_response( $response, $id ) {
		$this->assertEquals( 200, $response->get_status() );

		$data = $response->get_data();
		$menu = get_term( $id, self::TAXONOMY );
		$this->check_taxonomy_term( $menu, $data, $response->get_links() );
	}

	/**
	 * @param WP_Term $term WP_Term object.
	 * @param array   $data Data from REST API.
	 * @param array   $links Array of links.
	 */
	protected function check_taxonomy_term( $term, $data, $links ) {
		$this->assertEquals( $term->term_id, $data['id'] );
		$this->assertEquals( $term->name, $data['name'] );
		$this->assertEquals( $term->slug, $data['slug'] );
		$this->assertEquals( $term->description, $data['description'] );
		$this->assertFalse( isset( $data['parent'] ) );

		$locations = get_nav_menu_locations();
		if ( ! empty( $locations ) ) {
			$menu_locations = array();
			foreach ( $locations as $location => $menu_id ) {
				if ( $menu_id === $term->term_id ) {
					$menu_locations[] = $location;
				}
			}

			$this->assertSame( $menu_locations, $data['locations'] );
		}

		$relations = array(
			'self',
			'collection',
			'about',
			'https://api.w.org/post_type',
		);

		if ( ! empty( $data['parent'] ) ) {
			$relations[] = 'up';
		}

		if ( ! empty( $data['locations'] ) ) {
			$relations[] = 'https://api.w.org/menu-location';
		}

		$this->assertEqualSets( $relations, array_keys( $links ) );
		$this->assertContains( 'wp/v2/taxonomies/' . $term->taxonomy, $links['about'][0]['href'] );
		$this->assertEquals( add_query_arg( 'menus', $term->term_id, rest_url( 'wp/v2/menu-items' ) ), $links['https://api.w.org/post_type'][0]['href'] );
	}
}
