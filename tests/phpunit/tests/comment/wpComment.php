<?php

/**
 * @group comment
 */
class Tests_Term_WpComment extends WP_UnitTestCase {
	protected static $comment_id;

	public static function wpSetUpBeforeClass( $factory ) {
		global $wpdb;

		// Ensure that there is a comment with ID 1.
		$comment_1 = WP_Comment::get_instance( 1 );
		if ( ! $comment_1 ) {
			$wpdb->insert( $wpdb->comments, array(
				'comment_ID' => 1,
			) );

			clean_comment_cache( 1 );
		}

		self::$comment_id = self::factory()->comment->create();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_comment( 1, true );
		wp_delete_comment( self::$comment_id, true );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_work_for_numeric_string() {
		$found = WP_Comment::get_instance( (string) self::$comment_id );

		$this->assertEquals( self::$comment_id, $found->comment_ID );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_negative_number() {
		$found = WP_Comment::get_instance( -self::$comment_id );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_non_numeric_string() {
		$found = WP_Comment::get_instance( 'abc' );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_bool() {
		$found = WP_Comment::get_instance( true );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_succeed_for_float_that_is_equal_to_post_id() {
		$found = WP_Comment::get_instance( 1.0 );

		$this->assertEquals( 1, $found->comment_ID );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_float() {
		$found = WP_Comment::get_instance( 1.6 );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_array() {
		$found = WP_Comment::get_instance( array( 1 ) );

		$this->assertFalse( $found );
	}

	/**
	 * @ticket 37738
	 */
	public function test_get_instance_should_fail_for_class() {
		$class = new stdClass();
		$found = WP_Comment::get_instance( $class );

		$this->assertFalse( $found );
	}
}
