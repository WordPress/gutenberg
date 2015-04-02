<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_mw_editPost extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$post = array();
		$result = $this->myxmlrpcserver->mw_editPost( array( 1, 'username', 'password', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_edit_own_post() {
		$contributor_id = $this->make_user_by_role( 'contributor' );
		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$new_title = 'Post test (updated)';
		$post2 = array( 'title' => $new_title );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $new_title, $out->post_title );
	}

	function test_capable_edit_others_post() {
		$this->make_user_by_role( 'editor' );
		$contributor_id = $this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$new_title = 'Post test (updated)';
		$post2 = array( 'title' => $new_title );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'editor', 'editor', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $new_title, $out->post_title );
	}

	function test_incapable_edit_others_post() {
		$this->make_user_by_role( 'contributor' );
		$author_id = $this->make_user_by_role( 'author' );

		$original_title = 'Post test';
		$post = array( 'post_title' => $original_title, 'post_author' => $author_id );
		$post_id = wp_insert_post( $post );

		$new_title = 'Post test (updated)';
		$post2 = array( 'title' => $new_title );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post2 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );

		$out = get_post( $post_id );
		$this->assertEquals( $original_title, $out->post_title );
	}

	function test_capable_reassign_author() {
		$contributor_id = $this->make_user_by_role( 'contributor' );
		$author_id = $this->make_user_by_role( 'author' );
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$post2 = array( 'wp_author_id' => $author_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'editor', 'editor', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $author_id, $out->post_author );
	}

	function test_incapable_reassign_author() {
		$contributor_id = $this->make_user_by_role( 'contributor' );
		$author_id = $this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$post2 = array( 'wp_author_id' => $author_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post2 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );

		$out = get_post( $post_id );
		$this->assertEquals( $contributor_id, $out->post_author );
	}

	/**
	 * @ticket 24916
	 */
	function test_capable_reassign_author_to_self() {
		$contributor_id = $this->make_user_by_role( 'contributor' );
		$editor_id = $this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$post2 = array( 'wp_author_id' => $editor_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'editor', 'editor', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $editor_id, $out->post_author );
	}
	
	function test_post_thumbnail() {
		add_theme_support( 'post-thumbnails' );

		$author_id = $this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Post Thumbnail Test', 'post_author' => $author_id );
		$post_id = wp_insert_post( $post );

		$this->assertEquals( '', get_post_meta( $post_id, '_thumbnail_id', true ) );

		// create attachment
		$filename = ( DIR_TESTDATA.'/images/a2-small.jpg' );
		$contents = file_get_contents( $filename );
		$upload = wp_upload_bits( $filename, null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		$attachment = array(
			'post_title' => 'Post Thumbnail',
			'post_type' => 'attachment',
			'post_mime_type' => 'image/jpeg',
			'guid' => $upload['url']
		);
		$attachment_id = wp_insert_attachment( $attachment, $upload['file'], $post_id );

		// add post thumbnail to post that does not have one
		$post2 = array( 'wp_post_thumbnail' => $attachment_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'author', 'author', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// edit the post without supplying a post_thumbnail and check that it didn't change
		$post3 = array( 'post_content' => 'Updated post' );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'author', 'author', $post3 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// create another attachment
		$attachment2 = array_merge( $attachment, array( 'title' => 'Post Thumbnail 2' ) );
		$attachment2_id = wp_insert_attachment( $attachment2, $upload['file'], $post_id );

		// change the post's post_thumbnail
		$post4 = array( 'wp_post_thumbnail' => $attachment2_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'author', 'author', $post4 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment2_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// unset the post's post_thumbnail
		$post5 = array( 'wp_post_thumbnail' => '' );
		$result = $this->myxmlrpcserver->mw_editPost( array($post_id, 'author', 'author', $post5 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( '', get_post_meta( $post_id, '_thumbnail_id', true ) );

		remove_theme_support( 'post-thumbnails' );
	}

	function test_edit_basic_post_info() {
		$contributor_id = $this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Title', 'post_content' => 'Content', 'post_excerpt' => 'Excerpt', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$post2 = array( 'title' => 'New Title', 'post_author' => $contributor_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $post2['title'], $out->post_title );

		$post3 = array( 'description' => 'New Content', 'post_author' => $contributor_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post3 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $post2['title'], $out->post_title );
		$this->assertEquals( $post3['description'], $out->post_content );

		$post4 = array( 'mt_excerpt' => 'New Excerpt', 'post_author' => $contributor_id );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post4 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $post2['title'], $out->post_title );
		$this->assertEquals( $post3['description'], $out->post_content );
		$this->assertEquals( $post4['mt_excerpt'], $out->post_excerpt );
	}

	// Not allowed since [19914]
	function test_change_post_type() {
		$contributor_id = $this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Title', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$post2 = array( 'post_type' => 'page' );
		$result = $this->myxmlrpcserver->mw_editPost( array( $post_id, 'contributor', 'contributor', $post2 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $result->code, 401 );
	}
}
