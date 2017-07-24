<?php

/**
 * @group comment
 */
class Tests_Comment_GetCommentAuthorUrl extends WP_UnitTestCase {
	public function get_comment_author_url_filter( $url, $id, $comment ) {
		$this->assertSame( $id, $comment->comment_ID );

		return $url;
	}

	/**
	 * @ticket 41334
	 */
	public function test_comment_author_url_passes_correct_comment_id() {
		$comment = self::factory()->comment->create_and_get( array(
			'comment_post_ID' => 0,
		) );

		add_filter( 'get_comment_author_url', array( $this, 'get_comment_author_url_filter' ), 99, 3 );

		get_comment_author_url( $comment );

		remove_filter( 'get_comment_author_url', array( $this, 'get_comment_author_url_filter' ), 99 );
	}
}
