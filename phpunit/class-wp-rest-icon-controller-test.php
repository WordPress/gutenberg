<?php
/**
 * Unit tests covering WP_REST_Icons_Controller functionality.
 *
 * @package gutenberg
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

	public function set_up() {
		parent::set_up();

		$collections = array(
			'test-public'  => true,
			'test-private' => false,
		);
		foreach ( $collections as $slug => $is_public ) {
			wp_register_icon_collection(
				$slug,
				array(
					'label'  => $slug,
					'public' => $is_public,
				)
			);
			wp_register_icon(
				$slug . '/visibility-icon',
				array(
					'label'   => 'Visibility Icon',
					'content' => '<svg viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></svg>',
				)
			);
		}
	}

	public function tear_down() {
		wp_unregister_icon_collection( 'test-public' );
		wp_unregister_icon_collection( 'test-private' );
		parent::tear_down();
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
	 * Test that GET /wp/v2/icons/?search=%s searches icon labels too.
	 */
	public function test_get_items_search_includes_label() {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );

		// The '@' character is only found in the *label* for core/at-symbol
		$request->set_param( 'search', '@' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertEquals( array( 'core/at-symbol' ), array_column( $data, 'name' ) );
	}

	/**
	 * Registers an icon carrying keywords, so the keyword tests do not depend on
	 * the terms any bundled icon happens to ship with.
	 *
	 * @return string The registered icon name.
	 */
	private function register_keyword_icon() {
		$icon_name = 'core/keyword-icon';

		wp_register_icon(
			$icon_name,
			array(
				'label'    => 'Keyword Icon',
				'content'  => '<svg></svg>',
				'keywords' => array( 'hamburger' ),
			)
		);

		return $icon_name;
	}

	/**
	 * Test that GET /wp/v2/icons/?search=%s searches icon keywords too.
	 */
	public function test_get_items_search_includes_keywords() {
		wp_set_current_user( self::$editor_id );

		$icon_name = $this->register_keyword_icon();

		try {
			$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );

			// 'hamburger' is in neither the name nor the label, only the keywords.
			$request->set_param( 'search', 'hamburger' );
			$response = rest_get_server()->dispatch( $request );
			$data     = $response->get_data();

			$this->assertSame( 200, $response->get_status() );
			$this->assertEquals( array( $icon_name ), array_column( $data, 'name' ) );
		} finally {
			wp_unregister_icon( $icon_name );
		}
	}

	/**
	 * Test that the response exposes an icon's keywords, so that clients which
	 * filter icons locally can match against them.
	 */
	public function test_get_items_response_includes_keywords() {
		wp_set_current_user( self::$editor_id );

		$icon_name = $this->register_keyword_icon();

		try {
			$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
			$request->set_param( 'search', $icon_name );
			$response = rest_get_server()->dispatch( $request );
			$data     = $response->get_data();

			$this->assertSame( 200, $response->get_status() );
			$this->assertCount( 1, $data );
			$this->assertArrayHasKey( 'keywords', $data[0] );
			$this->assertContains( 'hamburger', $data[0]['keywords'] );
		} finally {
			wp_unregister_icon( $icon_name );
		}
	}

	/**
	 * Test that icons registered without keywords still expose an empty array,
	 * so consumers do not have to handle a missing field.
	 */
	public function test_get_items_response_keywords_defaults_to_empty_array() {
		wp_set_current_user( self::$editor_id );

		wp_register_icon(
			'core/no-keywords',
			array(
				'label'   => 'No Keywords',
				'content' => '<svg></svg>',
			)
		);

		try {
			$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
			$request->set_param( 'search', 'core/no-keywords' );
			$response = rest_get_server()->dispatch( $request );
			$data     = $response->get_data();

			$this->assertSame( 200, $response->get_status() );
			$this->assertCount( 1, $data );
			$this->assertSame( array(), $data[0]['keywords'] );
		} finally {
			wp_unregister_icon( 'core/no-keywords' );
		}
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

	/**
	 * Test that icons in non-public collections are omitted from lists and search results.
	 *
	 * @dataProvider data_icon_visibility_searches
	 *
	 * @param string $search Icon search term.
	 */
	public function test_get_items_omits_non_public_collections( $search ) {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', '/wp/v2/icons' );
		$request->set_param( 'search', $search );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$names = wp_list_pluck( $response->get_data(), 'name' );
		$this->assertContains( 'test-public/visibility-icon', $names );
		$this->assertNotContains( 'test-private/visibility-icon', $names );
	}

	/**
	 * Provides icon searches that match both public and non-public collections.
	 *
	 * @return array[]
	 */
	public function data_icon_visibility_searches() {
		return array(
			'all icons'    => array( '' ),
			'search icons' => array( 'visibility' ),
		);
	}

	/**
	 * Test that an icon in a non-public collection is not readable by name.
	 */
	public function test_get_item_returns_404_for_non_public_collection() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icons/test-private/visibility-icon' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_icon_not_found', $response, 404 );
	}

	/**
	 * Test that non-public collections cannot be requested by URL or query parameter.
	 *
	 * @dataProvider data_non_public_collection_requests
	 *
	 * @param string $route REST API route.
	 * @param array  $query REST API query parameters.
	 */
	public function test_get_collection_icons_returns_404_for_non_public_collection( $route, $query ) {
		wp_set_current_user( self::$editor_id );

		$request = new WP_REST_Request( 'GET', $route );
		$request->set_query_params( $query );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_icon_collection_not_found', $response, 404 );
	}

	/**
	 * Provides requests scoped to a non-public collection.
	 *
	 * @return array[]
	 */
	public function data_non_public_collection_requests() {
		return array(
			'collection route' => array( '/wp/v2/icons/test-private', array() ),
			'collection query' => array( '/wp/v2/icons', array( 'collection' => 'test-private' ) ),
		);
	}

	/**
	 * Test that non-public collections are omitted from the collection list.
	 */
	public function test_get_collections_omits_non_public_collections() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 200, $response->get_status() );

		$slugs = wp_list_pluck( $response->get_data(), 'slug' );
		$this->assertContains( 'test-public', $slugs );
		$this->assertNotContains( 'test-private', $slugs );
	}

	/**
	 * Test that non-public collections are not readable by slug.
	 */
	public function test_get_collection_returns_404_for_non_public_collection() {
		wp_set_current_user( self::$editor_id );

		$request  = new WP_REST_Request( 'GET', '/wp/v2/icon-collections/test-private' );
		$response = rest_get_server()->dispatch( $request );

		$this->assertErrorResponse( 'rest_icon_collection_not_found', $response, 404 );
	}
}
