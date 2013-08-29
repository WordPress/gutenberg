<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getTaxonomy extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'username', 'password', 'category' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'editor', 'editor', '' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'editor', 'editor', 'not_existing' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'subscriber', 'subscriber', 'category' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'You are not allowed to assign terms in this taxonomy.' ), $result->message );
	}

	function test_taxonomy_validated() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'editor', 'editor', 'category' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_prepare_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTaxonomy( array( 1, 'editor', 'editor', 'category' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$taxonomy = get_taxonomy( 'category' );
		$this->assertEquals( 'category', $result['name'], 'name' );
		$this->assertEquals( true, $result['_builtin'], '_builtin' );
		$this->assertEquals( $taxonomy->show_ui, $result['show_ui'], 'show_ui' );
		$this->assertEquals( $taxonomy->public, $result['public'], 'public' );
		$this->assertEquals( $taxonomy->hierarchical, $result['hierarchical'], 'hierarchical' );
		$this->assertEquals( (array) $taxonomy->labels, $result['labels'], 'labels' );
		$this->assertEquals( (array) $taxonomy->cap, $result['cap'], 'capabilities' );
		$this->assertEquals( (array) $taxonomy->object_type, $result['object_type'], 'object_types' );
	}
}