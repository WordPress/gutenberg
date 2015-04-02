<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_editPost extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'username', 'password', 0, array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_edit_own_post() {
		$contributor_id = $this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$new_title = 'Post test (updated)';
		$post2 = array( 'post_title' => $new_title );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'contributor', 'contributor', $post_id, $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $new_title, $out->post_title );
	}

	function test_capable_edit_others_post() {
		$contributor_id = $this->make_user_by_role( 'contributor' );
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );

		$new_title = 'Post test (updated)';
		$post2 = array( 'post_title' => $new_title );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $post2 ) );
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
		$post2 = array( 'post_title' => $new_title );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'contributor', 'contributor', $post_id, $post2 ) );
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

		$post2 = array( 'post_author' => $author_id );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $post2 ) );
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

		$post2 = array( 'post_author' => $author_id );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'contributor', 'contributor', $post_id, $post2 ) );
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

		$post2 = array( 'post_author' => $editor_id );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $post2 ) );
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
		$post2 = array( 'post_thumbnail' => $attachment_id );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'author', 'author', $post_id, $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// fetch the post to verify that it appears
		$result = $this->myxmlrpcserver->wp_getPost( array( 1, 'author', 'author', $post_id ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertArrayHasKey( 'post_thumbnail', $result );
		$this->assertInternalType( 'array', $result['post_thumbnail'] );
		$this->assertEquals( $attachment_id, $result['post_thumbnail']['attachment_id'] );

		// edit the post without supplying a post_thumbnail and check that it didn't change
		$post3 = array( 'post_content' => 'Updated post' );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'author', 'author', $post_id, $post3 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// create another attachment
		$attachment2 = array_merge( $attachment, array( 'post_title' => 'Post Thumbnail 2' ) );
		$attachment2_id = wp_insert_attachment( $attachment2, $upload['file'], $post_id );

		// change the post's post_thumbnail
		$post4 = array( 'post_thumbnail' => $attachment2_id );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'author', 'author', $post_id, $post4 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment2_id, get_post_meta( $post_id, '_thumbnail_id', true ) );

		// unset the post's post_thumbnail
		$post5 = array( 'post_thumbnail' => '' );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'author', 'author', $post_id, $post5 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( '', get_post_meta( $post_id, '_thumbnail_id', true ) );

		// use invalid ID
		$post6 = array( 'post_thumbnail' => 398420983409 );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'author', 'author', $post_id, $post6 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );

		remove_theme_support( 'post-thumbnails' );
	}

	function test_edit_custom_fields() {
		$contributor_id = $this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Post test', 'post_author' => $contributor_id );
		$post_id = wp_insert_post( $post );
		$mid_edit   = add_post_meta( $post_id, 'custom_field_key', '12345678' );
		$mid_delete = add_post_meta( $post_id, 'custom_field_to_delete', '12345678' );

		$new_title = 'Post test (updated)';
		$post2 = array(
			'post_title' => $new_title,
			'custom_fields' =>
				array(
					array( 'id' => $mid_delete ),
					array( 'id' => $mid_edit, 'key' => 'custom_field_key', 'value' => '87654321' ),
					array( 'key' => 'custom_field_to_create', 'value' => '12345678' )
				)
		);

		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'contributor', 'contributor', $post_id, $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue($result);

		$out = get_post( $post_id );
		$this->assertEquals( $new_title, $out->post_title );

		$edited_object = get_metadata_by_mid( 'post', $mid_edit );
		$this->assertEquals( '87654321', $edited_object->meta_value );
		$this->assertFalse( get_metadata_by_mid( 'post', $mid_delete ) );

		$created_object = get_post_meta( $post_id, 'custom_field_to_create', true );
		$this->assertEquals( $created_object, '12345678' );
	}

	function test_capable_unsticky() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$post_id = $this->factory->post->create( array( 'post_author' => $editor_id ) );
		stick_post( $post_id );

		$post2 = array( 'sticky' => false );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertFalse( is_sticky( $post_id ) );
	}

	function test_password_transition_unsticky() {
		// when transitioning to private status or adding a post password, post should be un-stuck
		$editor_id = $this->make_user_by_role( 'editor' );
		$post_id = $this->factory->post->create( array( 'post_author' => $editor_id ) );
		stick_post( $post_id );

		$post2 = array( 'post_password' => 'foobar',  'sticky' => false );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $post2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertFalse( is_sticky( $post_id ) );
	}

	function test_if_not_modified_since() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$yesterday = strtotime( '-1 day' );

		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Post Revision Test',
			'post_content' => 'Not edited',
			'post_author'  => $editor_id,
			'post_status'  => 'publish',
			'post_date'    => date( 'Y-m-d H:i:s', $yesterday ),
		) );

		// Modify the day old post. In this case, we think it was last modified yesterday.
		$struct = array( 'post_content' => 'First edit', 'if_not_modified_since' => new IXR_Date( $yesterday ) );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $struct ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Make sure the edit went through.
		$this->assertEquals( 'First edit', get_post( $post_id )->post_content );

		// Modify it again. We think it was last modified yesterday, but we actually just modified it above.
		$struct = array( 'post_content' => 'Second edit', 'if_not_modified_since' => new IXR_Date( $yesterday ) );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $struct ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 409, $result->code );

		// Make sure the edit did not go through.
		$this->assertEquals( 'First edit', get_post( $post_id )->post_content );
	}

	function test_edit_attachment() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Post Revision Test',
			'post_content' => 'Not edited',
			'post_status'  => 'inherit',
			'post_type'    => 'attachment',
			'post_author'  => $editor_id,
		) );

		$struct = array( 'post_content' => 'First edit' );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $struct ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Make sure that the post status is still inherit
		$this->assertEquals( 'inherit', get_post( $post_id )->post_status );
	}

	function test_use_invalid_post_status() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Post Revision Test',
			'post_content' => 'Not edited',
			'post_author'  => $editor_id,
		) );

		$struct = array( 'post_status' => 'doesnt_exists' );
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $struct ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Make sure that the post status is still inherit
		$this->assertEquals( 'draft', get_post( $post_id )->post_status );
	}

	/**
	 * @ticket 22220
	 */
	function test_loss_of_categories_on_edit() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$post_id = $this->factory->post->create( array( 'post_author'  => $editor_id ) );
		$term_id = $this->factory->category->create();
		$this->factory->term->add_post_terms( $post_id, $term_id, 'category', true );
		$term_ids = wp_list_pluck( get_the_category( $post_id ), 'term_id' );
		$this->assertContains( $term_id, $term_ids );

		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, array( 'ID' => $post_id, 'post_title' => 'Updated' ) ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 'Updated', get_post( $post_id )->post_title );

		$term_ids = wp_list_pluck( get_the_category( $post_id ), 'term_id' );
		$this->assertContains( $term_id, $term_ids );
	}

	/**
	 * @ticket 26686
	 */
	function test_clear_categories_on_edit() {
		$editor_id = $this->make_user_by_role( 'editor' );

		$post_id = $this->factory->post->create( array( 'post_author'  => $editor_id ) );
		$term_id = $this->factory->category->create();
		$this->factory->term->add_post_terms( $post_id, $term_id, 'category', true );
		$term_ids = wp_list_pluck( get_the_category( $post_id ), 'term_id' );
		$this->assertContains( $term_id, $term_ids );

		$new_post_content = array(
			'ID' => $post_id,
			'post_title' => 'Updated',
			'terms' => array(
				'category' => array()
			)
		);
		$result = $this->myxmlrpcserver->wp_editPost( array( 1, 'editor', 'editor', $post_id, $new_post_content ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 'Updated', get_post( $post_id )->post_title );

		$term_ids = wp_list_pluck( get_the_category( $post_id ), 'term_id' );
		$this->assertNotContains( $term_id, $term_ids );
	}

	/**
	 * @ticket 23219
	 */
	function test_add_enclosure_if_new() {
		// Sample enclosure data
		$enclosure = array(
			'url'    => 'http://example.com/sound.mp3',
			'length' => 12345,
			'type'   => 'audio/mpeg',
		);

		// Second sample enclosure data array
		$new_enclosure = array(
			'url'    => 'http://example.com/sound2.mp3',
			'length' => 12345,
			'type'   => 'audio/mpeg',
		);

		// Create a test user
		$editor_id = $this->make_user_by_role( 'editor' );

		// Add a dummy post
		$post_id = $this->factory->post->create( array(
			'post_title'   => 'Post Enclosure Test',
			'post_content' => 'Fake content',
			'post_author'  => $editor_id,
			'post_status'  => 'publish',
		) );

		// Add the enclosure as it is added in "do_enclose()"
		$enclosure_string = "{$enclosure['url']}\n{$enclosure['length']}\n{$enclosure['type']}\n";
		add_post_meta( $post_id, 'enclosure', $enclosure_string );

		// Verify that the correct data is there
		$this->assertEquals( $enclosure_string, get_post_meta( $post_id, 'enclosure', true ) );

		// Attempt to add the enclosure a second time
		$this->myxmlrpcserver->add_enclosure_if_new( $post_id, $enclosure );

		// Verify that there is only a single value in the array and that a duplicate is not present
		$this->assertEquals( 1, count( get_post_meta( $post_id, 'enclosure' ) ) );

		// For good measure, check that the expected value is in the array
		$this->assertTrue( in_array( $enclosure_string, get_post_meta( $post_id, 'enclosure' ) ) );

		// Attempt to add a brand new enclosure via XML-RPC
		$this->myxmlrpcserver->add_enclosure_if_new( $post_id, $new_enclosure );

		// Having added the new enclosure, 2 values are expected in the array
		$this->assertEquals( 2, count( get_post_meta( $post_id, 'enclosure' ) ) );

		// Check that the new enclosure is in the enclosure meta
		$new_enclosure_string = "{$new_enclosure['url']}\n{$new_enclosure['length']}\n{$new_enclosure['type']}\n";
		$this->assertTrue( in_array( $new_enclosure_string, get_post_meta( $post_id, 'enclosure' ) ) );

		// Check that the old enclosure is in the enclosure meta
		$this->assertTrue( in_array( $enclosure_string, get_post_meta( $post_id, 'enclosure' ) ) );
	}
}
