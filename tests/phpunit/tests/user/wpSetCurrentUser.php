<?php

/**
 * @group user
 */
class Tests_User_WpSetCurrentUser extends WP_UnitTestCase {
	public function test_set_by_id() {
		$u = self::$factory->user->create();

		$user = wp_set_current_user( $u );

		$this->assertSame( $u, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u, get_current_user_id() );
	}

	public function test_name_should_be_ignored_if_id_is_not_null() {
		$u = self::$factory->user->create();

		$user = wp_set_current_user( $u, 'foo' );

		$this->assertSame( $u, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u, get_current_user_id() );
	}

	public function test_should_set_by_name_if_id_is_null_and_current_user_is_nonempty() {
		$u1 = self::$factory->user->create();
		wp_set_current_user( $u1 );
		$this->assertSame( $u1, get_current_user_id() );

		$u2 = self::$factory->user->create( array(
			'user_login' => 'foo',
		) );

		$user = wp_set_current_user( null, 'foo' );

		$this->assertSame( $u2, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u2, get_current_user_id() );
	}

	/**
	 * Test that you can set the current user by the name parameter when the current user is 0.
	 *
	 * @ticket 20845
	 */
	public function test_should_set_by_name_if_id_is_null() {
		wp_set_current_user( 0 );
		$this->assertSame( 0, get_current_user_id() );

		$u = self::$factory->user->create( array(
			'user_login' => 'foo',
		) );

		$user = wp_set_current_user( null, 'foo' );

		$this->assertSame( $u, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u, get_current_user_id() );
	}
}

