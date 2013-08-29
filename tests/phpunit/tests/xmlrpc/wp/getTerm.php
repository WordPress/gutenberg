<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getTerm extends WP_XMLRPC_UnitTestCase {
	var $term;

	function setUp() {
		parent::setUp();

		$this->term = wp_insert_term( 'term' . rand_str() , 'category' );
		$this->assertInternalType( 'array', $this->term );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'username', 'password', 'category', 1 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'editor', 'editor', '', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'editor', 'editor', 'not_existing', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'subscriber', 'subscriber', 'category', $this->term['term_id'] ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'You are not allowed to assign terms in this taxonomy.' ), $result->message );
	}


	function test_empty_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'editor', 'editor', 'category', '' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( __('Empty Term'), $result->message );
	}

	function test_invalid_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'editor', 'editor', 'category', 9999 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
		$this->assertEquals( __('Invalid term ID'), $result->message );
	}

	function test_valid_term() {
		$this->make_user_by_role( 'editor' );

		$term = get_term( $this->term['term_id'], 'category', ARRAY_A );

		$result = $this->myxmlrpcserver->wp_getTerm( array( 1, 'editor', 'editor', 'category', $this->term['term_id'] ) );

		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $result, $term );

		// Check DataTypes
		$this->assertInternalType( 'string', $result['name'] );
		$this->assertInternalType( 'string', $result['slug'] );
		$this->assertInternalType( 'string', $result['taxonomy'] );
		$this->assertInternalType( 'string', $result['description'] );
		$this->assertInternalType( 'int', $result['count'] );

		// We expect all ID's to be strings not integers so we don't return something larger than an XMLRPC integer can describe.
		$this->assertStringMatchesFormat( '%d', $result['term_id'] );
		$this->assertStringMatchesFormat( '%d', $result['term_group'] );
		$this->assertStringMatchesFormat( '%d', $result['term_taxonomy_id'] );
		$this->assertStringMatchesFormat( '%d', $result['parent'] );

		// Check Data
		$this->assertEquals( 0, $result['count'] );
		$this->assertEquals( $term['name'], $result['name'] );
		$this->assertEquals( $term['slug'], $result['slug'] );
		$this->assertEquals( 'category', $result['taxonomy'] );
		$this->assertEquals( $term['description'], $result['description'] );
	}
}
