<?php

// Test roles and capabilities via the WP_User class

/**
 * @group user
 * @group capabilities
 */
class Tests_User_Capabilities extends WP_UnitTestCase {

	protected static $users = array(
		'administrator' => null,
		'editor'        => null,
		'author'        => null,
		'contributor'   => null,
		'subscriber'    => null,
	);
	protected static $super_admin = null;

	public static function wpSetUpBeforeClass( $factory ) {
		self::$users = array(
			'administrator' => $factory->user->create_and_get( array( 'role' => 'administrator' ) ),
			'editor'        => $factory->user->create_and_get( array( 'role' => 'editor' ) ),
			'author'        => $factory->user->create_and_get( array( 'role' => 'author' ) ),
			'contributor'   => $factory->user->create_and_get( array( 'role' => 'contributor' ) ),
			'subscriber'    => $factory->user->create_and_get( array( 'role' => 'subscriber' ) ),
		);
		self::$super_admin = $factory->user->create_and_get( array( 'role' => 'contributor' ) );
		grant_super_admin( self::$super_admin->ID );
	}

	function setUp() {
		parent::setUp();
		// keep track of users we create
		$this->_flush_roles();

	}

	function _flush_roles() {
		// we want to make sure we're testing against the db, not just in-memory data
		// this will flush everything and reload it from the db
		unset($GLOBALS['wp_user_roles']);
		global $wp_roles;
		$wp_roles = new WP_Roles();
	}

	function _meta_yes_you_can( $can, $key, $post_id, $user_id, $cap, $caps ) {
		return true;
	}

	function _meta_no_you_cant( $can, $key, $post_id, $user_id, $cap, $caps ) {
		return false;
	}

	function _meta_filter( $meta_value, $meta_key, $meta_type ) {
		return $meta_value;
	}

	final private function _getSingleSitePrimitiveCaps() {
		return array(

			'unfiltered_html'        => array( 'administrator', 'editor' ),

			'activate_plugins'       => array( 'administrator' ),
			'create_users'           => array( 'administrator' ),
			'delete_plugins'         => array( 'administrator' ),
			'delete_themes'          => array( 'administrator' ),
			'delete_users'           => array( 'administrator' ),
			'edit_files'             => array( 'administrator' ),
			'edit_plugins'           => array( 'administrator' ),
			'edit_themes'            => array( 'administrator' ),
			'edit_users'             => array( 'administrator' ),
			'install_plugins'        => array( 'administrator' ),
			'install_themes'         => array( 'administrator' ),
			'update_core'            => array( 'administrator' ),
			'update_plugins'         => array( 'administrator' ),
			'update_themes'          => array( 'administrator' ),
			'edit_theme_options'     => array( 'administrator' ),
			'export'                 => array( 'administrator' ),
			'import'                 => array( 'administrator' ),
			'list_users'             => array( 'administrator' ),
			'manage_options'         => array( 'administrator' ),
			'promote_users'          => array( 'administrator' ),
			'remove_users'           => array( 'administrator' ),
			'switch_themes'          => array( 'administrator' ),
			'edit_dashboard'         => array( 'administrator' ),

			'moderate_comments'      => array( 'administrator', 'editor' ),
			'manage_categories'      => array( 'administrator', 'editor' ),
			'edit_others_posts'      => array( 'administrator', 'editor' ),
			'edit_pages'             => array( 'administrator', 'editor' ),
			'edit_others_pages'      => array( 'administrator', 'editor' ),
			'edit_published_pages'   => array( 'administrator', 'editor' ),
			'publish_pages'          => array( 'administrator', 'editor' ),
			'delete_pages'           => array( 'administrator', 'editor' ),
			'delete_others_pages'    => array( 'administrator', 'editor' ),
			'delete_published_pages' => array( 'administrator', 'editor' ),
			'delete_others_posts'    => array( 'administrator', 'editor' ),
			'delete_private_posts'   => array( 'administrator', 'editor' ),
			'edit_private_posts'     => array( 'administrator', 'editor' ),
			'read_private_posts'     => array( 'administrator', 'editor' ),
			'delete_private_pages'   => array( 'administrator', 'editor' ),
			'edit_private_pages'     => array( 'administrator', 'editor' ),
			'read_private_pages'     => array( 'administrator', 'editor' ),

			'edit_published_posts'   => array( 'administrator', 'editor', 'author' ),
			'upload_files'           => array( 'administrator', 'editor', 'author' ),
			'publish_posts'          => array( 'administrator', 'editor', 'author' ),
			'delete_published_posts' => array( 'administrator', 'editor', 'author' ),

			'edit_posts'             => array( 'administrator', 'editor', 'author', 'contributor' ),
			'delete_posts'           => array( 'administrator', 'editor', 'author', 'contributor' ),

			'read'                   => array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ),

			'level_10'               => array( 'administrator' ),
			'level_9'                => array( 'administrator' ),
			'level_8'                => array( 'administrator' ),
			'level_7'                => array( 'administrator', 'editor' ),
			'level_6'                => array( 'administrator', 'editor' ),
			'level_5'                => array( 'administrator', 'editor' ),
			'level_4'                => array( 'administrator', 'editor' ),
			'level_3'                => array( 'administrator', 'editor' ),
			'level_2'                => array( 'administrator', 'editor', 'author' ),
			'level_1'                => array( 'administrator', 'editor', 'author', 'contributor' ),
			'level_0'                => array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ),

