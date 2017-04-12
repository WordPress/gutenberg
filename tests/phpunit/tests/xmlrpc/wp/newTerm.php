<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_newTerm extends WP_XMLRPC_UnitTestCase {

	protected static $parent_term_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$parent_term_id = $factory->term->create( array(
			'taxonomy' => 'category',
		) );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'username', 'password', array() ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => '' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy.' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'not_existing' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy.' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'subscriber', 'subscriber', array( 'taxonomy' => 'category' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'Sorry, you are not allowed to create terms in this taxonomy.' ), $result->message );
	}

	function test_empty_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'category', 'name' => '' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'The term name cannot be empty.' ), $result->message );
	}

	function test_parent_for_nonhierarchical() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'post_tag', 'parent' => self::$parent_term_id, 'name' => 'test' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'This taxonomy is not hierarchical.' ), $result->message );
	}

	function test_parent_invalid() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'category', 'parent' => 'dasda', 'name' => 'test' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 500, $result->code );
	}

	function test_parent_not_existing() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'category', 'parent' => 9999, 'name' => 'test' ) ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Parent term does not exist.' ), $result->message );
	}


	function test_add_term() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'category', 'name' => 'test' ) ) );
		$this->assertNotIXRError( $result );
		$this->assertStringMatchesFormat( '%d', $result );
	}

	function test_add_term_with_parent() {
		$this->make_user_by_role( 'editor' );

		$result  = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', array( 'taxonomy' => 'category', 'parent' => self::$parent_term_id, 'name' => 'test' ) ) );
		$this->assertNotIXRError( $result );
		$this->assertStringMatchesFormat( '%d', $result );
	}

	function test_add_term_with_all() {
		$this->make_user_by_role( 'editor' );

		$taxonomy = array( 'taxonomy' => 'category', 'parent' => self::$parent_term_id, 'name' => 'test_all', 'description' => 'Test all', 'slug' => 'test_all' );
		$result  = $this->myxmlrpcserver->wp_newTerm( array( 1, 'editor', 'editor', $taxonomy ) );
		$this->assertNotIXRError( $result );
		$this->assertStringMatchesFormat( '%d', $result );
	}
}
