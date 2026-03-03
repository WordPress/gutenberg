<?php
/**
 * Unit tests covering WP_REST_Icons_Controller functionality.
 *
 * @package Gutenberg
 */
class WP_Test_REST_Icons_Controller extends WP_Test_REST_TestCase {
	protected static $admin_id;
	protected static $editor_id;
	protected static $contributor_id;
	protected static $subscriber_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id       = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$editor_id      = $factory->user->create( array( 'role' => 'editor' ) );
		self::$contributor_id = $factory->user->create( array( 'role' => 'contributor' ) );
		self::$subscriber_id  = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$contributor_id );
		self::delete_user( self::$subscriber_id );
	}

	/**
	 * Test that GET /wp/v2/icons returns a list of icons for users with edit_posts capability.
	 */
	public function test_get_items_returns_icons_list() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertNotEmpty( $data, 'Icon registry should contain at least one icon' );

		// Check structure of first icon
		$icon = $data[0];
		$this->assertArrayHasKey( 'name', $icon );
		$this->assertArrayHasKey( 'content', $icon );
		$this->assertIsString( $icon['name'] );
		$this->assertIsString( $icon['content'] );
		$this->assertStringStartsWith( '<svg ', $icon['content'], 'Icon content should be valid SVG markup' );
	}

	/**
	 * Test that GET /wp/v2/icons requires proper permissions.
	 */
	public function test_get_items_requires_edit_posts_capability() {
		wp_set_current_user( self::$subscriber_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * Test that administrators can access icons.
	 */
	public function test_get_items_admin_has_access() {
		wp_set_current_user( self::$admin_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that contributors can access icons.
	 */
	public function test_get_items_contributor_has_access() {
		wp_set_current_user( self::$contributor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );
	}

	/**
	 * Test that GET /wp/v2/icons/core/arrow-left returns specific icon data.
	 */
	public function test_get_item_returns_specific_icon() {
		wp_set_current_user( self::$editor_id );

		/*
		 * Intentionally avoid mocks or class reflection to register fake
		 * icons. Yes, this blurs the line between unit and integration
		 * testing, but as of now WP_Icons_Registry is closed for registration
		 * and really MUST contain our core icons.
		 */

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons/core/arrow-left' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'name', $data );
		$this->assertArrayHasKey( 'label', $data );
		$this->assertArrayHasKey( 'content', $data );
		$this->assertSame( 'core/arrow-left', $data['name'] );
		$this->assertSame( 'Arrow Left', $data['label'] );
		$this->assertNotEmpty( $data['content'] );
		$this->assertStringStartsWith(
			'<svg xmlns="',
			$data['content'],
			'Icon content should match the actual SVG asset'
		);
	}

	/**
	 * Test that GET /wp/v2/icons/core/invalid returns 404 for non-existent icons.
	 */
	public function test_get_item_returns_404_for_invalid_icon() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons/core/invalid-icon-name' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_icon_not_found', $response, 404 );
	}

	/**
	 * Test that GET /wp/v2/icons/?search=arrow returns filtered results.
	 */
	public function test_get_items_search_filters_results() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$request->set_param( 'search', 'arrow' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );

		// All returned icons should contain "arrow" in their name
		foreach ( $data as $icon ) {
			$this->assertStringContainsStringIgnoringCase( 'arrow', $icon['name'] );
		}

		// Assert that 'core/arrow-left' is specifically included in the results
		$icon_names = array_column( $data, 'name' );
		$this->assertContains( 'core/arrow-left', $icon_names, 'Search results should include core/arrow-left icon' );
	}

	/**
	 * Test that search is case-insensitive.
	 */
	public function test_get_items_search_case_insensitive() {
		wp_set_current_user( self::$editor_id );

		// Test with uppercase search term
		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$request->set_param( 'search', 'ARROW' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// All returned icons should contain "arrow" in their name (case insensitive)
		foreach ( $data as $icon ) {
			$this->assertStringContainsStringIgnoringCase( 'arrow', $icon['name'] );
		}
	}

	/**
	 * Test that search with no matches returns empty array.
	 */
	public function test_get_items_search_no_matches() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$request->set_param( 'search', 'nonexistenticon12345' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );
		$this->assertEmpty( $data );
	}

	/**
	 * Test that _fields parameter filters response fields.
	 */
	public function test_get_items_fields_parameter() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$request->set_param( '_fields', 'name' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );

		// Each icon should only have the 'name' field
		foreach ( $data as $icon ) {
			$this->assertArrayHasKey( 'name', $icon );
			$this->assertArrayNotHasKey( 'content', $icon );
		}
	}

	/**
	 * Test permissions for getting a specific icon.
	 */
	public function test_get_item_requires_permissions() {
		// Get a valid icon name first with proper permissions
		wp_set_current_user( self::$editor_id );
		$list_request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$list_response = rest_get_server()->dispatch( $list_request );

		// Icons endpoint must be available
		$this->assertSame( 200, $list_response->get_status(), 'Icons endpoint should be available and return 200' );

		$all_icons = $list_response->get_data();

		// Registry should contain at least our test icon
		$this->assertIsArray( $all_icons, 'Icons endpoint should return an array' );
		$this->assertNotEmpty( $all_icons, 'Icon registry should contain at least one icon' );
		$this->assertArrayHasKey( 'name', $all_icons[0], 'Icons should have a name field' );

		$test_icon_name = $all_icons[0]['name'];

		// Now test with subscriber (no permissions)
		wp_set_current_user( self::$subscriber_id );
		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons/' . $test_icon_name );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 403 );
	}

	/**
	 * Test that unauthenticated users cannot access icons.
	 */
	public function test_get_items_requires_authentication() {
		wp_set_current_user( 0 ); // No user

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}

	/**
	 * Test that unauthenticated users cannot access specific icons.
	 */
	public function test_get_item_requires_authentication() {
		wp_set_current_user( 0 ); // No user

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons/core/some-icon' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_cannot_view', $response, 401 );
	}
}
