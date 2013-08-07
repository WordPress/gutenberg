<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_deleteTerm extends WP_XMLRPC_UnitTestCase {
	var $term;

	function setUp() {
		parent::setUp();

		$this->term = wp_insert_term( 'term' . rand_str() , 'category' );
		$this->assertInternalType( 'array', $this->term );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'username', 'password', 'category', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'subscriber', 'subscriber', '', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'subscriber', 'subscriber', 'not_existing', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'subscriber', 'subscriber', 'category', $this->term['term_id'] ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'You are not allowed to delete terms in this taxonomy.' ), $result->message );
	}

	function test_empty_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'editor', 'editor', 'category', '' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( __('Empty Term'), $result->message );
	}

	function test_invalid_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'editor', 'editor', 'category', 9999 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
		$this->assertEquals( __('Invalid term ID'), $result->message );
	}

	function test_term_deleted() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_deleteTerm( array( 1, 'editor', 'editor', 'category', $this->term['term_id'] ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertInternalType( 'boolean', $result );
	}
}
