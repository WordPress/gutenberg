<?php

/**
 * @group xmlrpc
 * @group user
 */
class Tests_XMLRPC_wp_getProfile extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getProfile( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_subscriber() {
		$subscriber_id = $this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getProfile( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $subscriber_id, $result['user_id'] );
		$this->assertContains( 'subscriber', $result['roles'] );
	}

	function test_administrator() {
		$administrator_id = $this->make_user_by_role( 'administrator' );

		$result = $this->myxmlrpcserver->wp_getProfile( array( 1, 'administrator', 'administrator' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $administrator_id, $result['user_id'] );
		$this->assertContains( 'administrator', $result['roles'] );
	}

	function test_arbitrary_fields() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$fields = array( 'email', 'bio', 'user_contacts' );

		$result = $this->myxmlrpcserver->wp_getProfile( array( 1, 'editor', 'editor', $fields ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $editor_id, $result['user_id'] );

		$expected_fields = array( 'user_id', 'email', 'bio' );
		$keys = array_keys( $result );
		sort( $expected_fields );
		sort( $keys );
		$this->assertEqualSets( $expected_fields, $keys );
	}
}
