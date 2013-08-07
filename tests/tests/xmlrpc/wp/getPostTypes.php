<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPostTypes extends WP_XMLRPC_UnitTestCase {
	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getPostTypes( array( 1, 'username', 'password', 'post' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getPostTypes( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertInternalType( 'array', $result );
		$this->assertEquals( 0, count( $result ) );
	}

	function test_capable_user() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPostTypes( array( 1, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertInternalType( 'array', $result );
		$this->assertGreaterThan( 0, count( $result ) );
	}

	function test_simple_filter() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPostTypes( array( 1, 'editor', 'editor', array( 'hierarchical' => true ) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertInternalType( 'array', $result );

		// verify that pages is in the result, and post is not
		$result_names = wp_list_pluck( $result, 'name' );
		$this->assertContains( 'page', $result_names );
		$this->assertNotContains( 'post', $result_names );
	}
}