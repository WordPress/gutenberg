<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_restoreRevision extends WP_XMLRPC_UnitTestCase {
	var $post_id;
	var $revision_id;

	function setUp() {
		parent::setUp();

		$this->post_id = $this->factory->post->create( array( 'post_content' => 'edit1' ) ); // Not saved as a revision
		// First saved revision on update, see https://core.trac.wordpress.org/changeset/24650
		wp_insert_post( array( 'ID' => $this->post_id, 'post_content' => 'edit2' ) ); 

		$revisions = wp_get_post_revisions( $this->post_id );
		//$revision = array_shift( $revisions ); // First revision is empty - https://core.trac.wordpress.org/changeset/23842
		// First revision is NOT empty, see https://core.trac.wordpress.org/changeset/24650
		$revision = array_shift( $revisions );
		$this->revision_id = $revision->ID;
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_restoreRevision( array( 1, 'username', 'password', $this->revision_id ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_restoreRevision( array( 1, 'subscriber', 'subscriber', $this->revision_id ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_user() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_restoreRevision( array( 1, 'editor', 'editor', $this->revision_id ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_revision_restored() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_restoreRevision( array( 1, 'editor', 'editor', $this->revision_id ) );
		$this->assertTrue( $result );
		$this->assertEquals( 'edit2', get_post( $this->post_id )->post_content );
	}
}
