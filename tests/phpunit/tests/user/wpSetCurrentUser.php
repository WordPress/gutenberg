<?php

/**
 * @group user
 */
class Tests_User_WpSetCurrentUser extends WP_UnitTestCase {
	public function test_set_by_id() {
		$u = $this->factory->user->create();

		$user = wp_set_current_user( $u );

		$this->assertSame( $u, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u, get_current_user_id() );
	}

	public function test_name_should_be_ignored_if_id_is_not_null() {
		$u = $this->factory->user->create();

		$user = wp_set_current_user( $u, 'foo' );

		$this->assertSame( $u, $user->ID );
		$this->assertEquals( $user, wp_get_current_user() );
		$this->assertSame( $u, get_current_user_id() );
	}
}

