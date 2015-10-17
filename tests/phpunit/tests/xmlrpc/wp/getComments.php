<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getComments extends WP_XMLRPC_UnitTestCase {
	var $post_id;

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
		$this->post_id = self::factory()->post->create();
		self::factory()->comment->create_post_comments( $this->post_id, 2 );

		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array() ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$comment = get_comment( $result['comment_id'], ARRAY_A );
			$this->assertEquals( $comment['comment_post_ID'], $result['post_id'] );
		}
	}

	function test_post_filter() {
		$this->post_id = self::factory()->post->create();
		self::factory()->comment->create_post_comments( $this->post_id, 2 );

		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array(
			'post_id' => $this->post_id
		) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$this->assertEquals( $this->post_id, $result['post_id'] );
		}
	}

	function test_number_filter() {
		$this->post_id = self::factory()->post->create();
		self::factory()->comment->create_post_comments( $this->post_id, 11 );

		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array(
			'post_id' => $this->post_id,
		) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		// if no 'number' filter is specified, default should be 10
		$this->assertCount( 10, $results );

		$results2 = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array(
			'post_id' => $this->post_id,
			'number' => 5
		) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$this->assertCount( 5, $results2 );
	}

	function test_contributor_capabilities() {
		$this->make_user_by_role( 'contributor' );
		$author_id = $this->make_user_by_role( 'author' );
		$author_post_id = self::factory()->post->create( array(
			'post_title' => 'Author',
			'post_author' => $author_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create( array(
			'comment_post_ID' => $author_post_id,
			'comment_author' => "Commenter 1",
			'comment_author_url' => "http://example.com/1/",
			'comment_approved' => 0,
		) );

		$editor_id = $this->make_user_by_role( 'editor' );
		$editor_post_id = self::factory()->post->create( array(
			'post_title' => 'Editor',
			'post_author' => $editor_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create( array(
			'comment_post_ID' => $editor_post_id,
			'comment_author' => 'Commenter 2',
			'comment_author_url' => 'http://example.com/2/',
			'comment_approved' => 0,
		) );

		$result = $this->myxmlrpcserver->wp_getComments( array( 1, 'contributor', 'contributor' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_author_capabilities() {
		$author_id = $this->make_user_by_role( 'author' );
		$author_post_id = self::factory()->post->create( array(
			'post_title' => 'Author',
			'post_author' => $author_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create( array(
			'comment_post_ID' => $author_post_id,
			'comment_author' => 'Commenter 1',
			'comment_author_url' => 'http://example.com/1/',
			'comment_approved' => 1,
		) );

		$editor_id = $this->make_user_by_role( 'editor' );
		$editor_post_id = self::factory()->post->create( array(
			'post_title' => 'Editor',
			'post_author' => $editor_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create( array(
			'comment_post_ID' => $editor_post_id,
			'comment_author' => 'Commenter 2',
			'comment_author_url' => 'http://example.com/2/',
			'comment_approved' => 0,
		) );

		$result1 = $this->myxmlrpcserver->wp_getComments( array( 1, 'author', 'author', array(
			'post_id' => $author_post_id
		) ) );
		$this->assertInstanceOf( 'IXR_Error', $result1 );

		$result2 = $this->myxmlrpcserver->wp_getComments( array( 1, 'author', 'author', array(
			'status' => 'approve',
			'post_id' => $author_post_id
		) ) );

		$this->assertInternalType( 'array', $result2 );
		$this->assertCount( 1, $result2 );

		$result3 = $this->myxmlrpcserver->wp_getComments( array( 1, 'author', 'author', array(
			'post_id' => $editor_post_id
		) ) );
		$this->assertInstanceOf( 'IXR_Error', $result3 );

		$result4 = $this->myxmlrpcserver->wp_getComments( array( 1, 'author', 'author', array(
			'status' => 'approve',
			'post_id' => $author_post_id
		) ) );

		$this->assertInternalType( 'array', $result4 );
		$this->assertCount( 1, $result4 );
	}

	function test_editor_capabilities() {
		$author_id = $this->make_user_by_role( 'author' );
		$author_post_id = self::factory()->post->create( array(
			'post_title' => 'Author',
			'post_author' => $author_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create( array(
			'comment_post_ID' => $author_post_id,
			'comment_author' => 'Commenter 1',
			'comment_author_url' => 'http://example.com/1/',
			'comment_approved' => 1,
		));

		$editor_id = $this->make_user_by_role( 'editor' );
		$editor_post_id = self::factory()->post->create( array(
			'post_title' => 'Editor',
			'post_author' => $editor_id,
			'post_status' => 'publish'
		) );

		self::factory()->comment->create(array(
			'comment_post_ID' => $editor_post_id,
			'comment_author' => 'Commenter 2',
			'comment_author_url' => 'http://example.com/2/',
			'comment_approved' => 0,
		));

		$result = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array(
			'post_id' => $author_post_id
		) ) );
		$this->assertInternalType( 'array', $result );
		$this->assertCount( 1, $result );

		$result2 = $this->myxmlrpcserver->wp_getComments( array( 1, 'editor', 'editor', array(
			'status' => 'approve',
			'post_id' => $author_post_id
		) ) );

		$this->assertInternalType( 'array', $result2 );
		$this->assertCount( 1, $result2 );
	}
}
