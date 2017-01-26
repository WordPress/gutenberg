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
	public function test_get_instance_should_succeed_for_float_that_is_equal_to_post_id() {
		$found = WP_Post::get_instance( 1.0 );

		$this->assertSame( 1, $found->ID );
	}
}
