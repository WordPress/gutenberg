<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_newPost extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'username', 'password', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'subscriber', 'subscriber', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_no_content() {
		$this->make_user_by_role( 'author' );

		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', array() ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
		$this->assertEquals( 'Content, title, and excerpt are empty.', $result->message );
	}

	function test_basic_content() {
		$this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Test' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertStringMatchesFormat( '%d', $result );
	}

	function test_ignore_id() {
		$this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Test', 'ID' => 103948 );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertNotEquals( '103948', $result );
	}

	function test_capable_publish() {
		$this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'publish' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_incapable_publish() {
		$this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'publish' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'contributor', 'contributor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_private() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'private' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_incapable_private() {
		$this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'private' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'contributor', 'contributor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_other_author() {
		$other_author_id = $this->make_user_by_role( 'author' );
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_author' => $other_author_id );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_incapable_other_author() {
		$other_author_id = $this->make_user_by_role( 'author' );
		$this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Test', 'post_author' => $other_author_id );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'contributor', 'contributor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_invalid_author() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_author' => 99999999 );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
	}

	function test_empty_author() {
		$my_author_id = $this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Test' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertStringMatchesFormat( '%d', $result );

		$out = get_post( $result );
		$this->assertEquals( $my_author_id, $out->post_author );
		$this->assertEquals( 'Test', $out->post_title );
	}

	function test_post_thumbnail() {
		add_theme_support( 'post-thumbnails' );

		$this->make_user_by_role( 'author' );

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
		$attachment_id = wp_insert_attachment( $attachment, $upload['file'] );

		$post = array( 'post_title' => 'Post Thumbnail Test', 'post_thumbnail' => $attachment_id );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( $attachment_id, get_post_meta( $result, '_thumbnail_id', true ) );

		remove_theme_support( 'post-thumbnails' );
	}

	function test_invalid_post_status() {
		$this->make_user_by_role( 'author' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'foobar_status' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 'draft', get_post_status( $result ) );
	}

	function test_incapable_sticky() {
		$this->make_user_by_role( 'contributor' );

		$post = array( 'post_title' => 'Test', 'sticky' => true );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'contributor', 'contributor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_sticky() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'sticky' => true );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertTrue( is_sticky( $result ) );
	}

	function test_private_sticky() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_status' => 'private', 'sticky' => true );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_post_format() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_format' => 'quote' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 'quote', get_post_format( $result ) );
	}

	function test_invalid_post_format() {
		$this->make_user_by_role( 'editor' );

		$post = array( 'post_title' => 'Test', 'post_format' => 'tumblr' );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( '', get_post_format( $result ) );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$post = array(
			'post_title' => 'Test',
			'terms' => array(
				'foobar_nonexistant' => array( 1 )
			)
		);
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );

		$post2 = array(
			'post_title' => 'Test',
			'terms_names' => array(
				'foobar_nonexistant' => array( 1 )
			)
		);
		$result2 = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post2 ) );
		$this->assertInstanceOf( 'IXR_Error', $result2 );
		$this->assertEquals( 401, $result2->code );
	}

	function test_invalid_term_id() {
		$this->make_user_by_role( 'editor' );

		$post = array(
			'post_title' => 'Test',
			'terms' => array(
				'post_tag' => array( 1390490823409 )
			)
		);
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_terms() {
		$this->make_user_by_role( 'editor' );

		$tag1 = wp_create_tag ( rand_str( 30 ) );
		$this->assertInternalType( 'array', $tag1 );
		$tag2 = wp_create_tag ( rand_str( 30 ) );
		$this->assertInternalType( 'array', $tag2 );
		$tag3 = wp_create_tag ( rand_str( 30 ) );
		$this->assertInternalType( 'array', $tag3 );

		$post = array(
			'post_title' => 'Test',
			'terms' => array(
				'post_tag' => array( $tag2['term_id'], $tag3['term_id'] )
			)
		);
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		$post_tags = wp_get_object_terms( $result, 'post_tag', array( 'fields' => 'ids' ) );
		$this->assertNotContains( $tag1['term_id'], $post_tags );
		$this->assertContains( $tag2['term_id'], $post_tags );
		$this->assertContains( $tag3['term_id'], $post_tags );
	}

	function test_terms_names() {
		$this->make_user_by_role( 'editor' );

		$ambiguous_name = rand_str( 30 );
		$parent_cat = wp_create_category( $ambiguous_name );
		$child_cat = wp_create_category( $ambiguous_name, $parent_cat );

		$cat1_name = rand_str( 30 );
		$cat1 = wp_create_category( $cat1_name, $parent_cat );
		$cat2_name = rand_str( 30 );

		// first a post with valid categories; one that already exists and one to be created
		$post = array(
			'post_title' => 'Test',
			'terms_names' => array(
				'category' => array( $cat1_name, $cat2_name )
			)
		);
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		// verify that cat2 was created
		$cat2 = get_term_by( 'name', $cat2_name, 'category' );
		$this->assertNotEmpty( $cat2 );
		// check that both categories were set on the post
		$post_cats = wp_get_object_terms( $result, 'category', array( 'fields' => 'ids' ) );
		$this->assertContains( $cat1, $post_cats );
		$this->assertContains( $cat2->term_id, $post_cats );

		// create a second post attempting to use the ambiguous name
		$post2 = array(
			'post_title' => 'Test',
			'terms_names' => array(
				'category' => array( $cat1_name, $ambiguous_name )
			)
		);
		$result2 = $this->myxmlrpcserver->wp_newPost( array( 1, 'editor', 'editor', $post2 ) );
		$this->assertInstanceOf( 'IXR_Error', $result2 );
		$this->assertEquals( 401, $result2->code );
	}

	/**
	 * @ticket 28601
	 */
	function test_invalid_post_date_does_not_fatal() {
		$this->make_user_by_role( 'author' );
		$date_string = 'invalid_date';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date' => $date_string );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( '1970-01-01 00:00:00', $fetched_post->post_date );
	}

	/**
	 * @ticket 28601
	 */
	function test_invalid_post_date_gmt_does_not_fatal() {
		$this->make_user_by_role( 'author' );
		$date_string = 'invalid date';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date_gmt' => $date_string );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( '1970-01-01 00:00:00', $fetched_post->post_date_gmt );
	}

	/**
	 * @ticket 28601
	 */
	function test_valid_string_post_date() {
		$this->make_user_by_role( 'author' );
		$date_string = '1984-01-11 05:00:00';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date' => $date_string );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( $date_string , $fetched_post->post_date );
	}

	/**
	 * @ticket 28601
	 */
	function test_valid_string_post_date_gmt() {
		$this->make_user_by_role( 'author' );
		$date_string = '1984-01-11 05:00:00';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date_gmt' => $date_string );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( $date_string , $fetched_post->post_date_gmt );
	}

	/**
	 * @ticket 28601
	 */
	function test_valid_IXR_post_date() {
		$this->make_user_by_role( 'author' );
		$date_string = '1984-01-11 05:00:00';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date' => new IXR_Date( mysql2date( 'Ymd\TH:i:s', $date_string, false ) ) );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( $date_string , $fetched_post->post_date );
	}

	/**
	 * @ticket 28601
	 */
	function test_valid_IXR_post_date_gmt() {
		$this->make_user_by_role( 'author' );
		$date_string = '1984-01-11 05:00:00';
		$post = array( 'post_title' => 'test', 'post_content' => 'test', 'post_date_gmt' => new IXR_Date( mysql2date( 'Ymd\TH:i:s', $date_string, false ) ) );
		$result = $this->myxmlrpcserver->wp_newPost( array( 1, 'author', 'author', $post ) );
		$fetched_post = get_post( $result );
		$this->assertStringMatchesFormat( '%d', $result );
		$this->assertEquals( $date_string , $fetched_post->post_date_gmt );
	}

}
