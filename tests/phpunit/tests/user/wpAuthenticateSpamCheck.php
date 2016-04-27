<?php

/**
 * @group user
 */
class Tests_User_WpAuthenticateSpamCheck extends WP_UnitTestCase {
	function test_wp_authenticate_spam_check_returns_user_when_single_site() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'This test applies to single site only.' );
		}

		$user_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$user = new WP_User( $user_id );
		$actual_user = wp_authenticate_spam_check( $user );
		wp_delete_user( $user_id );

		$this->assertEquals( $user->user_login, $actual_user->user_login );
	}

	function test_wp_authenticate_spam_check_returns_user_when_not_flagged() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test applies to multisite only.' );
		}

		$user_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		$user = new WP_User( $user_id );
		$actual_user = wp_authenticate_spam_check( $user );
		wpmu_delete_user( $user_id );

		$this->assertEquals( $user->user_login, $actual_user->user_login );
	}

	function test_wp_authenticate_spam_check_returns_wp_error_when_flagged() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'This test applies to multisite only.' );
		}

		$user_id = self::factory()->user->create( array( 'role' => 'contributor' ) );
		update_user_status( $user_id, 'spam', 1 );
		$user = new WP_User( $user_id );
		$actual_user = wp_authenticate_spam_check( $user );
		wpmu_delete_user( $user_id );

		$this->assertInstanceOf( 'WP_Error', $actual_user );
	}
}
