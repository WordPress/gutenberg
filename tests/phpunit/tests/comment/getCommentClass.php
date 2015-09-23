<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentClass extends WP_UnitTestCase {
	public function test_should_accept_comment_id() {
		$post_id    = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( '', $comment_id );
		$this->assertContains( 'comment', $classes );
	}

	public function test_should_accept_comment_object() {
		$post_id = $this->factory->post->create();
		$comment = $this->factory->comment->create_and_get( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( '', $comment );
		$this->assertContains( 'comment', $classes );
	}

	public function test_should_append_single_class() {
		$post_id    = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( 'foo', $comment_id );
		$this->assertContains( 'foo', $classes );
	}

	public function test_should_append_array_of_classes() {
		$post_id    = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		$classes = get_comment_class( array( 'foo', 'bar' ), $comment_id );
		$this->assertContains( 'foo', $classes );
		$this->assertContains( 'bar', $classes );
	}
}
