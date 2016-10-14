<?php

/**
 * @group user
 */
class Tests_User_GetUsersWithNoRole extends WP_UnitTestCase {

	/**
	 * @ticket 22993
	 */
	public function test_get_users_with_no_role_is_accurate() {

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Test does not run on multisite' );
		}

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
	 * @group multisite
	 */
	public function test_get_users_with_no_role_multisite_is_accurate() {

		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Test requires multisite' );
		}

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

		// Add users to blogs
		add_user_to_blog( $blog_1, $editor, 'editor' );

		// Test users on root site
		$users = wp_get_users_with_no_role();
		$this->assertSame( array(), $users );

		// Test users counts on blog 1
		switch_to_blog( $blog_1 );
		$users = wp_get_users_with_no_role();
		restore_current_blog();

		// Test users on root site
		$this->assertSame( array(), $users );

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

}
