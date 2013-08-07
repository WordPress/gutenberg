<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_deletePost extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_deletePost( array( 1, 'username', 'password', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_invalid_post() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_deletePost( array( 1, 'editor', 'editor', 340982340 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );
		$post_id = $this->factory->post->create();

		$result = $this->myxmlrpcserver->wp_deletePost( array( 1, 'subscriber', 'subscriber', $post_id ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_post_deleted() {
		$this->make_user_by_role( 'editor' );
		$post_id = $this->factory->post->create();

		$result = $this->myxmlrpcserver->wp_deletePost( array( 1, 'editor', 'editor', $post_id ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue( $result );

		$post = get_post( $post_id );
		$this->assertEquals( 'trash', $post->post_status );
	}
}