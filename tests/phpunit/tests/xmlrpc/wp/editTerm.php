<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_editTerm extends WP_XMLRPC_UnitTestCase {
	var $parent_term;
	var $child_term;
	var $post_tag;

	function setUp() {
		parent::setUp();

		$this->parent_term = wp_insert_term( 'parent' . rand_str() , 'category' );
		$this->assertInternalType( 'array', $this->parent_term );
		$this->child_term = wp_insert_term( 'child' . rand_str() , 'category' );
		$this->assertInternalType( 'array', $this->child_term );
		$this->post_tag = wp_insert_term( 'test' . rand_str() , 'post_tag' );
		$this->assertInternalType( 'array', $this->post_tag );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'username', 'password', 'category', 1 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'subscriber', 'subscriber', '', array( 'taxonomy' => '' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'subscriber', 'subscriber', $this->parent_term['term_id'], array( 'taxonomy' => 'not_existing' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'subscriber', 'subscriber', $this->parent_term['term_id'], array( 'taxonomy' => 'category' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'You are not allowed to edit terms in this taxonomy.' ), $result->message );
	}

	function test_term_not_exists() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', 9999, array( 'taxonomy' => 'category' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
		$this->assertEquals(  __( 'Invalid term ID' ), $result->message );
	}

	function test_empty_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', '', array( 'taxonomy' => 'category' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( __('Empty Term'), $result->message );
	}

	function test_empty_term_name() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->parent_term['term_id'], array( 'taxonomy' => 'category', 'name' => '' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'The term name cannot be empty.' ), $result->message );
	}

	function test_parent_for_nonhierarchical() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->post_tag['term_id'], array( 'taxonomy' => 'post_tag', 'parent' => $this->parent_term['term_id'] ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( "This taxonomy is not hierarchical so you can't set a parent." ), $result->message );
	}

	function test_parent_empty() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->child_term['term_id'], array( 'taxonomy' => 'category', 'parent' => '', 'name' => 'test' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( __('Empty Term'), $result->message );
	}

	function test_parent_invalid() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->child_term['term_id'], array( 'taxonomy' => 'category', 'parent' => 'dasda', 'name' => 'test' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
	}

	function test_parent_not_existing() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->child_term['term_id'], array( 'taxonomy' => 'category', 'parent' => 9999, 'name' => 'test' ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Parent term does not exist.' ), $result->message );
	}

	function test_parent_duplicate_slug() {
		$this->make_user_by_role( 'editor' );

		$parent_term = get_term_by( 'id', $this->parent_term['term_id'], 'category' );
		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->child_term['term_id'], array( 'taxonomy' => 'category', 'slug' => $parent_term->slug ) ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( htmlspecialchars( sprintf( __('The slug &#8220;%s&#8221; is already in use by another term'), $parent_term->slug ) ), $result->message );
	}

	function test_edit_all_fields() {
		$this->make_user_by_role( 'editor' );

		$fields = array( 'taxonomy' => 'category', 'name' => 'Child 2', 'parent' => $this->parent_term['term_id'], 'description' => 'Child term', 'slug' => 'child_2' );
		$result = $this->myxmlrpcserver->wp_editTerm( array( 1, 'editor', 'editor', $this->child_term['term_id'], $fields ) );

		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertInternalType( 'boolean', $result );
	}
}
