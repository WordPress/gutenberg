<?php

// Test roles and capabilities via the WP_User class

/**
 * @group user
 * @group capabilities
 */
class Tests_User_Capabilities extends WP_UnitTestCase {
	protected $user_ids = array();

	function setUp() {
		parent::setUp();
		// keep track of users we create
		$this->_flush_roles();

		$this->orig_users = get_users();
	}

	function _flush_roles() {
		// we want to make sure we're testing against the db, not just in-memory data
		// this will flush everything and reload it from the db
		unset($GLOBALS['wp_user_roles']);
		global $wp_roles;
		if ( is_object( $wp_roles ) )
			$wp_roles->_init();
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

	protected function _getSingleSiteCaps() {
		return array(

			'unfiltered_html'        => array( 'administrator', 'editor' ),

			'manage_network'         => array(),
			'manage_sites'           => array(),
			'manage_network_users'   => array(),
			'manage_network_plugins' => array(),
			'manage_network_themes'  => array(),
			'manage_network_options' => array(),

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
			'delete_others_posts'    => array( 'administrator', 'editor' ),
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

		);

	}

	protected function _getMultiSiteCaps() {
		return array(

			'unfiltered_html'        => array(),

			'manage_network'         => array(),
			'manage_sites'           => array(),
			'manage_network_users'   => array(),
			'manage_network_plugins' => array(),
			'manage_network_themes'  => array(),
			'manage_network_options' => array(),
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
			'delete_others_posts'    => array( 'administrator', 'editor' ),
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

		);

	}

	protected function getCapsAndRoles() {
		if ( is_multisite() ) {
			return $this->_getMultiSiteCaps();
		} else {
			return $this->_getSingleSiteCaps();
		}
	}

	// test the tests
	function test_single_and_multisite_cap_tests_match() {
		$single = $this->_getSingleSiteCaps();
		$multi  = $this->_getMultiSiteCaps();
		$this->assertEquals( array_keys( $single ), array_keys( $multi ) );
	}

	// test the default roles and caps
	function test_all_roles_and_caps() {
		$users = array(
			'administrator' => $this->factory->user->create_and_get( array( 'role' => 'administrator' ) ),
			'editor'        => $this->factory->user->create_and_get( array( 'role' => 'editor' ) ),
			'author'        => $this->factory->user->create_and_get( array( 'role' => 'author' ) ),
			'contributor'   => $this->factory->user->create_and_get( array( 'role' => 'contributor' ) ),
			'subscriber'    => $this->factory->user->create_and_get( array( 'role' => 'subscriber' ) ),
		);
		$caps = $this->getCapsAndRoles();

		foreach ( $users as $role => $user ) {

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
	}

	// special case for the link manager
	function test_link_manager_caps() {
		$users = array(
			'administrator' => $this->factory->user->create_and_get( array( 'role' => 'administrator' ) ),
			'editor'        => $this->factory->user->create_and_get( array( 'role' => 'editor' ) ),
			'author'        => $this->factory->user->create_and_get( array( 'role' => 'author' ) ),
			'contributor'   => $this->factory->user->create_and_get( array( 'role' => 'contributor' ) ),
			'subscriber'    => $this->factory->user->create_and_get( array( 'role' => 'subscriber' ) ),
		);
		$caps = array(
			'manage_links' => array( 'administrator', 'editor' ),
		);

		$this->assertSame( '0', get_option( 'link_manager_enabled' ) );

		// no-one should have access to the link manager by default
		foreach ( $users as $role => $user ) {
			foreach ( $caps as $cap => $roles ) {
				$this->assertFalse( $user->has_cap( $cap ), "User with the {$role} role should not have the {$cap} capability" );
				$this->assertFalse( user_can( $user, $cap ), "User with the {$role} role should not have the {$cap} capability" );
			}
		}

		update_option( 'link_manager_enabled', '1' );
		$this->assertSame( '1', get_option( 'link_manager_enabled' ) );

		foreach ( $users as $role => $user ) {
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

	function test_super_admin_caps() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
			return;
		}
		$caps = $this->getCapsAndRoles();

		$user = $this->factory->user->create_and_get( array( 'role' => 'administrator' ) );
		grant_super_admin( $user->ID );

		$this->assertTrue( is_super_admin( $user->ID ) );

		foreach ( $caps as $cap => $roles ) {
			$this->assertTrue( $user->has_cap( $cap ), "Super Admins should have the {$cap} capability" );
			$this->assertTrue( user_can( $user, $cap ), "Super Admins should have the {$cap} capability" );
		}
	}

	// a role that doesn't exist
	function test_bogus_role() {
		$user = $this->factory->user->create_and_get( array( 'role' => 'invalid_role' ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array(), $user->roles, "User should not have any roles" );

		$caps = $this->getCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			$this->assertFalse( $user->has_cap( $cap ), "User with an invalid role should not have the {$cap} capability" );
			$this->assertFalse( user_can( $user, $cap ), "User with an invalid role should not have the {$cap} capability" );
		}
	}

	// a user with multiple roles
	function test_user_subscriber_contributor() {
		$user = $this->factory->user->create_and_get( array( 'role' => 'subscriber' ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		$user->add_role( 'contributor' );

		// user should have two roles now
		$this->assertEquals( array( 'subscriber', 'contributor' ), $user->roles );

		$caps = $this->getCapsAndRoles();

		foreach ( $caps as $cap => $roles ) {
			if ( array_intersect( $user->roles, $roles ) ) {
				$this->assertTrue( $user->has_cap( $cap ), "User should have the {$cap} capability" );
				$this->assertTrue( user_can( $user, $cap ), "User should have the {$cap} capability" );
			} else {
				$this->assertFalse( $user->has_cap( $cap ), "User should not have the {$cap} capability" );
				$this->assertFalse( user_can( $user, $cap ), "User should not have the {$cap} capability" );
			}
		}
	}

	// newly added empty role
	function test_add_empty_role() {
		global $wp_roles;

		$role_name = 'janitor';
		add_role( $role_name, 'Janitor', array() );

		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role( $role_name ) );

		$user = $this->factory->user->create_and_get( array( 'role' => $role_name ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array( $role_name ), $user->roles );

		$caps = $this->getCapsAndRoles();

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

		$user = $this->factory->user->create_and_get( array( 'role' => $role_name ) );

		// make sure the user is valid
		$this->assertTrue( $user->exists(), "User does not exist" );

		// make sure the role name is correct
		$this->assertEquals( array( $role_name ), $user->roles );

		$caps = $this->getCapsAndRoles();

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
		$role_name = rand_str();
		add_role( $role_name, 'Janitor', array('level_1'=>true) );
		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role($role_name) );

		// assign a user to that role
		$id = $this->factory->user->create( array( 'role' => $role_name ) );

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
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_published_posts'));
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('level_4'));

		// clean up
		remove_role($role_name);
		$this->_flush_roles();
		$this->assertFalse($wp_roles->is_role($role_name));

	}

	function test_role_remove_cap() {
		// change the capabilites associated with a role and make sure the change is reflected in has_cap()

		global $wp_roles;
		$role_name = rand_str();
		add_role( $role_name, 'Janitor', array('level_1'=>true, 'sweep_floor'=>true, 'polish_doorknobs'=>true) );
		$this->_flush_roles();
		$this->assertTrue( $wp_roles->is_role($role_name) );

		// assign a user to that role
		$id = $this->factory->user->create( array( 'role' => $role_name ) );

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
		$id_1 = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$id_2 = $this->factory->user->create( array( 'role' => 'contributor' ) );

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
		$this->assertTrue($user_1->has_cap('edit_posts'));
		$this->assertTrue($user_1->has_cap('read'));
		$this->assertTrue($user_1->has_cap('level_1'));
		$this->assertTrue($user_1->has_cap('level_0'));
		$this->assertFalse($user_1->has_cap('upload_files'));
		$this->assertFalse($user_1->has_cap('edit_published_posts'));
		$this->assertFalse($user_1->has_cap('level_2'));

	}

	function test_user_remove_cap() {
		// add an extra capability to a user then remove it

		// there are two contributors
		$id_1 = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$id_2 = $this->factory->user->create( array( 'role' => 'contributor' ) );

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
		$id = $this->factory->user->create( array( 'role' => 'author' ) );
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
		$id = $this->factory->user->create( array( 'role' => 'author' ) );
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

		// capabilities for the author role should be gone
#		$this->assertFalse($user->has_cap('edit_posts'));
#		$this->assertFalse($user->has_cap('edit_published_posts'));
#		$this->assertFalse($user->has_cap('upload_files'));
#		$this->assertFalse($user->has_cap('level_2'));

		// the extra capabilities should be gone
		$this->assertFalse($user->has_cap('make_coffee'));
		$this->assertFalse($user->has_cap('drink_coffee'));

		// user level should be empty
		$this->assertEmpty( $user->user_level );


	}

	function test_post_meta_caps() {
		// simple tests for some common meta capabilities

		// Make our author
		$author = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );

		// make a post
		$post = $this->factory->post->create( array( 'post_author' => $author->ID, 'post_type' => 'post' ) );

		// the author of the post
		$this->assertTrue($author->exists(), "Problem getting user $author->ID");

		// add some other users
		$admin = new WP_User( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		$author_2 = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$editor = new WP_User( $this->factory->user->create( array( 'role' => 'editor' ) ) );
		$contributor = new WP_User( $this->factory->user->create( array( 'role' => 'contributor' ) ) );

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
		$post = $this->factory->post->create( array( 'post_author' => 0, 'post_type' => 'post', 'post_status' => $status ) );

		// Add an editor and contributor
		$editor = $this->factory->user->create_and_get( array( 'role' => 'editor' ) );
		$contributor = $this->factory->user->create_and_get( array( 'role' => 'contributor' ) );

		// editor can edit, view, and trash
		$this->assertTrue( $editor->has_cap( 'edit_post', $post ) );
		$this->assertTrue( $editor->has_cap( 'delete_post', $post ) );
		$this->assertTrue( $editor->has_cap( 'read_post', $post ) );

		// a contributor cannot (except read a published post)
		$this->assertFalse( $contributor->has_cap( 'edit_post', $post ) );
		$this->assertFalse( $contributor->has_cap( 'delete_post', $post ) );
		$this->assertEquals( $status === 'publish', $contributor->has_cap( 'read_post', $post ) );
	}

	/**
	 * @ticket 16714
	 */
	function test_create_posts_caps() {
		$author = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$admin = new WP_User( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		$author_2 = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$editor = new WP_User( $this->factory->user->create( array( 'role' => 'editor' ) ) );
		$contributor = new WP_User( $this->factory->user->create( array( 'role' => 'contributor' ) ) );

		// create_posts isn't a real cap.
		$this->assertFalse($admin->has_cap('create_posts'));
		$this->assertFalse($author->has_cap('create_posts'));
		$this->assertFalse($editor->has_cap('create_posts'));
		$this->assertFalse($author_2->has_cap('create_posts'));
		$this->assertFalse($contributor->has_cap('create_posts'));

		register_post_type( 'foobar' );
		$cap = get_post_type_object( 'foobar' )->cap;

		$this->assertEquals( 'edit_posts', $cap->create_posts );

		$this->assertTrue($admin->has_cap( $cap->create_posts ));

		$this->assertTrue($admin->has_cap( $cap->create_posts ));
		$this->assertTrue($author->has_cap( $cap->create_posts ));
		$this->assertTrue($editor->has_cap( $cap->create_posts ));
		$this->assertTrue($author_2->has_cap( $cap->create_posts ));
		$this->assertTrue($contributor->has_cap( $cap->create_posts ));

		_unregister_post_type( 'foobar' );

		// Primitive capability edit_foobars is not assigned to any users.
		register_post_type( 'foobar', array( 'capability_type' => array( 'foobar', 'foobars' ) ) );
		$cap = get_post_type_object( 'foobar' )->cap;

		$this->assertEquals( 'edit_foobars', $cap->create_posts );

		$this->assertFalse($admin->has_cap( $cap->create_posts ));
		$this->assertFalse($author->has_cap( $cap->create_posts ));
		$this->assertFalse($editor->has_cap( $cap->create_posts ));
		$this->assertFalse($author_2->has_cap( $cap->create_posts ));
		$this->assertFalse($contributor->has_cap( $cap->create_posts ));

		// Add edit_foobars primitive cap to a user.
		$admin->add_cap( 'edit_foobars', true );
		$admin = new WP_User( $admin->ID );
		$this->assertTrue($admin->has_cap( $cap->create_posts ));
		$this->assertFalse($author->has_cap( $cap->create_posts ));
		$this->assertFalse($editor->has_cap( $cap->create_posts ));
		$this->assertFalse($author_2->has_cap( $cap->create_posts ));
		$this->assertFalse($contributor->has_cap( $cap->create_posts ));

		_unregister_post_type( 'foobar' );

		$cap = get_post_type_object( 'attachment' )->cap;
		$this->assertEquals( 'upload_files', $cap->create_posts );
		$this->assertEquals( 'edit_posts', $cap->edit_posts );

		$this->assertTrue( $author->has_cap( $cap->create_posts ) );
		$this->assertTrue( $author->has_cap( $cap->edit_posts ) );
		$this->assertTrue( $contributor->has_cap( $cap->edit_posts ) );
		$this->assertFalse( $contributor->has_cap( $cap->create_posts ) );
	}

	function test_page_meta_caps() {
		// simple tests for some common meta capabilities

		// Make our author
		$author = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );

		// make a page
		$page = $this->factory->post->create( array( 'post_author' => $author->ID, 'post_type' => 'page' ) );

		// the author of the page
		$this->assertTrue($author->exists(), "Problem getting user " . $author->ID);

		// add some other users
		$admin = new WP_User( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		$author_2 = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$editor = new WP_User( $this->factory->user->create( array( 'role' => 'editor' ) ) );
		$contributor = new WP_User( $this->factory->user->create( array( 'role' => 'contributor' ) ) );

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
	 * @ticket 21786
	 */
	function test_negative_caps() {
		$author = new WP_User( $this->factory->user->create( array( 'role' => 'author' ) ) );
		$author->add_cap( 'foo', false );
		$this->assertTrue ( isset( $author->caps['foo'] ) );
		$author->remove_cap( 'foo' );
		$this->assertFalse ( isset( $author->caps['foo'] ) );
	}

	/**
	 * @ticket 18932
	 */
	function test_set_role_same_role() {
		$user = new WP_User( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		$caps = $user->caps;
		$this->assertNotEmpty( $user->caps );
		$user->set_role( 'administrator' );
		$this->assertNotEmpty( $user->caps );
		$this->assertEquals( $caps, $user->caps );
	}

	function test_current_user_can_for_blog() {
		$user = new WP_User( $this->factory->user->create( array( 'role' => 'administrator' ) ) );
		$old_uid = get_current_user_id();
		wp_set_current_user( $user->ID );

		$this->assertTrue( current_user_can_for_blog( get_current_blog_id(), 'edit_posts' ) );
		$this->assertFalse( current_user_can_for_blog( get_current_blog_id(), 'foo_the_bar' ) );
		if ( ! is_multisite() ) {
			$this->assertTrue( current_user_can_for_blog( 12345, 'edit_posts' ) );
			return;
		}

		$this->assertFalse( current_user_can_for_blog( 12345, 'edit_posts' ) );

		$blog_id = $this->factory->blog->create( array( 'user_id' => $user->ID ) );
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
		$blog_id = $this->factory->blog->create();

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
		$user = new WP_User( $this->factory->user->create( array( 'role' => 'contributor' ) ) );
		wp_set_current_user( $user->ID );

		$user->add_cap( 'publish_posts' );
		$user->add_cap( 'publish_pages' );
		$this->assertTrue( $user->has_cap( 'publish_posts' ) );
		$this->assertTrue( $user->has_cap( 'publish_pages' ) );

		$user->remove_cap( 'publish_pages' );
		$this->assertFalse( $user->has_cap( 'publish_pages' ) );
	}

	function test_subscriber_cant_edit_posts() {
		$user = new WP_User( $this->factory->user->create( array( 'role' => 'subscriber' ) ) );
		wp_set_current_user( $user->ID );

		$post = $this->factory->post->create( array( 'post_author' => 1 ) );

		$this->assertFalse( current_user_can( 'edit_post', $post ) );
		$this->assertFalse( current_user_can( 'edit_post', $post + 1 ) );
	}
}
