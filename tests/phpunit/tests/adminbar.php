<?php

/**
 * @group admin-bar
 * @group toolbar
 * @group admin
 */
class Tests_AdminBar extends WP_UnitTestCase {
	protected static $editor_id;
	protected static $admin_id;
	protected static $no_role_id;
	protected static $post_id;
	protected static $blog_id;

	protected static $user_ids = array();

	public static function setUpBeforeClass() {
		require_once( ABSPATH . WPINC . '/class-wp-admin-bar.php' );

		parent::setUpBeforeClass();
	}

	public static function wpSetUpBeforeClass( $factory ) {
		self::$user_ids[] = self::$editor_id = $factory->user->create( array( 'role' => 'editor' ) );
		self::$user_ids[] = self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$user_ids[] = self::$no_role_id = $factory->user->create( array( 'role' => '' ) );
	}

	/**
	 * @ticket 21117
	 */
	function test_content_post_type() {
		wp_set_current_user( self::$editor_id );

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
		wp_set_current_user( self::$editor_id );

		$admin_bar = new WP_Admin_Bar;

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'class' => 'test-class' ),
		) );

		$node1 = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class' ), $node1->meta );

		$admin_bar->add_node( array(
			'id' => 'test-node',
			'meta' => array( 'some-meta' => 'value' ),
		) );

		$node2 = $admin_bar->get_node( 'test-node' );
		$this->assertEquals( array( 'class' => 'test-class', 'some-meta' => 'value' ), $node2->meta );
	}

	/**
	 * @ticket 25162
	 */
	public function test_admin_bar_contains_correct_links_for_users_with_no_role() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test does not run in multisite' );
		}

		$this->assertFalse( user_can( self::$no_role_id, 'read' ) );

		wp_set_current_user( self::$no_role_id );

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

		$this->assertTrue( user_can( self::$editor_id, 'read' ) );

		wp_set_current_user( self::$editor_id );

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

		$blog_id = self::factory()->blog->create( array(
			'user_id' => self::$admin_id,
		) );

		$this->assertTrue( user_can( self::$admin_id, 'read' ) );
		$this->assertTrue( user_can( self::$editor_id, 'read' ) );

		$this->assertTrue( is_user_member_of_blog( self::$admin_id, $blog_id ) );
		$this->assertFalse( is_user_member_of_blog( self::$editor_id, $blog_id ) );

		wp_set_current_user( self::$editor_id );

		switch_to_blog( $blog_id );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// get primary blog
		$primary = get_active_blog_for_user( self::$editor_id );
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

		$this->assertTrue( user_can( self::$admin_id, 'read' ) );
		$this->assertFalse( user_can( self::$no_role_id, 'read' ) );

		$blog_id = self::factory()->blog->create( array(
			'user_id' => self::$admin_id,
		) );

		$this->assertTrue( is_user_member_of_blog( self::$admin_id, $blog_id ) );
		$this->assertFalse( is_user_member_of_blog( self::$no_role_id, $blog_id ) );
		$this->assertTrue( is_user_member_of_blog( self::$no_role_id, get_current_blog_id() ) );

		// Remove `$nobody` from the current blog, so they're not a member of any blog
		$removed = remove_user_from_blog( self::$no_role_id, get_current_blog_id() );

		$this->assertTrue( $removed );
		$this->assertFalse( is_user_member_of_blog( self::$no_role_id, get_current_blog_id() ) );

		wp_set_current_user( self::$no_role_id );

		switch_to_blog( $blog_id );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_site_name    = $wp_admin_bar->get_node( 'site-name' );
		$node_my_account   = $wp_admin_bar->get_node( 'my-account' );
		$node_user_info    = $wp_admin_bar->get_node( 'user-info' );
		$node_edit_profile = $wp_admin_bar->get_node( 'edit-profile' );

		// get primary blog
		$primary = get_active_blog_for_user( self::$no_role_id );
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

	/**
	 * @ticket 32495
	 *
	 * @dataProvider data_admin_bar_nodes_with_tabindex_meta
	 *
	 * @param array  $node_data     The data for a node, passed to `WP_Admin_Bar::add_node()`.
	 * @param string $expected_html The expected HTML when admin menu is rendered.
	 */
	public function test_admin_bar_with_tabindex_meta( $node_data, $expected_html ) {
		$admin_bar = new WP_Admin_Bar();
		$admin_bar->add_node( $node_data );
		$admin_bar_html = get_echo( array( $admin_bar, 'render' ) );
		$this->assertContains( $expected_html, $admin_bar_html );
	}

	/**
	 * Data provider for test_admin_bar_with_tabindex_meta().
	 *
	 * @return array {
	 *     @type array {
	 *         @type array  $node_data     The data for a node, passed to `WP_Admin_Bar::add_node()`.
	 *         @type string $expected_html The expected HTML when admin bar is rendered.
	 *     }
	 * }
	 */
	public function data_admin_bar_nodes_with_tabindex_meta() {
		return array(
			array(
				// No tabindex.
				array(
					'id' => 'test-node',
				),
				'<div class="ab-item ab-empty-item">',
			),
			array(
				// Empty string.
				array(
					'id' => 'test-node',
					'meta' => array( 'tabindex' => '' ),
				),
				'<div class="ab-item ab-empty-item">',
			),
			array(
				// Integer 1 as string.
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => '1' ),
				),
				'<div class="ab-item ab-empty-item" tabindex="1">',
			),
			array(
				// Integer -1 as string.
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => '-1' ),
				),
				'<div class="ab-item ab-empty-item" tabindex="-1">',
			),
			array(
				// Integer 0 as string.
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => '0' ),
				),
				'<div class="ab-item ab-empty-item" tabindex="0">',
			),
			array(
				// Integer, 0.
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => 0 ),
				),
				'<div class="ab-item ab-empty-item" tabindex="0">',
			),
			array(
				// Integer, 2.
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => 2 ),
				),
				'<div class="ab-item ab-empty-item" tabindex="2">',
			),
			array(
				// Boolean, false
				array(
					'id'   => 'test-node',
					'meta' => array( 'tabindex' => false ),
				),
				'<div class="ab-item ab-empty-item">',
			),
		);
	}

	/**
	 * @ticket 22247
	 */
	public function test_admin_bar_has_edit_link_for_existing_posts() {
		wp_set_current_user( self::$editor_id );

		$post = array(
			'post_author' => self::$editor_id,
			'post_status' => 'publish',
			'post_content' => rand_str(),
			'post_title' => rand_str(),
		);
		$id = wp_insert_post( $post );

		// Set queried object to the newly created post.
		global $wp_the_query;
		$wp_the_query->queried_object = (object) array( 'ID' => $id, 'post_type' => 'post' );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_edit = $wp_admin_bar->get_node( 'edit' );
		$this->assertNotNull( $node_edit );
	}

	/**
	 * @ticket 22247
	 */
	public function test_admin_bar_has_no_edit_link_for_non_existing_posts() {
		wp_set_current_user( self::$editor_id );

		// Set queried object to a non-existing post.
		global $wp_the_query;
		$wp_the_query->queried_object = (object) array( 'ID' => 0, 'post_type' => 'post' );

		$wp_admin_bar = $this->get_standard_admin_bar();

		$node_edit = $wp_admin_bar->get_node( 'edit' );
		$this->assertNull( $node_edit );
	}

	/**
	 * @ticket 34113
	 */
	public function test_admin_bar_contains_view_archive_link() {
		set_current_screen( 'edit-post' );

		$wp_admin_bar = $this->get_standard_admin_bar();
		$node         = $wp_admin_bar->get_node( 'archive' );

		set_current_screen( 'front' );

		$this->assertNotNull( $node );
	}

	/**
	 * @ticket 34113
	 */
	public function test_admin_bar_has_no_archives_link_for_post_types_without_archive() {
		set_current_screen( 'edit-page' );

		$wp_admin_bar = $this->get_standard_admin_bar();
		$node         = $wp_admin_bar->get_node( 'archive' );

		set_current_screen( 'front' );

		$this->assertNull( $node );
	}
}
