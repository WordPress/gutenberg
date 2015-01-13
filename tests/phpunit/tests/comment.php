<?php

/**
 * @group comment
 */
class Tests_Comment extends WP_UnitTestCase {
	function test_wp_update_comment() {
		$post = $this->factory->post->create_and_get( array( 'post_title' => 'some-post', 'post_type' => 'post' ) );
		$comments = $this->factory->comment->create_post_comments( $post->ID, 5 );
		$result = wp_update_comment( array( 'comment_ID' => $comments[0], 'comment_parent' => $comments[1] ) );
		$this->assertEquals( 1, $result );
		$comment = get_comment( $comments[0] );
		$this->assertEquals( $comments[1], $comment->comment_parent );
		$result = wp_update_comment( array( 'comment_ID' => $comments[0], 'comment_parent' => $comments[1] ) );
		$this->assertEquals( 0, $result );
	}

	/**
	 * @ticket 30627
	 */
	function test_wp_update_comment_updates_comment_type() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		wp_update_comment( array( 'comment_ID' => $comment_id, 'comment_type' => 'pingback' ) );

		$comment = get_comment( $comment_id );
		$this->assertEquals( 'pingback', $comment->comment_type );
	}

	/**
	 * @ticket 30307
	 */
	function test_wp_update_comment_updates_user_id() {
		$post_id = $this->factory->post->create();
		$comment_id = $this->factory->comment->create( array( 'comment_post_ID' => $post_id ) );

		wp_update_comment( array( 'comment_ID' => $comment_id, 'user_id' => 1 ) );

		$comment = get_comment( $comment_id );
		$this->assertEquals( 1, $comment->user_id );
	}

	public function test_get_approved_comments() {
		$p = $this->factory->post->create();
		$ca1 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );
		$ca2 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );
		$ca3 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '0' ) );
		$c2 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'pingback' ) );
		$c3 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'trackback' ) );
		$c4 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'mario' ) );
		$c5 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1', 'comment_type' => 'luigi' ) );

		$found = get_approved_comments( $p );

		// all comments types will be returned
		$this->assertEquals( array( $ca1, $ca2, $c2, $c3, $c4, $c5 ), wp_list_pluck( $found, 'comment_ID' ) );
	}

	/**
	 * @ticket 30412
	 */
	public function test_get_approved_comments_with_post_id_0_should_return_empty_array() {
		$p = $this->factory->post->create();
		$ca1 = $this->factory->comment->create( array( 'comment_post_ID' => $p, 'comment_approved' => '1' ) );

		$found = get_approved_comments( 0 );

		$this->assertSame( array(), $found );
	}
}
