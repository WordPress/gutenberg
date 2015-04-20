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

	// test the default roles

	function test_user_administrator() {
		$id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// make sure the role name is correct
		$this->assertEquals(array('administrator'), $user->roles);

		// check a few of the main capabilities
		$this->assertTrue($user->has_cap('switch_themes'));
		$this->assertTrue($user->has_cap('list_users'));
		$this->assertTrue($user->has_cap('manage_options'));
		$this->assertTrue($user->has_cap('level_10'));
	}

	function test_user_editor() {
		$id = $this->factory->user->create( array( 'role' => 'editor' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// make sure the role name is correct
		$this->assertEquals(array('editor'), $user->roles);

		// check a few of the main capabilities
		$this->assertTrue($user->has_cap('moderate_comments'));
		$this->assertTrue($user->has_cap('manage_categories'));
		$this->assertTrue($user->has_cap('upload_files'));
		$this->assertTrue($user->has_cap('level_7'));

		// and a few capabilities this user doesn't have
		$this->assertFalse($user->has_cap('switch_themes'));
		$this->assertFalse($user->has_cap('edit_users'));
		$this->assertFalse($user->has_cap('level_8'));
	}

	function test_user_author() {
		$id = $this->factory->user->create( array( 'role' => 'author' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// make sure the role name is correct
		$this->assertEquals(array('author'), $user->roles);

		// check a few of the main capabilities
		$this->assertTrue($user->has_cap('edit_posts'));
		$this->assertTrue($user->has_cap('edit_published_posts'));
		$this->assertTrue($user->has_cap('upload_files'));
		$this->assertTrue($user->has_cap('level_2'));

		// and a few capabilities this user doesn't have
		$this->assertFalse($user->has_cap('moderate_comments'));
		$this->assertFalse($user->has_cap('manage_categories'));
		$this->assertFalse($user->has_cap('level_3'));
	}

	function test_user_contributor() {
		$id = $this->factory->user->create( array( 'role' => 'contributor' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// make sure the role name is correct
		$this->assertEquals(array('contributor'), $user->roles);

		// check a few of the main capabilities
		$this->assertTrue($user->has_cap('edit_posts'));
		$this->assertTrue($user->has_cap('read'));
		$this->assertTrue($user->has_cap('level_1'));
		$this->assertTrue($user->has_cap('level_0'));

		// and a few capabilities this user doesn't have
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_published_posts'));
		$this->assertFalse($user->has_cap('level_2'));
	}

	function test_user_subscriber() {
		$id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// make sure the role name is correct
		$this->assertEquals(array('subscriber'), $user->roles);

		// check a few of the main capabilities
		$this->assertTrue($user->has_cap('read'));
		$this->assertTrue($user->has_cap('level_0'));

		// and a few capabilities this user doesn't have
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_posts'));
		$this->assertFalse($user->has_cap('level_1'));
	}

	// a role that doesn't exist
	function test_bogus_role() {
		_disable_wp_die();
		$id = $this->factory->user->create( array( 'role' => rand_str() ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// user has no role and no capabilities
		$this->assertEquals(array(), $user->roles);
		$this->assertFalse($user->has_cap('level_0'));
		_enable_wp_die();
	}

	// a user with multiple roles
	function test_user_subscriber_contributor() {
		$id = $this->factory->user->create( array( 'role' => 'subscriber' ) );
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");
		$user->add_role('contributor');

		// nuke and re-fetch the object to make sure it was stored
		$user = NULL;
		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		// user should have two roles now
		$this->assertEquals(array('subscriber', 'contributor'), $user->roles);

		// with contributor capabilities
		$this->assertTrue($user->has_cap('edit_posts'));
		$this->assertTrue($user->has_cap('read'));
		$this->assertTrue($user->has_cap('level_1'));
		$this->assertTrue($user->has_cap('level_0'));

		// but not these
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_published_posts'));
		$this->assertFalse($user->has_cap('level_2'));
	}

	function test_add_empty_role() {
		// add_role($role, $display_name, $capabilities = '')
		// randomly named role with no capabilities
		global $wp_roles;
		$role_name = rand_str();
		add_role($role_name, 'Janitor', array());
		$this->_flush_roles();
		$this->assertTrue($wp_roles->is_role($role_name));

		$id = $this->factory->user->create( array( 'role' => $role_name ) );

		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		$this->assertEquals(array($role_name), $user->roles);

		// user shouldn't have any capabilities; test a quick sample
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_published_posts'));
		$this->assertFalse($user->has_cap('level_1'));
		$this->assertFalse($user->has_cap('level_0'));

		// clean up
		remove_role($role_name);
		$this->_flush_roles();
		$this->assertFalse($wp_roles->is_role($role_name));
	}


	function test_add_role() {
		// add_role($role, $display_name, $capabilities = '')
		// randomly named role with a few capabilities
		global $wp_roles;
		$role_name = rand_str();
		add_role($role_name, 'Janitor', array('edit_posts'=>true, 'edit_pages'=>true, 'level_0'=>true, 'level_1'=>true, 'level_2'=>true));
		$this->_flush_roles();
		$this->assertTrue($wp_roles->is_role($role_name));

		$id = $this->factory->user->create( array( 'role' => $role_name ) );

		$user = new WP_User($id);
		$this->assertTrue($user->exists(), "Problem getting user $id");

		$this->assertEquals(array($role_name), $user->roles);

		// the user should have all the above caps
		$this->assertTrue($user->has_cap($role_name));
		$this->assertTrue($user->has_cap('edit_posts'));
		$this->assertTrue($user->has_cap('edit_pages'));
		$this->assertTrue($user->has_cap('level_0'));
		$this->assertTrue($user->has_cap('level_1'));
		$this->assertTrue($user->has_cap('level_2'));

		// shouldn't have any other caps
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('edit_published_posts'));
		$this->assertFalse($user->has_cap('upload_files'));
		$this->assertFalse($user->has_cap('level_3'));

		// clean up
		remove_role($role_name);
		$this->_flush_roles();
		$this->assertFalse($wp_roles->is_role($role_name));
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
}
