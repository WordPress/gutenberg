<?php

/**
 * @group post
 */
class Tests_Post_WpPost extends WP_UnitTestCase {
	protected static $post_id;

	public static function wpSetUpBeforeClass( $factory ) {
		global $wpdb;

		// Ensure that there is a post with ID 1.
		if ( ! get_post( 1 ) ) {
			$wpdb->insert( $wpdb->posts, array(
				'ID' => 1,
				'post_title' => 'Post 1',
			) );
		}

		self::$post_id = self::factory()->post->create();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( 1, true );
		wp_delete_post( self::$post_id, true );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_work_for_numeric_string() {
		$found = WP_Post::get_instance( (string) self::$post_id );

		$this->assertSame( self::$post_id, $found->ID );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_negative_number() {
		$found = WP_Post::get_instance( -self::$post_id );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_non_numeric_string() {
		$found = WP_Post::get_instance( 'abc' );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_bool() {
		$found = WP_Post::get_instance( true );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_succeed_for_float_that_is_equal_to_post_id() {
		$found = WP_Post::get_instance( 1.0 );

		$this->assertSame( 1, $found->ID );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_float() {
		$found = WP_Post::get_instance( 1.6 );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_array() {
		$found = WP_Post::get_instance( array( 1 ) );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_class() {
		$class = new stdClass();
		$found = WP_Post::get_instance( $class );

		$this->assertFalse( $found );
	}
}
