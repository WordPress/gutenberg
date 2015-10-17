<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentClass extends WP_UnitTestCase {
	public function test_should_accept_comment_id() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( '', $comment_id );
		$this->assertContains( 'comment', $classes );
	}

	public function test_should_accept_comment_object() {
		$post_id = self::factory()->post->create();
		$comment = self::factory()->comment->create_and_get( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( '', $comment );
		$this->assertContains( 'comment', $classes );
	}

	public function test_should_append_single_class() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( 'foo', $comment_id );
		$this->assertContains( 'foo', $classes );
	}

	public function test_should_append_array_of_classes() {
		$post_id    = self::factory()->post->create();
		$comment_id = self::factory()->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( array( 'foo', 'bar' ), $comment_id );
		$this->assertContains( 'foo', $classes );
		$this->assertContains( 'bar', $classes );
	}

	/**
	 * @ticket 33947
	 */
	public function test_should_return_an_empty_array_for_invalid_comment_id() {
		$this->assertSame( array(), get_comment_class( 'foo', 12345 ) );
	}
}
