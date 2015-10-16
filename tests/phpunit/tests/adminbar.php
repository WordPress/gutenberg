<?php

/**
 * @group admin-bar
 * @group toolbar
 * @group admin
 */
class Tests_AdminBar extends WP_UnitTestCase {

	public static function setUpBeforeClass() {
		require_once( ABSPATH . WPINC . '/class-wp-admin-bar.php' );
	}

	/**
	 * @ticket 21117
	 */
	function test_content_post_type() {
		wp_set_current_user( self::$factory->user->create( array( 'role' => 'editor' ) ) );

		register_post_type( 'content', array( 'show_in_admin_bar' => true ) );

		$admin_bar = new WP_Admin_Bar;

		wp_admin_bar_new_content_menu( $admin_bar );

		$nodes = $admin_bar->get_nodes();
		$this->assertFalse( $nodes['new-content']->parent );
		$this->assertEquals( 'new-content', $nodes['add-new-content']->parent );

		_unregister_post_type( 'content' );
	}

	/**
	 * @ticket 21117
	 */
	function test_merging_existing_meta_values() {
		wp_set_current_user( self::$factory->user->create( array( 'role' => 'editor' ) ) );

		$admin_bar = new WP_Admin_Bar;

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'class' => 'test-class' ),
		) );
		$node = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class' ), $node->meta );

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'some-meta' => 'value' ),
		) );

		$node = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class', 'some-meta' => 'value' ), $node->meta );
	}

	/**
	 * @ticket 25162
	 */
	public function test_admin_bar_contains_correct_links_for_users_with_no_role() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test does not run in multisite' );
		}

		$nobody = self::$factory->user->create( array( 'role' => '' ) );
		$this->assertFalse( user_can( $nobody, 'read' ) );

		wp_set_current_user( $nobody );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// Site menu points to the home page instead of the admin URL
		$this->assertEquals( home_url( '/' ), $node_site_name->href );

		// No profile links as the user doesn't have any permissions on the site
		$this->assertFalse( $node_my_account->href );
		$this->assertFalse( $node_user_info->href );
		$this->assertNull( $node_edit_profile );

	}

	/**
	 * @ticket 25162
	 */
	public function test_admin_bar_contains_correct_links_for_users_with_role() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test does not run in multisite' );
		}

		$editor = self::$factory->user->create( array( 'role' => 'editor' ) );
		$this->assertTrue( user_can( $editor, 'read' ) );

		wp_set_current_user( $editor );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// Site menu points to the admin URL
		$this->assertEquals( admin_url( '/' ), $node_site_name->href );

		$profile_url = admin_url( 'profile.php' );

		// Profile URLs point to profile.php
		$this->assertEquals( $profile_url, $node_my_account->href );
		$this->assertEquals( $profile_url, $node_user_info->href );
		$this->assertEquals( $profile_url, $node_edit_profile->href );

	}

	/**
	 * @ticket 25162
	 * @group multisite
	 */
	public function test_admin_bar_contains_correct_links_for_users_with_no_role_on_blog() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
		}

		$admin  = self::$factory->user->create( array( 'role' => 'administrator' ) );
		$editor = self::$factory->user->create( array( 'role' => 'editor' ) );

		$this->assertTrue( user_can( $admin, 'read' ) );
		$this->assertTrue( user_can( $editor, 'read' ) );

		$new_blog_id = self::$factory->blog->create( array(
			'user_id' => $admin,
		) );

		$this->assertTrue( is_user_member_of_blog( $admin, $new_blog_id ) );
		$this->assertFalse( is_user_member_of_blog( $editor, $new_blog_id ) );

		wp_set_current_user( $editor );

		switch_to_blog( $new_blog_id );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// get primary blog
		$primary = get_active_blog_for_user( $editor );
		$this->assertInternalType( 'object', $primary );

		// No Site menu as the user isn't a member of this blog
		$this->assertNull( $node_site_name );

		$primary_profile_url = get_admin_url( $primary->blog_id, 'profile.php' );

		// Ensure the user's primary blog is not the same as the main site
		$this->assertNotEquals( $primary_profile_url, admin_url( 'profile.php' ) );

		// Profile URLs should go to the user's primary blog
		$this->assertEquals( $primary_profile_url, $node_my_account->href );
		$this->assertEquals( $primary_profile_url, $node_user_info->href );
		$this->assertEquals( $primary_profile_url, $node_edit_profile->href );

		restore_current_blog();

	}

	/**
	 * @ticket 25162
	 * @group multisite
	 */
	public function test_admin_bar_contains_correct_links_for_users_with_no_role_on_network() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test only runs in multisite' );
		}

		$admin  = self::$factory->user->create( array( 'role' => 'administrator' ) );
		$nobody = self::$factory->user->create( array( 'role' => '' ) );

		$this->assertTrue( user_can( $admin, 'read' ) );
		$this->assertFalse( user_can( $nobody, 'read' ) );

		$new_blog_id = self::$factory->blog->create( array(
			'user_id' => $admin,
		) );

		$this->assertTrue( is_user_member_of_blog( $admin, $new_blog_id ) );
		$this->assertFalse( is_user_member_of_blog( $nobody, $new_blog_id ) );
		$this->assertTrue( is_user_member_of_blog( $nobody, get_current_blog_id() ) );

		// Remove `$nobody` from the current blog, so they're not a member of any blog
		$removed = remove_user_from_blog( $nobody, get_current_blog_id() );

		$this->assertTrue( $removed );
		$this->assertFalse( is_user_member_of_blog( $nobody, get_current_blog_id() ) );

		wp_set_current_user( $nobody );

		switch_to_blog( $new_blog_id );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// get primary blog
		$primary = get_active_blog_for_user( $nobody );
		$this->assertNull( $primary );

		// No Site menu as the user isn't a member of this site
		$this->assertNull( $node_site_name );

		$user_profile_url = user_admin_url( 'profile.php' );

		$this->assertNotEquals( $user_profile_url, admin_url( 'profile.php' ) );

		// Profile URLs should go to the user's primary blog
		$this->assertEquals( $user_profile_url, $node_my_account->href );
		$this->assertEquals( $user_profile_url, $node_user_info->href );
		$this->assertEquals( $user_profile_url, $node_edit_profile->href );

		restore_current_blog();

	}

	protected function get_standard_admin_bar() {
		global $wp_admin_bar;

		_wp_admin_bar_init();

		$this->assertTrue( is_admin_bar_showing() );
		$this->assertInstanceOf( 'WP_Admin_Bar', $wp_admin_bar );

		do_action_ref_array( 'admin_bar_menu', array( &$wp_admin_bar ) );

		return $wp_admin_bar;
	}

}
