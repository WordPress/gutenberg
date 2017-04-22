<?php

/**
 * @group user
 */
class Tests_User_CountUsers extends WP_UnitTestCase {

	/**
	 * @ticket 22993
	 *
	 * @dataProvider data_count_users_strategies
	 * @group ms-excluded
	 */
	public function test_count_users_is_accurate( $strategy ) {

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
		$author = self::factory()->user->create( array(
			'role' => 'author',
		) );
		$contributor = self::factory()->user->create( array(
			'role' => 'contributor',
		) );
		$subscriber = self::factory()->user->create( array(
			'role' => 'subscriber',
		) );
		$none = self::factory()->user->create( array(
			'role' => '',
		) );
		$nobody = self::factory()->user->create( array(
			'role' => '',
		) );

		// Test user counts
		$count = count_users( $strategy );

		$this->assertEquals( 8, $count['total_users'] );
		$this->assertEquals( array(
			'administrator' => 2,
			'editor'        => 1,
			'author'        => 1,
			'contributor'   => 1,
			'subscriber'    => 1,
			'none'          => 2,
		), $count['avail_roles'] );

	}

	/**
	 * @ticket 22993
	 * @group multisite
	 * @group ms-required
	 *
	 * @dataProvider data_count_users_strategies
	 */
	public function test_count_users_multisite_is_accurate( $strategy ) {

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
		$author = self::factory()->user->create( array(
			'role' => 'author',
		) );
		$contributor = self::factory()->user->create( array(
			'role' => 'contributor',
		) );
		$subscriber = self::factory()->user->create( array(
			'role' => 'subscriber',
		) );
		$none = self::factory()->user->create( array(
			'role' => '',
		) );
		$nobody = self::factory()->user->create( array(
			'role' => '',
		) );

		// Setup blogs
		$blog_1 = (int) self::factory()->blog->create( array(
			'user_id' => $editor,
		) );
		$blog_2 = (int) self::factory()->blog->create( array(
			'user_id' => $author,
		) );

		// Add users to blogs
		add_user_to_blog( $blog_1, $subscriber, 'editor' );
		add_user_to_blog( $blog_2, $none, 'contributor' );

		// Test users counts on root site
		$count = count_users( $strategy );

		$this->assertEquals( 8, $count['total_users'] );
		$this->assertEquals( array(
			'administrator' => 2,
			'editor'        => 1,
			'author'        => 1,
			'contributor'   => 1,
			'subscriber'    => 1,
			'none'          => 0,
		), $count['avail_roles'] );

		// Test users counts on blog 1
		switch_to_blog( $blog_1 );
		$count = count_users( $strategy );
		restore_current_blog();

		$this->assertEquals( 2, $count['total_users'] );
		$this->assertEquals( array(
			'administrator' => 1,
			'editor'        => 1,
			'none'          => 0,
		), $count['avail_roles'] );

		// Test users counts on blog 2
		switch_to_blog( $blog_2 );
		$count = count_users( $strategy );
		restore_current_blog();

		$this->assertEquals( 2, $count['total_users'] );
		$this->assertEquals( array(
			'administrator' => 1,
			'contributor'   => 1,
			'none'          => 0,
		), $count['avail_roles'] );

	}

	/**
	 * @ticket 34495
	 *
	 * @dataProvider data_count_users_strategies
	 */
	public function test_count_users_is_accurate_with_multiple_roles( $strategy ) {

		// Setup users
		$admin = self::factory()->user->create( array(
			'role' => 'administrator',
		) );
		$editor = self::factory()->user->create( array(
			'role' => 'editor',
		) );

		get_userdata( $editor )->add_role( 'author' );

		$this->assertEquals( array(
			'editor',
			'author'
		), get_userdata( $editor )->roles );

		// Test user counts
		$count = count_users( $strategy );

		$this->assertEquals( 3, $count['total_users'] );
		$this->assertEquals( array(
			'administrator' => 2,
			'editor'        => 1,
			'author'        => 1,
			'none'          => 0,
		), $count['avail_roles'] );

	}

	function data_count_users_strategies() {
		return array(
			array(
				'time',
			),
			array(
				'memory',
			),
		);
	}

}
