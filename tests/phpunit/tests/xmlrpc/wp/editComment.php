<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_editComment extends WP_XMLRPC_UnitTestCase {
	function test_trash_comment() {
		$this->make_user_by_role( 'administrator' );
		$post_id = $this->factory->post->create();

		$comment_data = array(
			'comment_post_ID' => $post_id,
			'comment_author' => 'Test commenter',
			'comment_author_url' => 'http://example.com/',
			'comment_author_email' => 'example@example.com',
			'comment_content' => rand_str( 100 ),
			'comment_approved' => '1'
		);
		$comment_id = wp_insert_comment( $comment_data );

		$this->assertEquals( '1', get_comment( $comment_id )->comment_approved );

		$this->myxmlrpcserver->wp_editComment( array( 1, 'administrator', 'administrator', $comment_id, array(
			'status' => 'trash'
		) ) );

		$this->assertEquals( 'trash', get_comment( $comment_id )->comment_approved );
	}
}