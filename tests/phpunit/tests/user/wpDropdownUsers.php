<?php

/**
 * Test functions in wp-includes/user.php
 *
 * @group user
 */
class Tests_User_WpDropdownUsers extends WP_UnitTestCase {

	/**
	 * @ticket 31251
	 */
	public function test_default_value_of_show_should_be_display_name() {

		// create a user with a different display_name
		$u = $this->factory->user->create( array(
			'user_login'   => 'foo',
			'display_name' => 'Foo Person'
		) );

		$found = wp_dropdown_users( array(
			'echo' => false
		) );

		$expected = "<option value='$u'>Foo Person</option>";

		$this->assertContains( $expected, $found );
	}

	/**
	 * @ticket 31251
	 */
	public function test_show_should_display_display_name_show_is_specified_as_empty() {

		// create a user with a different display_name
		$u = $this->factory->user->create( array(
			'user_login'   => 'foo',
			'display_name' => 'Foo Person'
		) );

		// Get the result of a non-default, but acceptable input for 'show' parameter to wp_dropdown_users().
		$found = wp_dropdown_users( array(
			'echo' => false,
			'show' => ''
		) );

		$expected = "<option value='$u'>Foo Person</option>";

		$this->assertContains( $expected, $found );
	}

	/**
	 * @ticket 31251
	 */
	public function test_show_should_display_user_property_when_the_value_of_show_is_a_valid_user_property() {

		// create a user with a different display_name
		$u = $this->factory->user->create( array(
			'user_login'   => 'foo',
			'display_name' => 'Foo Person'
		) );

		// Get the result of a non-default, but acceptable input for 'show' parameter to wp_dropdown_users().
		$found = wp_dropdown_users( array(
			'echo' => false,
			'show' => 'user_login'
		) );

		$expected = "<option value='$u'>foo</option>";

		$this->assertContains( $expected, $found );
	}

	/**
	 * @ticket 31251
	 */
	public function test_show_display_name_with_login() {

		// create a user with a different display_name
		$u = $this->factory->user->create( array(
			'user_login'   => 'foo',
			'display_name' => 'Foo Person'
		) );

		// Get the result of a non-default, but acceptable input for 'show' parameter to wp_dropdown_users().
		$found = wp_dropdown_users( array(
			'echo' => false,
			'show' => 'display_name_with_login'
		) );

		$expected = "<option value='$u'>Foo Person (foo)</option>";

		$this->assertContains( $expected, $found );
	}

	/**
	 * @ticket 31251
	 */
	public function test_include_selected() {
		$users = self::factory()->user->create_many( 2 );

		$found = wp_dropdown_users( array(
			'echo' => false,
			'include' => $users[0],
			'selected' => $users[1],
			'include_selected' => true,
			'show' => 'user_login',
		) );

		$user1 = get_userdata( $users[1] );
		$this->assertContains( $user1->user_login, $found );
	}
}
