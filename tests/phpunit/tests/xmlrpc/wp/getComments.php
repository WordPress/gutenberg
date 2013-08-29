<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getComments extends WP_XMLRPC_UnitTestCase {
	var $post_id;

	function setUp() {
		parent::setUp();

		$this->post_id = $this->factory->post->create();
		$this->factory->comment->create_post_comments( $this->post_id, 15 );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getComments( array( 1, 'username', 'password', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'contributor' );

		$result = $this->myxmlrpcserver->wp_getComments( array( 1, 'contributor', 'contributor', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_user() {
		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array() ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$comment = get_comment( $result['comment_id'], ARRAY_A );
			$this->assertEquals( $comment['comment_post_ID'], $result['post_id'] );
		}
	}

	function test_post_filter() {
		$this->make_user_by_role( 'editor' );

		$filter = array(
			'post_id' => $this->post_id
		);
		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$this->assertEquals( $this->post_id, $result['post_id'] );
		}
	}

	function test_number_filter() {
		$this->make_user_by_role( 'editor' );

		$filter = array(
			'post_id' => $this->post_id,
		);
		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		// if no 'number' filter is specified, default should be 10
		$this->assertEquals( 10, count( $results ) );

		// explicitly set a 'number' filter and verify that only that many are returned
		$filter['number'] = 5;
		$results2 = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$this->assertEquals( 5, count( $results2 ) );
	}
}