<?php

/**
 * @group user
 */
class Tests_User_GetUsersWithNoRole extends WP_UnitTestCase {

	/**
	 * @ticket 22993
	 * @group ms-excluded
	 */
	public function test_get_users_with_no_role_is_accurate() {
		// Setup users
		$admin = self::factory()->user->create( array(
			'role' => 'administrator',
		) );
		$editor = self::factory()->user->create( array(
			'role' => 'editor',
		) );
		$nobody = self::factory()->user->create( array(
			'role' => '',
		) );
		$nobody_else = self::factory()->user->create( array(
			'role' => '',
		) );

		// Test users
		$users = wp_get_users_with_no_role();

		$this->assertEquals( array(
			$nobody,
			$nobody_else,
		), $users );

	}

	/**
	 * @ticket 22993
	 * @ticket 36196
	 * @group multisite
	 * @group ms-required
	 */
	public function test_get_users_with_no_role_multisite_is_accurate() {
		// Setup users
		$admin = self::factory()->user->create( array(
			'role' => 'administrator',
		) );
		$editor = self::factory()->user->create( array(
			'role' => 'editor',
		) );
		$nobody = self::factory()->user->create( array(
			'role' => '',
		) );

		// Setup blogs
		$blog_1 = (int) self::factory()->blog->create( array(
			'user_id' => $editor,
		) );

		// Add editor to blog 1
		add_user_to_blog( $blog_1, $editor, 'editor' );

		// Test users on root site
		$users = wp_get_users_with_no_role();
		$this->assertSame( array(
			"{$nobody}",
		), $users );

		// Test users counts on blog 1
		$users = wp_get_users_with_no_role( $blog_1 );
		$this->assertSame( array(), $users );

		// Add admin to blog 1 with no role
		add_user_to_blog( $blog_1, $admin, '' );

		// Re-test users counts on blog 1
		$users = wp_get_users_with_no_role( $blog_1 );
		$this->assertSame( array(
			"{$admin}",
		), $users );
	}

	/**
	 * Role comparison must be done on role name, not role display name.
	 *
	 * @ticket 38234
	 */
	public function test_get_users_with_no_role_matches_on_role_name() {
		// Create a role with a display name which would not match the role name
		// in a case-insentive SQL query.
		wp_roles()->add_role( 'somerole', 'Some role display name' );

		$someuser = self::factory()->user->create( array(
			'role' => 'somerole',
		) );

		$users = wp_get_users_with_no_role();

		wp_roles()->remove_role( 'somerole' );

		$this->assertEmpty( $users );
	}

	/**
	 * @ticket 42015
	 * @group multisite
	 * @group ms-required
	 */
	public function test_get_users_with_no_role_matches_on_role_name_different_site() {
		$site_id = (int) self::factory()->blog->create();

		switch_to_blog( $site_id );
		wp_roles()->add_role( 'somerole', 'Some role display name' );
		$user_id = self::factory()->user->create( array(
			'role' => 'somerole',
		) );
		restore_current_blog();

		$users = wp_get_users_with_no_role( $site_id );

		$this->assertEmpty( $users );
	}

}