			'administrator'          => array( 'administrator' ),
			'editor'                 => array( 'editor' ),
			'author'                 => array( 'author' ),
			'contributor'            => array( 'contributor' ),
			'subscriber'             => array( 'subscriber' ),

		);

	}

	final private function _getMultiSitePrimitiveCaps() {
		return array(

			'unfiltered_html'        => array(),

			'activate_plugins'       => array(),
			'create_users'           => array(),
			'delete_plugins'         => array(),
			'delete_themes'          => array(),
			'delete_users'           => array(),
			'edit_files'             => array(),
			'edit_plugins'           => array(),
			'edit_themes'            => array(),
			'edit_users'             => array(),
			'install_plugins'        => array(),
			'install_themes'         => array(),
			'update_core'            => array(),
			'update_plugins'         => array(),
			'update_themes'          => array(),

			'edit_theme_options'     => array( 'administrator' ),
			'export'                 => array( 'administrator' ),
			'import'                 => array( 'administrator' ),
			'list_users'             => array( 'administrator' ),
			'manage_options'         => array( 'administrator' ),
			'promote_users'          => array( 'administrator' ),
			'remove_users'           => array( 'administrator' ),
			'switch_themes'          => array( 'administrator' ),
			'edit_dashboard'         => array( 'administrator' ),

			'moderate_comments'      => array( 'administrator', 'editor' ),
			'manage_categories'      => array( 'administrator', 'editor' ),
			'edit_others_posts'      => array( 'administrator', 'editor' ),
			'edit_pages'             => array( 'administrator', 'editor' ),
			'edit_others_pages'      => array( 'administrator', 'editor' ),
			'edit_published_pages'   => array( 'administrator', 'editor' ),
			'publish_pages'          => array( 'administrator', 'editor' ),
			'delete_pages'           => array( 'administrator', 'editor' ),
			'delete_others_pages'    => array( 'administrator', 'editor' ),
			'delete_published_pages' => array( 'administrator', 'editor' ),
			'delete_others_posts'    => array( 'administrator', 'editor' ),
			'delete_private_posts'   => array( 'administrator', 'editor' ),
			'edit_private_posts'     => array( 'administrator', 'editor' ),
			'read_private_posts'     => array( 'administrator', 'editor' ),
			'delete_private_pages'   => array( 'administrator', 'editor' ),
			'edit_private_pages'     => array( 'administrator', 'editor' ),
			'read_private_pages'     => array( 'administrator', 'editor' ),

			'edit_published_posts'   => array( 'administrator', 'editor', 'author' ),
			'upload_files'           => array( 'administrator', 'editor', 'author' ),
			'publish_posts'          => array( 'administrator', 'editor', 'author' ),
			'delete_published_posts' => array( 'administrator', 'editor', 'author' ),

			'edit_posts'             => array( 'administrator', 'editor', 'author', 'contributor' ),
			'delete_posts'           => array( 'administrator', 'editor', 'author', 'contributor' ),

			'read'                   => array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ),

			'level_10'               => array( 'administrator' ),
			'level_9'                => array( 'administrator' ),
			'level_8'                => array( 'administrator' ),
			'level_7'                => array( 'administrator', 'editor' ),
			'level_6'                => array( 'administrator', 'editor' ),
			'level_5'                => array( 'administrator', 'editor' ),
			'level_4'                => array( 'administrator', 'editor' ),
			'level_3'                => array( 'administrator', 'editor' ),
			'level_2'                => array( 'administrator', 'editor', 'author' ),
			'level_1'                => array( 'administrator', 'editor', 'author', 'contributor' ),
			'level_0'                => array( 'administrator', 'editor', 'author', 'contributor', 'subscriber' ),

			'administrator'          => array( 'administrator' ),
			'editor'                 => array( 'editor' ),
			'author'                 => array( 'author' ),
			'contributor'            => array( 'contributor' ),
			'subscriber'             => array( 'subscriber' ),

		);

	}

	final private function _getSingleSiteMetaCaps() {
		return array(
			'create_sites'           => array(),
			'delete_sites'           => array(),
			'manage_network'         => array(),
			'manage_sites'           => array(),
			'manage_network_users'   => array(),
			'manage_network_plugins' => array(),
			'manage_network_themes'  => array(),
			'manage_network_options' => array(),
			'delete_site'            => array(),

			'upload_plugins'         => array( 'administrator' ),
			'upload_themes'          => array( 'administrator' ),
			'customize'              => array( 'administrator' ),
			'add_users'              => array( 'administrator' ),

			'edit_categories'        => array( 'administrator', 'editor' ),
			'delete_categories'      => array( 'administrator', 'editor' ),
			'manage_post_tags'       => array( 'administrator', 'editor' ),
			'edit_post_tags'         => array( 'administrator', 'editor' ),
			'delete_post_tags'       => array( 'administrator', 'editor' ),
			'edit_css'               => array( 'administrator', 'editor' ),

			'assign_categories'      => array( 'administrator', 'editor', 'author', 'contributor' ),
			'assign_post_tags'       => array( 'administrator', 'editor', 'author', 'contributor' ),
		);
	}

	final private function _getMultiSiteMetaCaps() {
		return array(
			'create_sites'           => array(),
			'delete_sites'           => array(),
			'manage_network'         => array(),
			'manage_sites'           => array(),
			'manage_network_users'   => array(),
			'manage_network_plugins' => array(),
			'manage_network_themes'  => array(),
			'manage_network_options' => array(),
			'upload_plugins'         => array(),
			'upload_themes'          => array(),
			'edit_css'               => array(),

			'customize'              => array( 'administrator' ),
			'delete_site'            => array( 'administrator' ),
			'add_users'              => array( 'administrator' ),

			'edit_categories'        => array( 'administrator', 'editor' ),
			'delete_categories'      => array( 'administrator', 'editor' ),
			'manage_post_tags'       => array( 'administrator', 'editor' ),
			'edit_post_tags'         => array( 'administrator', 'editor' ),
			'delete_post_tags'       => array( 'administrator', 'editor' ),

			'assign_categories'      => array( 'administrator', 'editor', 'author', 'contributor' ),
			'assign_post_tags'       => array( 'administrator', 'editor', 'author', 'contributor' ),
		);
	}

	protected function getAllCapsAndRoles() {
		return $this->getPrimitiveCapsAndRoles() + $this->getMetaCapsAndRoles();
	}

	protected function getPrimitiveCapsAndRoles() {
		if ( is_multisite() ) {
			return $this->_getMultiSitePrimitiveCaps();
		} else {
			return $this->_getSingleSitePrimitiveCaps();
		}
	}

	protected function getMetaCapsAndRoles() {
		if ( is_multisite() ) {
			return $this->_getMultiSiteMetaCaps();
		} else {
			return $this->_getSingleSiteMetaCaps();
		}
	}

	// test the tests
	function test_single_and_multisite_cap_tests_match() {
		$single_primitive = array_keys( $this->_getSingleSitePrimitiveCaps() );
		$multi_primitive  = array_keys( $this->_getMultiSitePrimitiveCaps() );
		sort( $single_primitive );
		sort( $multi_primitive );
		$this->assertEquals( $single_primitive, $multi_primitive );

		$single_meta = array_keys( $this->_getSingleSiteMetaCaps() );
		$multi_meta  = array_keys( $this->_getMultiSiteMetaCaps() );
		sort( $single_meta );
		sort( $multi_meta );
		$this->assertEquals( $single_meta, $multi_meta );
	}

	// test the tests
	function test_all_caps_of_users_are_being_tested() {
		$caps = $this->getPrimitiveCapsAndRoles();

		// `manage_links` is a special case
		$this->assertSame( '0', get_option( 'link_manager_enabled' ) );
		// `unfiltered_upload` is a special case
		$this->assertFalse( defined( 'ALLOW_UNFILTERED_UPLOADS' ) );

		foreach ( self::$users as $role => $user ) {

			// make sure the user is valid
			$this->assertTrue( $user->exists(), "User with {$role} role does not exist" );

			$user_caps = $user->allcaps;

			unset(
				// `manage_links` is a special case
				$user_caps['manage_links'],
				// `unfiltered_upload` is a special case
				$user_caps['unfiltered_upload']
			);

			$diff = array_diff( array_keys( $user_caps ), array_keys( $caps ) );

			$this->assertEquals( array(), $diff, "User with {$role} role has capabilities that aren't being tested" );

		}

	}

	/**
	 * Test the tests. The administrator role has all primitive capabilities, therefore the
	 * primitive capabilitity tests can be tested by checking that the list of tested
	 * capabilities matches those of the administrator role.
	 *
	 * @group capTestTests
	 */
	public function testPrimitiveCapsTestsAreCorrect() {
		$actual   = $this->getPrimitiveCapsAndRoles();
		$admin    = get_role( 'administrator' );
		$expected = $admin->capabilities;

		unset(
			// Role names as capabilities are a special case:
			$actual['administrator'],
			$actual['editor'],
			$actual['author'],
			$actual['subscriber'],
			$actual['contributor']
		);

		unset(
			// `manage_links` is a special case in the caps tests:
			$expected['manage_links'],
			// `unfiltered_upload` is a special case in the caps tests:
			$expected['unfiltered_upload']
		);

		$expected = array_keys( $expected );
		$actual   = array_keys( $actual );

		$missing_primitive_cap_checks = array_diff( $expected, $actual );
		$this->assertSame( array(), $missing_primitive_cap_checks, 'These primitive capabilities are not tested' );

		$incorrect_primitive_cap_checks = array_diff( $actual, $expected );
		$this->assertSame( array(), $incorrect_primitive_cap_checks, 'These capabilities are not primitive' );
	}

	/**
	 * Test the tests. All meta capabilities should have a condition in the `map_meta_cap()`
	 * function that handles the capability.
	 *
	 * @group capTestTests
	 */
	public function testMetaCapsTestsAreCorrect() {
		$actual = $this->getMetaCapsAndRoles();
		$file   = file_get_contents( ABSPATH . WPINC . '/capabilities.php' );

		$matched = preg_match( '/^function map_meta_cap\((.*?)^\}/ms', $file, $function );
		$this->assertSame( 1, $matched );
		$this->assertNotEmpty( $function );

		$matched = preg_match_all( '/^[\t]case \'([^\']+)/m', $function[0], $cases );
		$this->assertNotEmpty( $matched );
		$this->assertNotEmpty( $cases );

		$expected = array_flip( $cases[1] );

		unset(
			// These primitive capabilities have a 'case' in `map_meta_cap()` but aren't meta capabilities:
			$expected['unfiltered_upload'],
			$expected['unfiltered_html'],
			$expected['edit_files'],
			$expected['edit_plugins'],
			$expected['edit_themes'],
			$expected['update_plugins'],
			$expected['delete_plugins'],
			$expected['install_plugins'],
			$expected['update_themes'],
			$expected['delete_themes'],
			$expected['install_themes'],
			$expected['update_core'],
			$expected['activate_plugins'],
			$expected['edit_users'],
			$expected['delete_users'],
			$expected['create_users'],
			$expected['manage_links'],
			// Singular object meta capabilities (where an object ID is passed) are not tested:
			$expected['remove_user'],
			$expected['promote_user'],
			$expected['edit_user'],
			$expected['delete_post'],
			$expected['delete_page'],
			$expected['edit_post'],
			$expected['edit_page'],
			$expected['read_post'],
			$expected['read_page'],
			$expected['publish_post'],
			$expected['edit_post_meta'],
			$expected['delete_post_meta'],
			$expected['add_post_meta'],
			$expected['edit_comment'],
			$expected['edit_comment_meta'],
			$expected['delete_comment_meta'],
			$expected['add_comment_meta'],
			$expected['edit_term'],
			$expected['delete_term'],
			$expected['assign_term'],
			$expected['edit_term_meta'],
			$expected['delete_term_meta'],
			$expected['add_term_meta'],
			$expected['delete_user'],
			$expected['edit_user_meta'],
			$expected['delete_user_meta'],
			$expected['add_user_meta']
		);

		$expected = array_keys( $expected );
		$actual   = array_keys( $actual );

		$missing_meta_cap_checks = array_diff( $expected, $actual );
		$this->assertSame( array(), $missing_meta_cap_checks, 'These meta capabilities are not tested' );

		$incorrect_meta_cap_checks = array_diff( $actual, $expected );
		$this->assertSame( array(), $incorrect_meta_cap_checks, 'These capabilities are not meta' );
	}

	// test the default roles and caps
	function test_all_roles_and_caps() {
		$caps = $this->getAllCapsAndRoles();

		foreach ( self::$users as $role => $user ) {

			// make sure the user is valid
			$this->assertTrue( $user->exists(), "User with {$role} role does not exist" );

			// make sure the role name is correct
			$this->assertEquals( array( $role ), $user->roles, "User should only have the {$role} role" );

			foreach ( $caps as $cap => $roles ) {
				if ( in_array( $role, $roles, true ) ) {
					$this->assertTrue( $user->has_cap( $cap ), "User with the {$role} role should have the {$cap} capability" );
					$this->assertTrue( user_can( $user, $cap ), "User with the {$role} role should have the {$cap} capability" );
				} else {
					$this->assertFalse( $user->has_cap( $cap ), "User with the {$role} role should not have the {$cap} capability" );
					$this->assertFalse( user_can( $user, $cap ), "User with the {$role} role should not have the {$cap} capability" );
				}
			}

		}

		$this->assertFalse( $user->has_cap( 'start_a_fire' ), "User with the {$role} role should not have a custom capability" );
		$this->assertFalse( user_can( $user, 'start_a_fire' ), "User with the {$role} role should not have a custom capability" );

		$this->assertFalse( $user->has_cap( 'do_not_allow' ), "User with the {$role} role should not have the do_not_allow capability" );
		$this->assertFalse( user_can( $user, 'do_not_allow' ), "User with the {$role} role should not have the do_not_allow capability" );

		$this->assertTrue( $user->has_cap( 'exist' ), "User with the {$role} role should have the exist capability" );
		$this->assertTrue( user_can( $user, 'exist' ), "User with the {$role} role should have the exist capability" );
	}

	// special case for the link manager
	function test_link_manager_caps() {
		$caps = array(
			'manage_links' => array( 'administrator', 'editor' ),
		);

		$this->assertSame( '0', get_option( 'link_manager_enabled' ) );

		// no-one should have access to the link manager by default
		foreach ( self::$users as $role => $user ) {
			foreach ( $caps as $cap => $roles ) {
				$this->assertFalse( $user->has_cap( $cap ), "User with the {$role} role should not have the {$cap} capability" );
				$this->assertFalse( user_can( $user, $cap ), "User with the {$role} role should not have the {$cap} capability" );
			}
		}

		update_option( 'link_manager_enabled', '1' );
		$this->assertSame( '1', get_option( 'link_manager_enabled' ) );

		foreach ( self::$users as $role => $user ) {
			foreach ( $caps as $cap => $roles ) {
				if ( in_array( $role, $roles, true ) ) {
					$this->assertTrue( $user->has_cap( $cap ), "User with the {$role} role should have the {$cap} capability" );
					$this->assertTrue( user_can( $user, $cap ), "User with the {$role} role should have the {$cap} capability" );
				} else {
					$this->assertFalse( $user->has_cap( $cap ), "User with the {$role} role should not have the {$cap} capability" );
					$this->assertFalse( user_can( $user, $cap ), "User with the {$role} role should not have the {$cap} capability" );
				}
			}
		}

		update_option( 'link_manager_enabled', '0' );
		$this->assertSame( '0', get_option( 'link_manager_enabled' ) );

	}

	// special case for unfiltered uploads
	function test_unfiltered_upload_caps() {
		$this->assertFalse( defined( 'ALLOW_UNFILTERED_UPLOADS' ) );

		// no-one should have this cap
		foreach ( self::$users as $role => $user ) {
			$this->assertFalse( $user->has_cap( 'unfiltered_upload' ), "User with the {$role} role should not have the unfiltered_upload capability" );
			$this->assertFalse( user_can( $user, 'unfiltered_upload' ), "User with the {$role} role should not have the unfiltered_upload capability" );
		}

	}

	/**
	 * @dataProvider data_user_with_role_can_edit_own_post
	 *
	 * @param  string $role              User role name
	 * @param  bool   $can_edit_own_post Can users with this role edit their own posts?
	 */
	public function test_user_can_edit_comment_on_own_post( $role, $can_edit_own_post ) {
		$owner   = self::$users[ $role ];
		$post    = self::factory()->post->create_and_get( array(
			'post_author' => $owner->ID,
		) );
		$comment = self::factory()->comment->create_and_get( array(
			'comment_post_ID' => $post->ID,
		) );

		$owner_can_edit = user_can( $owner->ID, 'edit_comment', $comment->comment_ID );
		$this->assertSame( $can_edit_own_post, $owner_can_edit );
	}

	/**
	 * @dataProvider data_user_with_role_can_edit_others_posts
	 *
	 * @param  string $role                 User role name
	 * @param  bool   $can_edit_others_post Can users with this role edit others' posts?
	 */
	public function test_user_can_edit_comment_on_others_post( $role, $can_edit_others_post ) {
		$user    = self::$users[ $role ];
		$owner   = self::factory()->user->create_and_get( array(
			'role' => 'editor',
		) );
		$post    = self::factory()->post->create_and_get( array(
			'post_author' => $owner->ID,
		) );
		$comment = self::factory()->comment->create_and_get( array(
			'comment_post_ID' => $post->ID,
		) );

		$user_can_edit = user_can( $user->ID, 'edit_comment', $comment->comment_ID );
		$this->assertSame( $can_edit_others_post, $user_can_edit );
	}

	public function data_user_with_role_can_edit_own_post() {
		$data  = array();
		$caps  = $this->getPrimitiveCapsAndRoles();

		foreach ( self::$users as $role => $null ) {
			$data[] = array(
				$role,
				in_array( $role, $caps['edit_published_posts'], true ),
			);
		}

		return $data;
	}

	public function data_user_with_role_can_edit_others_posts() {
		$data  = array();
		$caps  = $this->getPrimitiveCapsAndRoles();

		foreach ( self::$users as $role => $null ) {
			$data[] = array(
				$role,
				in_array( $role, $caps['edit_others_posts'], true ),
			);
		}

		return $data;
	}

	function test_super_admin_caps() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}
		$caps = $this->getAllCapsAndRoles();
		$user = self::$super_admin;

		$this->assertTrue( is_super_admin( $user->ID ) );

		foreach ( $caps as $cap => $roles ) {
			$this->assertTrue( $user->has_cap( $cap ), "Super Admins should have the {$cap} capability" );
			$this->assertTrue( user_can( $user, $cap ), "Super Admins should have the {$cap} capability" );
		}

		$this->assertTrue( $user->has_cap( 'start_a_fire' ), "Super admins should have all custom capabilities" );
		$this->assertTrue( user_can( $user, 'start_a_fire' ), "Super admins should have all custom capabilities" );

		$this->assertFalse( $user->has_cap( 'do_not_allow' ), 'Super Admins should not have the do_not_allow capability' );
		$this->assertFalse( user_can( $user, 'do_not_allow' ), 'Super Admins should not have the do_not_allow capability' );

		$this->assertFalse( defined( 'ALLOW_UNFILTERED_UPLOADS' ) );
		$this->assertFalse( $user->has_cap( 'unfiltered_upload' ), 'Super Admins should not have the unfiltered_upload capability' );
		$this->assertFalse( user_can( $user, 'unfiltered_upload' ), 'Super Admins should not have the unfiltered_upload capability' );
	}

	// a role that doesn't exist
	function test_bogus_role() {
		$user = self::factory()->user->create_and_get( array( 'role' => 'invalid_role' ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array(), $user->roles, "User should not have any roles" );

		$caps = $this->getAllCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			$this->assertFalse( $user->has_cap( $cap ), "User with an invalid role should not have the {$cap} capability" );
			$this->assertFalse( user_can( $user, $cap ), "User with an invalid role should not have the {$cap} capability" );
		}
	}

	// a user with multiple roles
	function test_user_subscriber_contributor() {
		$user = self::$users['subscriber'];

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		$user->add_role( 'contributor' );

		// user should have two roles now
		$this->assertEquals( array( 'subscriber', 'contributor' ), $user->roles );

		$caps = $this->getAllCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			if ( array_intersect( $user->roles, $roles ) ) {
				$this->assertTrue( $user->has_cap( $cap ), "User should have the {$cap} capability" );
				$this->assertTrue( user_can( $user, $cap ), "User should have the {$cap} capability" );
			} else {
				$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
				$this->assertFalse( user_can( $user, $cap ), "User should not have the {$cap} capability" );
			}
		}

		$user->remove_role( 'contributor' );
		// user should have one role now
		$this->assertEquals( array( 'subscriber' ), $user->roles );

	}

	// newly added empty role
	function test_add_empty_role() {
		global $wp_roles;

		$role_name = 'janitor';
		add_role( $role_name, 'Janitor', array() );

		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role( $role_name ) );

		$user = self::factory()->user->create_and_get( array( 'role' => $role_name ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array( $role_name ), $user->roles );

		$caps = $this->getAllCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
			$this->assertFalse( user_can( $user, $cap ), "User should not have the {$cap} capability" );
		}

		// clean up
		remove_role( $role_name );
		$this->_flush_roles();
		$this->assertFalse( $wp_roles->is_role( $role_name ) );
	}

	// newly added role
	function test_add_role() {
		global $wp_roles;

		$role_name = 'janitor';
		$expected_caps = array(
			'edit_posts' => true,
			'edit_pages' => true,
			'level_0'    => true,
			'level_1'    => true,
			'level_2'    => true,
		);
		add_role( $role_name, 'Janitor', $expected_caps );
		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role( $role_name ) );

		$user = self::factory()->user->create_and_get( array( 'role' => $role_name ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array( $role_name ), $user->roles );

		$caps = $this->getPrimitiveCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			// the user should have all the above caps
			if ( isset( $expected_caps[ $cap ] ) ) {
				$this->assertTrue( $user->has_cap( $cap ), "User should have the {$cap} capability" );
				$this->assertTrue( user_can( $user, $cap ), "User should have the {$cap} capability" );
			} else {
				$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
				$this->assertFalse( user_can( $user, $cap ), "User should not have the {$cap} capability" );
			}
		}

		// clean up
		remove_role( $role_name );
		$this->_flush_roles();
		$this->assertFalse( $wp_roles->is_role( $role_name ) );
	}

	function test_role_add_cap() {
		// change the capabilites associated with a role and make sure the change is reflected in has_cap()

		global $wp_roles;
		$role_name = 'janitor';
		add_role( $role_name, 'Janitor', array('level_1'=>true) );
		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role($role_name) );

		// assign a user to that role
		$id = self::factory()->user->create( array( 'role' => $role_name ) );

		// now add a cap to the role
		$wp_roles->add_cap($role_name, 'sweep_floor');
		$this->_flush_roles();

		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");
		$this->assertEquals(array($role_name), $user->roles);

		// the user should have all the above caps
		$this->assertTrue($user->has_cap($role_name));
		$this->assertTrue($user->has_cap('level_1'));
		$this->assertTrue($user->has_cap('sweep_floor'));

		// shouldn't have any other caps
		$caps = $this->getAllCapsAndRoles();
		foreach ( $caps as $cap => $roles ) {
			if ( 'level_1' !== $cap ) {
				$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
			}
		}

		// clean up
		remove_role($role_name);
		$this->_flush_roles();
		$this->assertFalse($wp_roles->is_role($role_name));

	}

	function test_role_remove_cap() {
		// change the capabilites associated with a role and make sure the change is reflected in has_cap()

		global $wp_roles;
		$role_name = 'janitor';
		add_role( $role_name, 'Janitor', array('level_1'=>true, 'sweep_floor'=>true, 'polish_doorknobs'=>true) );
		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role($role_name) );

		// assign a user to that role
		$id = self::factory()->user->create( array( 'role' => $role_name ) );

		// now remove a cap from the role
		$wp_roles->remove_cap($role_name, 'polish_doorknobs');
		$this->_flush_roles();

		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");
		$this->assertEquals(array($role_name), $user->roles);

		// the user should have all the above caps
		$this->assertTrue($user->has_cap($role_name));
		$this->assertTrue($user->has_cap('level_1'));
		$this->assertTrue($user->has_cap('sweep_floor'));

		// shouldn't have the removed cap
		$this->assertFalse($user->has_cap('polish_doorknobs'));

		// clean up
		remove_role($role_name);
		$this->_flush_roles();
		$this->assertFalse($wp_roles->is_role($role_name));

	}

	function test_user_add_cap() {
		// add an extra capability to a user

		// there are two contributors
		$id_1 = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$id_2 = self::factory()->user->create( array( 'role' => 'contributor' ) );

		// user 1 has an extra capability
		$user_1 = new WP_User($id_1);
		$this->assertTrue($user_1->exists(), "Problem getting user $id_1");
		$user_1->add_cap('publish_posts');

		// re-fetch both users from the db
		$user_1 = new WP_User($id_1);
		$this->assertTrue($user_1->exists(), "Problem getting user $id_1");
		$user_2 = new WP_User($id_2);
		$this->assertTrue($user_2->exists(), "Problem getting user $id_2");

		// make sure they're both still contributors
		$this->assertEquals(array('contributor'), $user_1->roles);
		$this->assertEquals(array('contributor'), $user_2->roles);

		// check the extra cap on both users
		$this->assertTrue($user_1->has_cap('publish_posts'));
		$this->assertFalse($user_2->has_cap('publish_posts'));

		// make sure the other caps didn't get messed up
		$caps = $this->getAllCapsAndRoles();
		foreach ( $caps as $cap => $roles ) {
			if ( in_array( 'contributor', $roles, true ) || 'publish_posts' === $cap ) {
				$this->assertTrue( $user_1->has_cap( $cap ), "User should have the {$cap} capability" );
			} else {
				$this->assertFalse( $user_1->has_cap( $cap ), "User should not have the {$cap} capability" );
			}
		}

	}

	function test_user_remove_cap() {
		// add an extra capability to a user then remove it

		// there are two contributors
		$id_1 = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$id_2 = self::factory()->user->create( array( 'role' => 'contributor' ) );

		// user 1 has an extra capability
		$user_1 = new WP_User($id_1);
		$this->assertTrue($user_1->exists(), "Problem getting user $id_1");
		$user_1->add_cap('publish_posts');

		// now remove the extra cap
		$user_1->remove_cap('publish_posts');

		// re-fetch both users from the db
		$user_1 = new WP_User($id_1);
		$this->assertTrue($user_1->exists(), "Problem getting user $id_1");
		$user_2 = new WP_User($id_2);
		$this->assertTrue($user_2->exists(), "Problem getting user $id_2");

		// make sure they're both still contributors
		$this->assertEquals(array('contributor'), $user_1->roles);
		$this->assertEquals(array('contributor'), $user_2->roles);

		// check the removed cap on both users
		$this->assertFalse($user_1->has_cap('publish_posts'));
		$this->assertFalse($user_2->has_cap('publish_posts'));

	}

	function test_user_level_update() {
		// make sure the user_level is correctly set and changed with the user's role

		// user starts as an author
		$id = self::factory()->user->create( array( 'role' => 'author' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// author = user level 2
		$this->assertEquals( 2, $user->user_level );

		// they get promoted to editor - level should get bumped to 7
		$user->set_role('editor');
		$this->assertEquals( 7, $user->user_level );

		// demoted to contributor - level is reduced to 1
		$user->set_role('contributor');
		$this->assertEquals( 1, $user->user_level );

		// if they have two roles, user_level should be the max of the two
		$user->add_role('editor');
		$this->assertEquals(array('contributor', 'editor'), $user->roles);
		$this->assertEquals( 7, $user->user_level );
	}

	function test_user_remove_all_caps() {
		// user starts as an author
		$id = self::factory()->user->create( array( 'role' => 'author' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// add some extra capabilities
		$user->add_cap('make_coffee');
		$user->add_cap('drink_coffee');

		// re-fetch
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		$this->assertTrue($user->has_cap('make_coffee'));
		$this->assertTrue($user->has_cap('drink_coffee'));

		// all caps are removed
		$user->remove_all_caps();

		// re-fetch
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// all capabilities for the user should be gone
		foreach ( $this->getAllCapsAndRoles() as $cap => $roles ) {
			$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
		}

		// the extra capabilities should be gone
		$this->assertFalse($user->has_cap('make_coffee'));
		$this->assertFalse($user->has_cap('drink_coffee'));

		// user level should be empty
		$this->assertEmpty( $user->user_level );


	}

	function test_post_meta_caps() {
		// simple tests for some common meta capabilities

		// Get our author
		$author = self::$users['author'];

		// make a post
		$post = self::factory()->post->create( array( 'post_author' => $author->ID, 'post_type' => 'post' ) );

		// the author of the post
		$this->assertTrue($author->exists(), "Problem getting user $author->ID");

		// add some other users
		$admin = new WP_User( self::factory()->user->create( array( 'role' => 'administrator' ) ) );
		$author_2 = new WP_User( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$editor = new WP_User( self::factory()->user->create( array( 'role' => 'editor' ) ) );
		$contributor = new WP_User( self::factory()->user->create( array( 'role' => 'contributor' ) ) );

		// administrators, editors and the post owner can edit it
		$this->assertTrue($admin->has_cap('edit_post', $post));
		$this->assertTrue($author->has_cap('edit_post', $post));
		$this->assertTrue($editor->has_cap('edit_post', $post));
		// other authors and contributors can't
		$this->assertFalse($author_2->has_cap('edit_post', $post));
		$this->assertFalse($contributor->has_cap('edit_post', $post));

		// administrators, editors and the post owner can delete it
		$this->assertTrue($admin->has_cap('delete_post', $post));
		$this->assertTrue($author->has_cap('delete_post', $post));
		$this->assertTrue($editor->has_cap('delete_post', $post));
		// other authors and contributors can't
		$this->assertFalse($author_2->has_cap('delete_post', $post));
		$this->assertFalse($contributor->has_cap('delete_post', $post));

		// administrators, editors, and authors can publish it
		$this->assertTrue($admin->has_cap('publish_post', $post));
		$this->assertTrue($author->has_cap('publish_post', $post));
		$this->assertTrue($editor->has_cap('publish_post', $post));
		$this->assertTrue($author_2->has_cap('publish_post', $post));
		// contributors can't
		$this->assertFalse($contributor->has_cap('publish_post', $post));

		register_post_type( 'something', array( 'capabilities' => array( 'edit_posts' => 'draw_somethings' ) ) );
		$something = get_post_type_object( 'something' );
		$this->assertEquals( 'draw_somethings', $something->cap->edit_posts );
		$this->assertEquals( 'draw_somethings', $something->cap->create_posts );

		register_post_type( 'something', array( 'capabilities' =>
						array( 'edit_posts' => 'draw_somethings', 'create_posts' => 'create_somethings' ) ) );
		$something = get_post_type_object( 'something' );
		$this->assertEquals( 'draw_somethings', $something->cap->edit_posts );
		$this->assertEquals( 'create_somethings', $something->cap->create_posts );
		_unregister_post_type( 'something' );

		// Test meta authorization callbacks
		if ( function_exists( 'register_meta') ) {
			$this->assertTrue( $admin->has_cap('edit_post_meta',  $post) );
			$this->assertTrue( $admin->has_cap('add_post_meta',  $post) );
			$this->assertTrue( $admin->has_cap('delete_post_meta',  $post) );

			$this->assertFalse( $admin->has_cap('edit_post_meta', $post, '_protected') );
			$this->assertFalse( $admin->has_cap('add_post_meta', $post, '_protected') );
			$this->assertFalse( $admin->has_cap('delete_post_meta', $post, '_protected') );

			register_meta( 'post', '_protected', array( $this, '_meta_filter' ), array( $this, '_meta_yes_you_can' ) );
			$this->assertTrue( $admin->has_cap('edit_post_meta',  $post, '_protected') );
			$this->assertTrue( $admin->has_cap('add_post_meta',  $post, '_protected') );
			$this->assertTrue( $admin->has_cap('delete_post_meta',  $post, '_protected') );

			$this->assertTrue( $admin->has_cap('edit_post_meta', $post, 'not_protected') );
			$this->assertTrue( $admin->has_cap('add_post_meta', $post, 'not_protected') );
			$this->assertTrue( $admin->has_cap('delete_post_meta', $post, 'not_protected') );

			register_meta( 'post', 'not_protected', array( $this, '_meta_filter' ), array( $this, '_meta_no_you_cant' ) );
			$this->assertFalse( $admin->has_cap('edit_post_meta',  $post, 'not_protected') );
			$this->assertFalse( $admin->has_cap('add_post_meta',  $post, 'not_protected') );
			$this->assertFalse( $admin->has_cap('delete_post_meta',  $post, 'not_protected') );
		}
	}

	function authorless_post_statuses() {
		return array( array( 'draft' ), array( 'private' ), array( 'publish' ) );
	}

	/**
	 * @ticket 27020
	 * @dataProvider authorless_post_statuses
	 */
	function test_authorless_post( $status ) {
		// Make a post without an author
		$post = self::factory()->post->create( array( 'post_author' => 0, 'post_type' => 'post', 'post_status' => $status ) );

		// Add an editor and contributor
		$editor = self::$users['editor'];
		$contributor = self::$users['contributor'];

		// editor can publish, edit, view, and trash
		$this->assertTrue( $editor->has_cap( 'publish_post', $post ) );
		$this->assertTrue( $editor->has_cap( 'edit_post', $post ) );
		$this->assertTrue( $editor->has_cap( 'delete_post', $post ) );
		$this->assertTrue( $editor->has_cap( 'read_post', $post ) );

		// a contributor cannot (except read a published post)
		$this->assertFalse( $contributor->has_cap( 'publish_post', $post ) );
		$this->assertFalse( $contributor->has_cap( 'edit_post', $post ) );
		$this->assertFalse( $contributor->has_cap( 'delete_post', $post ) );
		$this->assertEquals( $status === 'publish', $contributor->has_cap( 'read_post', $post ) );
	}

	/**
	 * @ticket 16714
	 */
	function test_create_posts_caps() {
		$admin       = self::$users['administrator'];
		$author      = self::$users['author'];
		$editor      = self::$users['editor'];
		$contributor = self::$users['contributor'];
		$subscriber  = self::$users['subscriber'];

		// create_posts isn't a real cap.
		$this->assertFalse($admin->has_cap('create_posts'));
		$this->assertFalse($author->has_cap('create_posts'));
		$this->assertFalse($editor->has_cap('create_posts'));
		$this->assertFalse($contributor->has_cap('create_posts'));
		$this->assertFalse($subscriber->has_cap('create_posts'));

		register_post_type( 'foobar' );
		$cap = get_post_type_object( 'foobar' )->cap;

		$this->assertEquals( 'edit_posts', $cap->create_posts );

		$this->assertTrue($admin->has_cap( $cap->create_posts ));
		$this->assertTrue($author->has_cap( $cap->create_posts ));
		$this->assertTrue($editor->has_cap( $cap->create_posts ));
		$this->assertTrue($contributor->has_cap( $cap->create_posts ));
		$this->assertFalse($subscriber->has_cap( $cap->create_posts ));

		_unregister_post_type( 'foobar' );

		// Primitive capability edit_foobars is not assigned to any users.
		register_post_type( 'foobar', array( 'capability_type' => array( 'foobar', 'foobars' ) ) );
		$cap = get_post_type_object( 'foobar' )->cap;

		$this->assertEquals( 'edit_foobars', $cap->create_posts );

		$this->assertFalse($admin->has_cap( $cap->create_posts ));
		$this->assertFalse($author->has_cap( $cap->create_posts ));
		$this->assertFalse($editor->has_cap( $cap->create_posts ));
		$this->assertFalse($contributor->has_cap( $cap->create_posts ));
		$this->assertFalse($subscriber->has_cap( $cap->create_posts ));

		// Add edit_foobars primitive cap to a user.
		$admin->add_cap( 'edit_foobars', true );
		$admin = new WP_User( $admin->ID );
		$this->assertTrue($admin->has_cap( $cap->create_posts ));
		$this->assertFalse($author->has_cap( $cap->create_posts ));
		$this->assertFalse($editor->has_cap( $cap->create_posts ));
		$this->assertFalse($contributor->has_cap( $cap->create_posts ));
		$this->assertFalse($subscriber->has_cap( $cap->create_posts ));

		$admin->remove_cap( 'edit_foobars' );

		_unregister_post_type( 'foobar' );

		$cap = get_post_type_object( 'attachment' )->cap;
		$this->assertEquals( 'upload_files', $cap->create_posts );
		$this->assertEquals( 'edit_posts', $cap->edit_posts );

		$this->assertTrue( $author->has_cap( $cap->create_posts ) );
		$this->assertTrue( $author->has_cap( $cap->edit_posts ) );
		$this->assertTrue( $contributor->has_cap( $cap->edit_posts ) );
		$this->assertFalse( $contributor->has_cap( $cap->create_posts ) );
		$this->assertFalse( $subscriber->has_cap( $cap->create_posts ) );
	}

	function test_page_meta_caps() {
		// simple tests for some common meta capabilities

		// Get our author
		$author = self::$users['author'];

		// make a page
		$page = self::factory()->post->create( array( 'post_author' => $author->ID, 'post_type' => 'page' ) );

		// the author of the page
		$this->assertTrue($author->exists(), "Problem getting user " . $author->ID);

		// add some other users
		$admin = self::$users['administrator'];
		$author_2 = new WP_User( self::factory()->user->create( array( 'role' => 'author' ) ) );
		$editor = self::$users['editor'];
		$contributor = self::$users['contributor'];

		// administrators, editors and the post owner can edit it
		$this->assertTrue($admin->has_cap('edit_page', $page));
		$this->assertTrue($editor->has_cap('edit_page', $page));
		// other authors and contributors can't
		$this->assertFalse($author->has_cap('edit_page', $page));
		$this->assertFalse($author_2->has_cap('edit_page', $page));
		$this->assertFalse($contributor->has_cap('edit_page', $page));

		// administrators, editors and the post owner can delete it
		$this->assertTrue($admin->has_cap('delete_page', $page));
		$this->assertTrue($editor->has_cap('delete_page', $page));
		// other authors and contributors can't
		$this->assertFalse($author->has_cap('delete_page', $page));
		$this->assertFalse($author_2->has_cap('delete_page', $page));
		$this->assertFalse($contributor->has_cap('delete_page', $page));
	}

	/**
	 * @dataProvider dataTaxonomies
	 *
	 * @ticket 35614
	 */
	public function test_taxonomy_capabilities_are_correct( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			register_taxonomy( $taxonomy, 'post' );
		}

		$tax  = get_taxonomy( $taxonomy );
		$user = self::$users['administrator'];

		// Primitive capabilities for all taxonomies should match this:
		$expected = array(
			'manage_terms' => 'manage_categories',
			'edit_terms'   => 'manage_categories',
			'delete_terms' => 'manage_categories',
			'assign_terms' => 'edit_posts',
		);

		foreach ( $expected as $meta_cap => $primitive_cap ) {
			$caps = map_meta_cap( $tax->cap->$meta_cap, $user->ID );
			$this->assertEquals( array(
				$primitive_cap,
			), $caps, "Meta cap: {$meta_cap}" );
		}
	}

	/**
	 * @dataProvider dataTaxonomies
	 *
	 * @ticket 35614
	 */
	public function test_default_taxonomy_term_cannot_be_deleted( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			register_taxonomy( $taxonomy, 'post' );
		}

		$tax  = get_taxonomy( $taxonomy );
		$user = self::$users['administrator'];
		$term = self::factory()->term->create_and_get( array(
			'taxonomy' => $taxonomy,
		) );

		update_option( "default_{$taxonomy}", $term->term_id );

		$this->assertTrue( user_can( $user->ID, $tax->cap->delete_terms ) );
		$this->assertFalse( user_can( $user->ID, 'delete_term', $term->term_id ) );
	}

	/**
	 * @dataProvider dataTaxonomies
	 *
	 * @ticket 35614
	 */
	public function test_taxonomy_caps_map_correctly_to_their_meta_cap( $taxonomy ) {
		if ( ! taxonomy_exists( $taxonomy ) ) {
			register_taxonomy( $taxonomy, 'post' );
		}

		$tax  = get_taxonomy( $taxonomy );
		$term = self::factory()->term->create_and_get( array(
			'taxonomy' => $taxonomy,
		) );

		foreach ( self::$users as $role => $user ) {
			$this->assertSame(
				user_can( $user->ID, 'edit_term', $term->term_id ),
				user_can( $user->ID, $tax->cap->edit_terms ),
				"Role: {$role}"
			);
			$this->assertSame(
				user_can( $user->ID, 'delete_term', $term->term_id ),
				user_can( $user->ID, $tax->cap->delete_terms ),
				"Role: {$role}"
			);
			$this->assertSame(
				user_can( $user->ID, 'assign_term', $term->term_id ),
				user_can( $user->ID, $tax->cap->assign_terms ),
				"Role: {$role}"
			);
		}

	}

	public function dataTaxonomies() {
		return array(
			array(
				'post_tag',
			),
			array(
				'category',
			),
			array(
				'standard_custom_taxo',
			),
		);
	}

	/**
	 * @ticket 35614
	 */
	public function test_taxonomy_capabilities_with_custom_caps_are_correct() {
		$expected = array(
			'manage_terms' => 'one',
			'edit_terms'   => 'two',
			'delete_terms' => 'three',
			'assign_terms' => 'four',
		);
		$taxonomy = 'custom_cap_taxo';
		register_taxonomy( $taxonomy, 'post', array(
			'capabilities' => $expected,
		) );

		$tax  = get_taxonomy( $taxonomy );
		$user = self::$users['administrator'];

		foreach ( $expected as $meta_cap => $primitive_cap ) {
			$caps = map_meta_cap( $tax->cap->$meta_cap, $user->ID );
			$this->assertEquals( array(
				$primitive_cap,
			), $caps, "Meta cap: {$meta_cap}" );
		}
	}

	/**
	 * @ticket 21786
	 */
	function test_negative_caps() {
		$author = self::$users['author'];

		$author->add_cap( 'foo', false );
		$this->assertTrue ( isset( $author->caps['foo'] ) );
		$this->assertFalse( user_can( $author->ID, 'foo' ) );

		$author->remove_cap( 'foo' );
		$this->assertFalse ( isset( $author->caps['foo'] ) );
		$this->assertFalse( user_can( $author->ID, 'foo' ) );
	}

	/**
	 * @ticket 18932
	 */
	function test_set_role_same_role() {
		$user = self::$users['administrator'];
		$caps = $user->caps;
		$this->assertNotEmpty( $user->caps );
		$user->set_role( 'administrator' );
		$this->assertNotEmpty( $user->caps );
		$this->assertEquals( $caps, $user->caps );
	}

	function test_current_user_can_for_blog() {
		global $wpdb;

		$user = self::$users['administrator'];
		$old_uid = get_current_user_id();
		wp_set_current_user( $user->ID );

		$this->assertTrue( current_user_can_for_blog( get_current_blog_id(), 'edit_posts' ) );
		$this->assertFalse( current_user_can_for_blog( get_current_blog_id(), 'foo_the_bar' ) );
		if ( ! is_multisite() ) {
			$this->assertTrue( current_user_can_for_blog( 12345, 'edit_posts' ) );
			return;
		}

		$suppress = $wpdb->suppress_errors();
		$this->assertFalse( current_user_can_for_blog( 12345, 'edit_posts' ) );
		$wpdb->suppress_errors( $suppress );

		$blog_id = self::factory()->blog->create( array( 'user_id' => $user->ID ) );
		$this->assertTrue( current_user_can_for_blog( $blog_id, 'edit_posts' ) );
		$this->assertFalse( current_user_can_for_blog( $blog_id, 'foo_the_bar' ) );

		wp_set_current_user( $old_uid );
	}

	function test_borked_current_user_can_for_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}

		$orig_blog_id = get_current_blog_id();
		$blog_id = self::factory()->blog->create();

		$this->_nullify_current_user();

		add_action( 'switch_blog', array( $this, '_nullify_current_user_and_keep_nullifying_user' ) );

		current_user_can_for_blog( $blog_id, 'edit_posts' );

		$this->assertEquals( $orig_blog_id, get_current_blog_id() );
	}

	function _nullify_current_user() {
		// Prevents fatal errors in ::tearDown()'s and other uses of restore_current_blog()
		$function_stack = wp_debug_backtrace_summary( null, 0, false );
		if ( in_array( 'restore_current_blog', $function_stack ) ) {
			return;
		}
		$GLOBALS['current_user'] = null;
	}

	function _nullify_current_user_and_keep_nullifying_user() {
		add_action( 'set_current_user', array( $this, '_nullify_current_user' ) );
	}

	/**
	 * @ticket 28374
	 */
	function test_current_user_edit_caps() {
		$user = self::$users['contributor'];
		wp_set_current_user( $user->ID );

		$user->add_cap( 'publish_posts' );
		$this->assertTrue( $user->has_cap( 'publish_posts' ) );

		$user->add_cap( 'publish_pages' );
		$this->assertTrue( $user->has_cap( 'publish_pages' ) );

		$user->remove_cap( 'publish_pages' );
		$this->assertFalse( $user->has_cap( 'publish_pages' ) );

		$user->remove_cap( 'publish_posts' );
		$this->assertFalse( $user->has_cap( 'publish_posts' ) );
	}

	function test_subscriber_cant_edit_posts() {
		$user = self::$users['subscriber'];
		wp_set_current_user( $user->ID );

		$post = self::factory()->post->create( array( 'post_author' => 1 ) );

		$this->assertFalse( current_user_can( 'edit_post', $post ) );
		$this->assertFalse( current_user_can( 'edit_post', $post + 1 ) );
	}

	function test_multisite_administrator_can_not_edit_users() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}

		$user = self::$users['administrator'];
		$other_user = self::$users['subscriber'];

		wp_set_current_user( $user->ID );

		$this->assertFalse( current_user_can( 'edit_user', $other_user->ID ) );
	}

	function test_user_can_edit_self() {
		foreach ( self::$users as $role => $user ) {
			wp_set_current_user( $user->ID );
			$this->assertTrue( current_user_can( 'edit_user', $user->ID ), "User with role {$role} should have the capability to edit their own profile" );
		}
	}

	public function test_only_admins_and_super_admins_can_remove_users() {
		if ( is_multisite() ) {
			$this->assertTrue( user_can( self::$super_admin->ID,        'remove_user', self::$users['subscriber']->ID ) );
		}

		$this->assertTrue( user_can( self::$users['administrator']->ID, 'remove_user', self::$users['subscriber']->ID ) );

		$this->assertFalse( user_can( self::$users['editor']->ID,       'remove_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['author']->ID,       'remove_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['contributor']->ID,  'remove_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['subscriber']->ID,   'remove_user', self::$users['subscriber']->ID ) );
	}

	public function test_only_super_admins_can_delete_users_on_multisite() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs on multisite' );
		}

		$this->assertTrue( user_can( self::$super_admin->ID,             'delete_user', self::$users['subscriber']->ID ) );

		$this->assertFalse( user_can( self::$users['administrator']->ID, 'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['editor']->ID,        'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['author']->ID,        'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['contributor']->ID,   'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['subscriber']->ID,    'delete_user', self::$users['subscriber']->ID ) );
	}

	public function test_only_admins_can_delete_users_on_single_site() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test does not run on multisite' );
		}

		$this->assertTrue( user_can( self::$users['administrator']->ID, 'delete_user', self::$users['subscriber']->ID ) );

		$this->assertFalse( user_can( self::$users['editor']->ID,       'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['author']->ID,       'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['contributor']->ID,  'delete_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['subscriber']->ID,   'delete_user', self::$users['subscriber']->ID ) );
	}

	public function test_only_admins_and_super_admins_can_promote_users() {
		if ( is_multisite() ) {
			$this->assertTrue( user_can( self::$super_admin->ID,              'promote_user', self::$users['subscriber']->ID ) );
		}

		$this->assertTrue( user_can( self::$users['administrator']->ID, 'promote_user', self::$users['subscriber']->ID ) );

		$this->assertFalse( user_can( self::$users['editor']->ID,       'promote_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['author']->ID,       'promote_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['contributor']->ID,  'promote_user', self::$users['subscriber']->ID ) );
		$this->assertFalse( user_can( self::$users['subscriber']->ID,   'promote_user', self::$users['subscriber']->ID ) );
	}

	/**
	 * @ticket 33694
	 */
	function test_contributor_cannot_edit_scheduled_post() {

		// Add a contributor
		$contributor = self::$users['contributor'];

		// Give them a scheduled post
		$post = $this->factory->post->create_and_get( array(
			'post_author' => $contributor->ID,
			'post_status' => 'future',
		) );

		// Ensure contributor can't edit or trash the post
		$this->assertFalse( user_can( $contributor->ID, 'edit_post', $post->ID ) );
		$this->assertFalse( user_can( $contributor->ID, 'delete_post', $post->ID ) );

		// Test the tests
		$this->assertTrue( defined( 'EMPTY_TRASH_DAYS' ) );
		$this->assertNotEmpty( EMPTY_TRASH_DAYS );

		// Trash it
		$trashed = wp_trash_post( $post->ID );
		$this->assertNotEmpty( $trashed );

		// Ensure contributor can't edit, un-trash, or delete the post
		$this->assertFalse( user_can( $contributor->ID, 'edit_post', $post->ID ) );
		$this->assertFalse( user_can( $contributor->ID, 'delete_post', $post->ID ) );

	}

	function test_multisite_administrator_with_manage_network_users_can_edit_users() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}

		$user = self::$users['administrator'];
		$user->add_cap( 'manage_network_users' );
		$other_user = self::$users['subscriber'];

		wp_set_current_user( $user->ID );

		$can_edit_user = current_user_can( 'edit_user', $other_user->ID );

		$user->remove_cap( 'manage_network_users' );

		$this->assertTrue( $can_edit_user );
	}

	function test_multisite_administrator_with_manage_network_users_can_not_edit_super_admin() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}

		$user = self::$users['administrator'];
		$user->add_cap( 'manage_network_users' );

		wp_set_current_user( $user->ID );

		$can_edit_user = current_user_can( 'edit_user', self::$super_admin->ID );

		$user->remove_cap( 'manage_network_users' );

		$this->assertFalse( $can_edit_user );
	}

	/**
	 * @ticket 16956
	 */
	function test_require_edit_others_posts_if_post_type_doesnt_exist() {
		register_post_type( 'existed' );
		$post_id = self::factory()->post->create( array( 'post_type' => 'existed' ) );
		_unregister_post_type( 'existed' );

		$subscriber_id = self::$users['subscriber']->ID;
		$editor_id = self::$users['editor']->ID;

		$this->setExpectedIncorrectUsage( 'map_meta_cap' );
		foreach ( array( 'delete_post', 'edit_post', 'read_post', 'publish_post' ) as $cap ) {
			wp_set_current_user( $subscriber_id );
			$this->assertSame( array( 'edit_others_posts' ), map_meta_cap( $cap, $subscriber_id, $post_id ) );
			$this->assertFalse( current_user_can( $cap, $post_id ) );

			wp_set_current_user( $editor_id );
			$this->assertSame( array( 'edit_others_posts' ), map_meta_cap( $cap, $editor_id, $post_id ) );
			$this->assertTrue( current_user_can( $cap, $post_id ) );
		}
	}

	/**
	 * @ticket 17253
	 */
	function test_cpt_with_page_capability_type() {

		register_post_type( 'page_capability', array(
			'capability_type' => 'page',
		) );

		$cpt = get_post_type_object( 'page_capability' );

		$admin       = self::$users['administrator'];
		$editor      = self::$users['editor'];
		$author      = self::$users['author'];
		$contributor = self::$users['contributor'];

		$this->assertEquals( 'edit_pages', $cpt->cap->edit_posts );
		$this->assertTrue( user_can( $admin->ID, $cpt->cap->edit_posts ) );
		$this->assertTrue( user_can( $editor->ID, $cpt->cap->edit_posts ) );
		$this->assertFalse( user_can( $author->ID, $cpt->cap->edit_posts ) );
		$this->assertFalse( user_can( $contributor->ID, $cpt->cap->edit_posts ) );

		$admin_post = self::factory()->post->create_and_get( array(
			'post_author' => $admin->ID,
			'post_type'   => 'page_capability',
		) );

		$this->assertTrue( user_can( $admin->ID, 'edit_post', $admin_post->ID ) );
		$this->assertTrue( user_can( $editor->ID, 'edit_post', $admin_post->ID ) );
		$this->assertFalse( user_can( $author->ID, 'edit_post', $admin_post->ID ) );
		$this->assertFalse( user_can( $contributor->ID, 'edit_post', $admin_post->ID ) );

		$author_post = self::factory()->post->create_and_get( array(
			'post_author' => $author->ID,
			'post_type'   => 'page_capability',
		) );

		$this->assertTrue( user_can( $admin->ID, 'edit_post', $author_post->ID ) );
		$this->assertTrue( user_can( $editor->ID, 'edit_post', $author_post->ID ) );
		$this->assertFalse( user_can( $author->ID, 'edit_post', $author_post->ID ) );
		$this->assertFalse( user_can( $contributor->ID, 'edit_post', $author_post->ID ) );

		_unregister_post_type( 'page_capability' );

	}

	public function testNonLoggedInUsersHaveNoCapabilities() {

		$this->assertFalse( is_user_logged_in() );

		$caps = $this->getAllCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			$this->assertFalse( current_user_can( $cap ), "Non-logged-in user should not have the {$cap} capability" );
		}

		$this->assertFalse( current_user_can( 'start_a_fire' ), "Non-logged-in user should not have a custom capability" );
		$this->assertFalse( current_user_can( 'do_not_allow' ), "Non-logged-in user should not have the do_not_allow capability" );
	}

	protected $_role_test_wp_roles_role;
	/**
	 * @ticket 23016
	 */
	public function test_wp_roles_init_action() {
		$this->_role_test_wp_roles_init = array(
			'role' => 'test_wp_roles_init',
			'info' => array(
				'name' => 'Test WP Roles Init',
				'capabilities' => array( 'testing_magic' => true ),
			),
		);
		add_action( 'wp_roles_init', array( $this, '_hook_wp_roles_init' ), 10, 1 );

		$wp_roles = new WP_Roles();

		remove_action( 'wp_roles_init', array( $this, '_hook_wp_roles_init' ) );

		$expected = new WP_Role( $this->_role_test_wp_roles_init['role'], $this->_role_test_wp_roles_init['info']['capabilities'] );

		$role = $wp_roles->get_role( $this->_role_test_wp_roles_init['role'] );

		$this->assertEquals( $expected, $role );
		$this->assertContains( $this->_role_test_wp_roles_init['info']['name'], $wp_roles->role_names );
	}

	public function _hook_wp_roles_init( $wp_roles ) {
		$wp_roles->add_role( $this->_role_test_wp_roles_init['role'], $this->_role_test_wp_roles_init['info']['name'], $this->_role_test_wp_roles_init['info']['capabilities'] );
	}

	/**
	 * @ticket 23016
	 * @expectedDeprecated WP_Roles::reinit
	 */
	public function test_wp_roles_reinit_deprecated() {
		$wp_roles = new WP_Roles();
		$wp_roles->reinit();
	}

	/**
	 * @ticket 38412
	 */
	public function test_no_one_can_edit_user_meta_for_non_existent_term() {
		wp_set_current_user( self::$super_admin->ID );
		$this->assertFalse( current_user_can( 'edit_user_meta', 999999 ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_can_edit_user_meta() {
		wp_set_current_user( self::$users['administrator']->ID );
		if ( is_multisite() ) {
			grant_super_admin( self::$users['administrator']->ID );
		}
		$this->assertTrue( current_user_can( 'edit_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_cannot_edit_user_meta() {
		wp_set_current_user( self::$users['editor']->ID );
		$this->assertFalse( current_user_can( 'edit_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_no_one_can_delete_user_meta_for_non_existent_term() {
		wp_set_current_user( self::$super_admin->ID );
		$this->assertFalse( current_user_can( 'delete_user_meta', 999999, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_can_delete_user_meta() {
		wp_set_current_user( self::$users['administrator']->ID );
		if ( is_multisite() ) {
			grant_super_admin( self::$users['administrator']->ID );
		}
		$this->assertTrue( current_user_can( 'delete_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_cannot_delete_user_meta() {
		wp_set_current_user( self::$users['editor']->ID );
		$this->assertFalse( current_user_can( 'delete_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_no_one_can_add_user_meta_for_non_existent_term() {
		wp_set_current_user( self::$super_admin->ID );
		$this->assertFalse( current_user_can( 'add_user_meta', 999999, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_can_add_user_meta() {
		wp_set_current_user( self::$users['administrator']->ID );
		if ( is_multisite() ) {
			grant_super_admin( self::$users['administrator']->ID );
		}
		$this->assertTrue( current_user_can( 'add_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}

	/**
	 * @ticket 38412
	 */
	public function test_user_cannot_add_user_meta() {
		wp_set_current_user( self::$users['editor']->ID );
		$this->assertFalse( current_user_can( 'add_user_meta', self::$users['subscriber']->ID, 'foo' ) );
	}
}
