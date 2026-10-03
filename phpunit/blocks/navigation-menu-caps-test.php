<?php
/**
 * Navigation Menu capability tests.
 *
 * @package Gutenberg
 */

/**
 * Tests the Gutenberg plugin capability split for `wp_navigation`.
 *
 * @group blocks
 * @group navigation
 */
class Gutenberg_Navigation_Menu_Caps_Test extends WP_Test_REST_TestCase {
	const NAVIGATION_CAPABILITY_MANAGER_ROLE = 'gutenberg_navigation_menu_manager';

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
	 * Creates shared users.
	 *
	 * @param WP_UnitTest_Factory $factory Factory instance.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		remove_role( self::NAVIGATION_CAPABILITY_MANAGER_ROLE );
		add_role(
			self::NAVIGATION_CAPABILITY_MANAGER_ROLE,
			'Gutenberg Navigation Menu Manager',
			self::get_navigation_manager_role_capabilities()
		);

		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);

		self::$editor_id = $factory->user->create(
			array(
				'role' => 'editor',
			)
		);

		self::$navigation_manager_id = $factory->user->create(
			array(
				'role' => self::NAVIGATION_CAPABILITY_MANAGER_ROLE,
			)
		);
	}

	/**
	 * Deletes shared users.
	 */
	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
		self::delete_user( self::$editor_id );
		self::delete_user( self::$navigation_manager_id );
		remove_role( self::NAVIGATION_CAPABILITY_MANAGER_ROLE );
	}

	/**
	 * Resets the current user.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Returns the custom role capabilities used by these tests.
	 *
	 * @return bool[] Role capabilities.
	 */
	private static function get_navigation_manager_role_capabilities() {
		$capabilities = array( 'read' => true );

		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$capabilities[ $capability ] = true;
		}

		return $capabilities;
	}

	/**
	 * Asserts that the current user has no Navigation Menu management caps.
	 */
	private function assert_current_user_has_no_navigation_management_capabilities() {
		$this->assertFalse( current_user_can( 'edit_theme_options' ) );
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->assertFalse(
				current_user_can( $capability ),
				"Expected user not to have {$capability}."
			);
		}
	}

	/**
	 * Asserts that the current user relies only on Navigation Menu caps.
	 */
	private function assert_current_user_has_only_navigation_management_capabilities() {
		$this->assertFalse( current_user_can( 'edit_theme_options' ) );
		$this->assertFalse( current_user_can( 'edit_posts' ) );
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->assertTrue(
				current_user_can( $capability ),
				"Expected user to have {$capability}."
			);
		}
	}

	/**
	 * Denies Navigation Menu capabilities after the compatibility bridge runs.
	 *
	 * This models a permissions plugin that deliberately allows access to the
	 * Site Editor while making shared Navigation Menu entities read-only.
	 *
	 * @param bool[] $allcaps All capabilities for the current user.
	 * @return bool[] Filtered capabilities.
	 */
	public function deny_navigation_management_capabilities( $allcaps ) {
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$allcaps[ $capability ] = false;
		}

		return $allcaps;
	}

	/**
	 * Creates a published block Navigation Menu post.
	 *
	 * @param array $args Post arguments.
	 * @return int Post ID.
	 */
	private function create_navigation_menu( $args = array() ) {
		return self::factory()->post->create(
			array_merge(
				array(
					'post_content' => '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
					'post_status'  => 'publish',
					'post_title'   => 'Test Navigation Menu',
					'post_type'    => 'wp_navigation',
				),
				$args
			)
		);
	}

	/**
	 * Dispatches a REST API request.
	 *
	 * @param string $method REST method.
	 * @param string $route  REST route.
	 * @param array  $params Request parameters.
	 * @return WP_REST_Response REST response.
	 */
	private function dispatch_request( $method, $route, $params = array() ) {
		$request = new WP_REST_Request( $method, $route );
		foreach ( $params as $name => $value ) {
			$request->set_param( $name, $value );
		}
		return rest_get_server()->dispatch( $request );
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 * @covers ::gutenberg_get_wp_navigation_post_type_capabilities
	 */
	public function test_wp_navigation_post_type_uses_navigation_menu_capabilities() {
		$post_type = get_post_type_object( 'wp_navigation' );

		$this->assertNotFalse( $post_type );
		$this->assertTrue( $post_type->map_meta_cap );

		foreach ( gutenberg_get_wp_navigation_post_type_capabilities() as $capability_name => $mapped_capability ) {
			$this->assertSame(
				$mapped_capability,
				$post_type->cap->$capability_name,
				"Expected wp_navigation cap {$capability_name} to map to {$mapped_capability}."
			);
		}
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_wp_navigation_post_type_caps_are_not_overridden_when_already_customized() {
		$args = array(
			'capabilities' => array(
				'edit_posts' => 'custom_edit_navigation_menus',
			),
		);

		$this->assertSame(
			$args,
			gutenberg_filter_wp_navigation_post_type_args( $args, 'wp_navigation' )
		);
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_wp_navigation_post_type_caps_are_not_overridden_when_read_cap_is_customized() {
		$args = array(
			'capabilities' => array(
				'edit_posts' => 'edit_theme_options',
				'read'       => 'custom_read_navigation_menus',
			),
		);

		$this->assertSame(
			$args,
			gutenberg_filter_wp_navigation_post_type_args( $args, 'wp_navigation' )
		);
	}

	/**
	 * @covers ::gutenberg_maybe_grant_wp_navigation_menu_caps
	 */
	public function test_admins_receive_navigation_menu_caps_through_edit_theme_options_bridge() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$admin_id );

		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->assertTrue(
				current_user_can( $capability ),
				"Expected administrator to have {$capability}."
			);
		}

		$this->assertTrue( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_wp_navigation_menu_caps
	 */
	public function test_default_editor_without_navigation_write_caps_cannot_manage_navigation_menus() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );
		$this->assert_current_user_has_no_navigation_management_capabilities();

		$this->assertFalse( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertFalse( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_wp_navigation_menu_caps
	 */
	public function test_navigation_capability_manager_can_manage_menus_without_edit_theme_options() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$navigation_manager_id );
		$this->assert_current_user_has_only_navigation_management_capabilities();

		$this->assertTrue( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_classic_menu_capabilities_are_not_remapped_to_block_navigation_caps() {
		$navigation_caps = gutenberg_get_wp_navigation_menu_capability_names();

		$nav_menu_taxonomy = get_taxonomy( 'nav_menu' );
		$this->assertNotFalse( $nav_menu_taxonomy );
		foreach ( get_object_vars( $nav_menu_taxonomy->cap ) as $capability ) {
			$this->assertNotContains( $capability, $navigation_caps );
		}

		$nav_menu_item_post_type = get_post_type_object( 'nav_menu_item' );
		$this->assertNotFalse( $nav_menu_item_post_type );
		foreach ( get_object_vars( $nav_menu_item_post_type->cap ) as $capability ) {
			$this->assertNotContains( $capability, $navigation_caps );
		}
	}

	/**
	 * @covers WP_REST_Posts_Controller::create_item
	 * @covers WP_REST_Posts_Controller::update_item
	 * @covers WP_REST_Posts_Controller::delete_item
	 */
	public function test_navigation_capability_manager_can_mutate_menus_via_rest_without_general_post_caps() {
		wp_set_current_user( self::$navigation_manager_id );
		$this->assert_current_user_has_only_navigation_management_capabilities();

		$create_response = $this->dispatch_request(
			'POST',
			'/wp/v2/navigation',
			array(
				'content' => '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
				'status'  => 'publish',
				'title'   => 'REST Navigation Menu',
			)
		);

		$this->assertSame( 201, $create_response->get_status() );
		$created = $create_response->get_data();
		$this->assertIsArray( $created );
		$this->assertArrayHasKey( 'id', $created );

		$update_response = $this->dispatch_request(
			'PUT',
			'/wp/v2/navigation/' . $created['id'],
			array(
				'title' => 'Updated REST Navigation Menu',
			)
		);

		$this->assertSame( 200, $update_response->get_status() );

		$delete_response = $this->dispatch_request(
			'DELETE',
			'/wp/v2/navigation/' . $created['id'],
			array(
				'force' => true,
			)
		);

		$this->assertSame( 200, $delete_response->get_status() );
	}

	/**
	 * @covers WP_REST_Posts_Controller::create_item_permissions_check
	 * @covers WP_REST_Posts_Controller::update_item_permissions_check
	 * @covers WP_REST_Posts_Controller::delete_item_permissions_check
	 */
	public function test_default_editor_without_navigation_write_caps_cannot_mutate_menus_via_rest() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );
		$this->assert_current_user_has_no_navigation_management_capabilities();

		$create_response = $this->dispatch_request(
			'POST',
			'/wp/v2/navigation',
			array(
				'content' => '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
				'status'  => 'publish',
				'title'   => 'Forbidden REST Navigation Menu',
			)
		);
		$this->assertSame( 403, $create_response->get_status() );

		$update_response = $this->dispatch_request(
			'PUT',
			'/wp/v2/navigation/' . $navigation_id,
			array(
				'title' => 'Forbidden REST Navigation Menu Update',
			)
		);
		$this->assertSame( 403, $update_response->get_status() );

		$delete_response = $this->dispatch_request(
			'DELETE',
			'/wp/v2/navigation/' . $navigation_id,
			array(
				'force' => true,
			)
		);
		$this->assertSame( 403, $delete_response->get_status() );
	}

	/**
	 * @covers WP_REST_Posts_Controller::get_items
	 * @covers WP_REST_Posts_Controller::get_item
	 */
	public function test_default_editor_without_navigation_write_caps_can_read_published_menus_in_view_context() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );
		$this->assert_current_user_has_no_navigation_management_capabilities();

		$collection_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation',
			array(
				'context' => 'view',
				'status'  => 'publish',
			)
		);

		$this->assertSame( 200, $collection_response->get_status() );
		$this->assertContains(
			$navigation_id,
			wp_list_pluck( $collection_response->get_data(), 'id' )
		);

		$item_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation/' . $navigation_id,
			array( 'context' => 'view' )
		);

		$this->assertSame( 200, $item_response->get_status() );
		$item = $item_response->get_data();
		$this->assertSame( $navigation_id, $item['id'] );
		$this->assertArrayHasKey( 'rendered', $item['content'] );
		$this->assertArrayNotHasKey( 'raw', $item['content'] );
	}

	/**
	 * @covers WP_REST_Posts_Controller::get_items
	 * @covers WP_REST_Posts_Controller::get_item
	 */
	public function test_default_editor_without_navigation_write_caps_cannot_use_edit_context_or_query_drafts() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );
		$this->assert_current_user_has_no_navigation_management_capabilities();

		$item_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation/' . $navigation_id,
			array( 'context' => 'edit' )
		);
		$this->assertSame( 403, $item_response->get_status() );

		$collection_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation',
			array(
				'context' => 'edit',
				'status'  => array( 'publish', 'draft' ),
			)
		);
		$this->assertSame( 400, $collection_response->get_status() );
	}

	/**
	 * @covers ::gutenberg_get_navigation_fallback_permissions_check
	 */
	public function test_navigation_capability_manager_can_create_fallback_without_theme_or_general_post_caps() {
		wp_set_current_user( self::$navigation_manager_id );
		$this->assert_current_user_has_only_navigation_management_capabilities();

		$response = $this->dispatch_request(
			'GET',
			'/wp-block-editor/v1/navigation-fallback',
			array( '_embed' => true )
		);

		$this->assertSame( 200, $response->get_status() );
		$data = $response->get_data();
		$this->assertArrayHasKey( 'id', $data );
		$this->assertSame( 'wp_navigation', get_post_type( $data['id'] ) );
		$this->assertSame( 'publish', get_post_status( $data['id'] ) );
	}

	/**
	 * @covers ::gutenberg_get_navigation_fallback_permissions_check
	 */
	public function test_default_editor_without_navigation_write_caps_cannot_create_fallback() {
		wp_set_current_user( self::$editor_id );
		$this->assert_current_user_has_no_navigation_management_capabilities();
		$before = wp_count_posts( 'wp_navigation' )->publish;

		$response = $this->dispatch_request(
			'GET',
			'/wp-block-editor/v1/navigation-fallback',
			array( '_embed' => true )
		);

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( $before, wp_count_posts( 'wp_navigation' )->publish );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_wp_navigation_menu_caps
	 * @covers ::gutenberg_get_navigation_fallback_permissions_check
	 * @covers WP_REST_Posts_Controller::get_items
	 * @covers WP_REST_Posts_Controller::get_item
	 * @covers WP_REST_Posts_Controller::create_item_permissions_check
	 * @covers WP_REST_Posts_Controller::update_item_permissions_check
	 * @covers WP_REST_Posts_Controller::delete_item_permissions_check
	 */
	public function test_site_editor_capable_administrator_with_explicit_navigation_denials_has_read_only_rest_access() {
		$published_navigation_id = $this->create_navigation_menu(
			array( 'post_title' => 'Published Menu Visible To Site Editor User' )
		);
		$draft_navigation_id     = $this->create_navigation_menu(
			array(
				'post_status' => 'draft',
				'post_title'  => 'Draft Menu Hidden From Site Editor User',
			)
		);

		wp_set_current_user( self::$admin_id );
		add_filter( 'user_has_cap', array( $this, 'deny_navigation_management_capabilities' ), 20 );

		try {
			$this->assertTrue(
				current_user_can( 'edit_theme_options' ),
				'Expected the user to retain the capability that gates access to the Site Editor.'
			);

			foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
				$this->assertFalse(
					current_user_can( $capability ),
					"Expected the custom permissions filter to deny {$capability}."
				);
			}

			$view_collection_response = $this->dispatch_request(
				'GET',
				'/wp/v2/navigation',
				array(
					'context' => 'view',
					'status'  => 'publish',
				)
			);
			$this->assertSame( 200, $view_collection_response->get_status() );
			$visible_navigation_ids = wp_list_pluck( $view_collection_response->get_data(), 'id' );
			$this->assertContains( $published_navigation_id, $visible_navigation_ids );
			$this->assertNotContains( $draft_navigation_id, $visible_navigation_ids );

			$view_item_response = $this->dispatch_request(
				'GET',
				'/wp/v2/navigation/' . $published_navigation_id,
				array( 'context' => 'view' )
			);
			$this->assertSame( 200, $view_item_response->get_status() );

			$edit_item_response = $this->dispatch_request(
				'GET',
				'/wp/v2/navigation/' . $published_navigation_id,
				array( 'context' => 'edit' )
			);
			$this->assertSame( 403, $edit_item_response->get_status() );

			$draft_item_response = $this->dispatch_request(
				'GET',
				'/wp/v2/navigation/' . $draft_navigation_id,
				array( 'context' => 'view' )
			);
			$this->assertSame( 403, $draft_item_response->get_status() );

			$draft_collection_response = $this->dispatch_request(
				'GET',
				'/wp/v2/navigation',
				array(
					'context' => 'view',
					'status'  => 'draft',
				)
			);
			$this->assertSame( 400, $draft_collection_response->get_status() );

			$create_response = $this->dispatch_request(
				'POST',
				'/wp/v2/navigation',
				array(
					'content' => '<!-- wp:navigation-link {"label":"Forbidden","url":"/forbidden"} /-->',
					'status'  => 'publish',
					'title'   => 'Forbidden REST Navigation Menu',
				)
			);
			$this->assertSame( 403, $create_response->get_status() );

			$update_response = $this->dispatch_request(
				'PUT',
				'/wp/v2/navigation/' . $published_navigation_id,
				array( 'title' => 'Forbidden REST Navigation Menu Update' )
			);
			$this->assertSame( 403, $update_response->get_status() );

			$delete_response = $this->dispatch_request(
				'DELETE',
				'/wp/v2/navigation/' . $published_navigation_id,
				array( 'force' => true )
			);
			$this->assertSame( 403, $delete_response->get_status() );

			$published_count_before_fallback = wp_count_posts( 'wp_navigation' )->publish;
			$fallback_response               = $this->dispatch_request(
				'GET',
				'/wp-block-editor/v1/navigation-fallback',
				array( '_embed' => true )
			);
			$this->assertSame( 403, $fallback_response->get_status() );
			$this->assertSame( $published_count_before_fallback, wp_count_posts( 'wp_navigation' )->publish );
		} finally {
			remove_filter( 'user_has_cap', array( $this, 'deny_navigation_management_capabilities' ), 20 );
		}
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_block_navigation_caps_do_not_grant_classic_menu_rest_write_access() {
		wp_set_current_user( self::$navigation_manager_id );

		$menus_response = $this->dispatch_request(
			'POST',
			'/wp/v2/menus',
			array(
				'name' => 'Classic Menu From Block Navigation Role',
			)
		);
		$this->assertSame( 403, $menus_response->get_status() );

		$menu_items_response = $this->dispatch_request(
			'POST',
			'/wp/v2/menu-items',
			array(
				'title' => 'Classic Menu Item From Block Navigation Role',
				'type'  => 'custom',
				'url'   => 'https://example.com/',
			)
		);
		$this->assertSame( 403, $menu_items_response->get_status() );
	}
}
