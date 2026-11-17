<?php
/**
 * Tests for the block Navigation Menu capabilities.
 *
 * @package gutenberg
 */

/**
 * Tests the `wp_navigation` capability split and the `edit_theme_options` bridge.
 *
 * @group navigation
 */
class Gutenberg_Navigation_Menu_Capabilities_Test extends WP_Test_REST_TestCase {
	const NAVIGATION_MANAGER_ROLE = 'gutenberg_navigation_menu_manager';

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
	 * Capabilities observed by `observe_and_deny_navigation_menu_caps()`.
	 *
	 * @var array
	 */
	private $observed_caps = array();

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
	 * Restores the administrator role, filters and the current user.
	 */
	public function tear_down() {
		$administrator = get_role( 'administrator' );
		foreach ( $this->administrator_caps_to_remove as $capability ) {
			$administrator->remove_cap( $capability );
		}
		$this->administrator_caps_to_remove = array();
		$this->observed_caps                = array();

		remove_filter( 'user_has_cap', array( $this, 'observe_and_deny_navigation_menu_caps' ), 10 );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Stores a capability on the administrator role, the way a role editor does.
	 *
	 * @param string $capability Capability name.
	 * @param bool   $grant      Whether the role is granted the capability.
	 */
	private function set_administrator_cap( $capability, $grant ) {
		get_role( 'administrator' )->add_cap( $capability, $grant );
		$this->administrator_caps_to_remove[] = $capability;
	}

	/**
	 * Records the Navigation Menu caps a later filter sees, then denies them.
	 *
	 * Models a permissions plugin hooked at the default priority.
	 *
	 * @param bool[] $allcaps All capabilities for the user.
	 * @return bool[] Filtered capabilities.
	 */
	public function observe_and_deny_navigation_menu_caps( $allcaps ) {
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->observed_caps[ $capability ] = $allcaps[ $capability ] ?? null;
			$allcaps[ $capability ]             = false;
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
	 * Asserts whether the current user has each block Navigation Menu capability.
	 *
	 * @param bool $expected Whether the user is expected to have the capabilities.
	 */
	private function assert_current_user_navigation_menu_caps( $expected ) {
		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->assertSame(
				$expected,
				current_user_can( $capability ),
				sprintf( 'Unexpected result for %s.', $capability )
			);
		}
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 * @covers ::gutenberg_get_wp_navigation_post_type_capabilities
	 */
	public function test_wp_navigation_post_type_uses_navigation_menu_capabilities() {
		$post_type = get_post_type_object( 'wp_navigation' );

		$this->assertNotNull( $post_type );
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
	 * @covers ::gutenberg_should_override_wp_navigation_post_type_capabilities
	 */
	public function test_wp_navigation_post_type_caps_are_not_overridden_when_already_customized() {
		$args = array(
			'capabilities' => array(
				'edit_posts' => 'custom_edit_navigation_menus',
			),
		);

		$this->assertSame( $args, gutenberg_filter_wp_navigation_post_type_args( $args, 'wp_navigation' ) );
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 * @covers ::gutenberg_should_override_wp_navigation_post_type_capabilities
	 */
	public function test_wp_navigation_post_type_caps_are_not_overridden_when_another_cap_is_customized() {
		$args = array(
			'capabilities' => array(
				'edit_posts' => 'edit_theme_options',
				'read'       => 'custom_read_navigation_menus',
			),
		);

		$this->assertSame( $args, gutenberg_filter_wp_navigation_post_type_args( $args, 'wp_navigation' ) );
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_other_post_types_are_not_changed() {
		$args = array(
			'capabilities' => array(
				'edit_posts' => 'edit_theme_options',
			),
		);

		$this->assertSame( $args, gutenberg_filter_wp_navigation_post_type_args( $args, 'post' ) );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_bridge_runs_before_default_priority_filters() {
		$this->assertSame( 1, has_filter( 'user_has_cap', 'gutenberg_maybe_grant_navigation_menu_caps' ) );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_administrator_receives_navigation_menu_caps_through_edit_theme_options() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$admin_id );

		$this->assert_current_user_navigation_menu_caps( true );
		$this->assertTrue( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_bridge_does_not_grant_caps_that_were_not_requested() {
		$user = get_userdata( self::$admin_id );

		$allcaps = gutenberg_maybe_grant_navigation_menu_caps( $user->allcaps, array( 'edit_posts' ) );

		$this->assertSame( $user->allcaps, $allcaps );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_role_storing_navigation_menu_cap_as_false_is_denied_despite_edit_theme_options() {
		$this->set_administrator_cap( 'edit_navigation_menus', false );
		wp_set_current_user( self::$admin_id );

		$this->assertTrue( current_user_can( 'edit_theme_options' ) );
		$this->assertFalse( current_user_can( 'edit_navigation_menus' ), 'A stored denial should be kept.' );
		$this->assertTrue( current_user_can( 'create_navigation_menus' ), 'Capabilities without a stored value should still be granted.' );

		$response = $this->dispatch_request( 'GET', '/wp/v2/navigation', array( 'context' => 'edit' ) );
		$this->assertErrorResponse( 'rest_forbidden_context', $response, 403 );
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_user_storing_navigation_menu_cap_as_false_is_denied_despite_edit_theme_options() {
		$user = get_userdata( self::$admin_id );
		$user->add_cap( 'create_navigation_menus', false );

		try {
			wp_set_current_user( self::$admin_id );

			$this->assertTrue( current_user_can( 'edit_theme_options' ) );
			$this->assertFalse( current_user_can( 'create_navigation_menus' ) );
			$this->assertTrue( current_user_can( 'edit_navigation_menus' ) );

			$response = $this->dispatch_request(
				'POST',
				'/wp/v2/navigation',
				array(
					'content' => '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
					'title'   => 'Forbidden REST Navigation Menu',
				)
			);
			$this->assertErrorResponse( 'rest_cannot_create', $response, 403 );
		} finally {
			$user->remove_cap( 'create_navigation_menus' );
		}
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_default_priority_filter_sees_bridged_caps_and_can_deny_them() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$admin_id );
		add_filter( 'user_has_cap', array( $this, 'observe_and_deny_navigation_menu_caps' ), 10 );

		$this->assertTrue( current_user_can( 'edit_theme_options' ) );
		$this->assert_current_user_navigation_menu_caps( false );
		$this->assertFalse( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertFalse( current_user_can( 'delete_post', $navigation_id ) );

		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->assertTrue(
				$this->observed_caps[ $capability ],
				"Expected {$capability} to be granted before default priority filters run."
			);
		}
	}

	/**
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_editor_cannot_manage_navigation_menus() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );

		$this->assertFalse( current_user_can( 'edit_theme_options' ) );
		$this->assert_current_user_navigation_menu_caps( false );
		$this->assertFalse( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertFalse( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_filter_wp_navigation_post_type_args
	 */
	public function test_navigation_manager_can_manage_menus_without_edit_theme_options() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$navigation_manager_id );

		$this->assertFalse( current_user_can( 'edit_theme_options' ) );
		$this->assertFalse( current_user_can( 'edit_posts' ) );
		$this->assert_current_user_navigation_menu_caps( true );
		$this->assertTrue( current_user_can( 'edit_post', $navigation_id ) );
		$this->assertTrue( current_user_can( 'delete_post', $navigation_id ) );
	}

	/**
	 * @covers ::gutenberg_get_wp_navigation_menu_capability_names
	 */
	public function test_classic_menu_capabilities_are_not_remapped() {
		$navigation_caps = gutenberg_get_wp_navigation_menu_capability_names();

		$nav_menu_taxonomy = get_taxonomy( 'nav_menu' );
		$this->assertNotFalse( $nav_menu_taxonomy );
		foreach ( get_object_vars( $nav_menu_taxonomy->cap ) as $capability ) {
			$this->assertNotContains( $capability, $navigation_caps );
		}

		$nav_menu_item_post_type = get_post_type_object( 'nav_menu_item' );
		$this->assertNotNull( $nav_menu_item_post_type );
		foreach ( get_object_vars( $nav_menu_item_post_type->cap ) as $capability ) {
			$this->assertNotContains( $capability, $navigation_caps );
		}
	}

	/**
	 * @coversNothing
	 */
	public function test_navigation_manager_can_mutate_menus_via_rest() {
		wp_set_current_user( self::$navigation_manager_id );

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

		$update_response = $this->dispatch_request(
			'PUT',
			'/wp/v2/navigation/' . $created['id'],
			array( 'title' => 'Updated REST Navigation Menu' )
		);
		$this->assertSame( 200, $update_response->get_status() );

		$delete_response = $this->dispatch_request(
			'DELETE',
			'/wp/v2/navigation/' . $created['id'],
			array( 'force' => true )
		);
		$this->assertSame( 200, $delete_response->get_status() );
	}

	/**
	 * @coversNothing
	 */
	public function test_editor_cannot_mutate_menus_via_rest() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );

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
			array( 'title' => 'Forbidden REST Navigation Menu Update' )
		);
		$this->assertSame( 403, $update_response->get_status() );

		$delete_response = $this->dispatch_request(
			'DELETE',
			'/wp/v2/navigation/' . $navigation_id,
			array( 'force' => true )
		);
		$this->assertSame( 403, $delete_response->get_status() );
	}

	/**
	 * @coversNothing
	 */
	public function test_editor_can_read_published_menus_in_view_context_only() {
		$navigation_id = $this->create_navigation_menu();

		wp_set_current_user( self::$editor_id );

		$collection_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation',
			array(
				'context' => 'view',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 200, $collection_response->get_status() );
		$this->assertContains( $navigation_id, wp_list_pluck( $collection_response->get_data(), 'id' ) );

		$item_response = $this->dispatch_request( 'GET', '/wp/v2/navigation/' . $navigation_id, array( 'context' => 'view' ) );
		$this->assertSame( 200, $item_response->get_status() );
		$item = $item_response->get_data();
		$this->assertArrayHasKey( 'rendered', $item['content'] );
		$this->assertArrayNotHasKey( 'raw', $item['content'] );

		$edit_response = $this->dispatch_request( 'GET', '/wp/v2/navigation/' . $navigation_id, array( 'context' => 'edit' ) );
		$this->assertSame( 403, $edit_response->get_status() );

		$drafts_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation',
			array(
				'context' => 'edit',
				'status'  => array( 'publish', 'draft' ),
			)
		);
		$this->assertSame( 400, $drafts_response->get_status() );
	}

	/**
	 * Models a role editor making Navigation Menus read-only for a user who can
	 * otherwise use the Site Editor.
	 *
	 * @covers ::gutenberg_maybe_grant_navigation_menu_caps
	 */
	public function test_administrator_with_stored_navigation_menu_denials_has_read_only_rest_access() {
		$published_id = $this->create_navigation_menu();
		$draft_id     = $this->create_navigation_menu( array( 'post_status' => 'draft' ) );

		foreach ( gutenberg_get_wp_navigation_menu_capability_names() as $capability ) {
			$this->set_administrator_cap( $capability, false );
		}
		wp_set_current_user( self::$admin_id );

		$this->assertTrue( current_user_can( 'edit_theme_options' ), 'The user should keep Site Editor access.' );
		$this->assert_current_user_navigation_menu_caps( false );

		$collection_response = $this->dispatch_request(
			'GET',
			'/wp/v2/navigation',
			array(
				'context' => 'view',
				'status'  => 'publish',
			)
		);
		$this->assertSame( 200, $collection_response->get_status() );
		$visible_ids = wp_list_pluck( $collection_response->get_data(), 'id' );
		$this->assertContains( $published_id, $visible_ids );
		$this->assertNotContains( $draft_id, $visible_ids );

		$this->assertSame( 200, $this->dispatch_request( 'GET', '/wp/v2/navigation/' . $published_id, array( 'context' => 'view' ) )->get_status() );
		$this->assertSame( 403, $this->dispatch_request( 'GET', '/wp/v2/navigation/' . $published_id, array( 'context' => 'edit' ) )->get_status() );
		$this->assertSame( 403, $this->dispatch_request( 'GET', '/wp/v2/navigation/' . $draft_id, array( 'context' => 'view' ) )->get_status() );

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
			'/wp/v2/navigation/' . $published_id,
			array( 'title' => 'Forbidden REST Navigation Menu Update' )
		);
		$this->assertSame( 403, $update_response->get_status() );

		$delete_response = $this->dispatch_request(
			'DELETE',
			'/wp/v2/navigation/' . $published_id,
			array( 'force' => true )
		);
		$this->assertSame( 403, $delete_response->get_status() );
	}

	/**
	 * @coversNothing
	 */
	public function test_navigation_menu_caps_do_not_grant_classic_menu_rest_write_access() {
		wp_set_current_user( self::$navigation_manager_id );

		$menus_response = $this->dispatch_request(
			'POST',
			'/wp/v2/menus',
			array( 'name' => 'Classic Menu From Block Navigation Role' )
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
