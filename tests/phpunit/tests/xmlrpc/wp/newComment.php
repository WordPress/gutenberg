<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_newComment extends WP_XMLRPC_UnitTestCase {

	function test_valid_comment() {
		$this->make_user_by_role( 'administrator' );
		$post = self::factory()->post->create_and_get();
 
		$result = $this->myxmlrpcserver->wp_newComment( array( 1, 'administrator', 'administrator', $post->ID, array(
			'content' => rand_str( 100 )
		) ) );
 
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}
 
	function test_empty_comment() {
		$this->make_user_by_role( 'administrator' );
		$post = self::factory()->post->create_and_get();
 
		$result = $this->myxmlrpcserver->wp_newComment( array( 1, 'administrator', 'administrator', $post->ID, array(
			'content' => ''
		) ) );
 
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_new_comment_post_closed() {
		$this->make_user_by_role( 'administrator' );
		$post = self::factory()->post->create_and_get( array(
			'comment_status' => 'closed'
		) );

		$this->assertEquals( 'closed', $post->comment_status );

		$result = $this->myxmlrpcserver->wp_newComment( array( 1, 'administrator', 'administrator', $post->ID, array(
			'content' => rand_str( 100 ),
		) ) );

		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_new_comment_duplicated() {
		$this->make_user_by_role( 'administrator' );
		$post = self::factory()->post->create_and_get();

		$comment_args = array( 1, 'administrator', 'administrator', $post->ID, array(
			'content' => rand_str( 100 ),
		) );

		// First time it's a valid comment
		$result = $this->myxmlrpcserver->wp_newComment( $comment_args  );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Run second time for duplication error
		$result = $this->myxmlrpcserver->wp_newComment( $comment_args );

		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

}
