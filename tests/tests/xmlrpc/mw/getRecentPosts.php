<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_mw_getRecentPosts extends WP_XMLRPC_UnitTestCase {
	var $post_data;
	var $post_id;
	var $post_date_ts;

	function setUp() {
		parent::setUp();

		$author_id = $this->make_user_by_role( 'author' );
		$this->post_date_ts = strtotime( '+1 day' );
		$this->post_data = array(
			'post_title' => rand_str(),
			'post_content' => rand_str( 2000 ),
			'post_excerpt' => rand_str( 100 ),
			'post_author' => $author_id,
			'post_date'  => strftime( "%Y-%m-%d %H:%M:%S", $this->post_date_ts ),
		);
		$this->post_id = wp_insert_post( $this->post_data );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->mw_getRecentPosts( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	/**
	 * @ticket 22320
	 */
	function test_no_editing_privileges() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->mw_getRecentPosts( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}
	
	function test_no_editable_posts() {
		wp_delete_post( $this->post_id );

		$result = $this->myxmlrpcserver->mw_getRecentPosts( array( 1, 'author', 'author' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 0, count( $result ) );
	}

	function test_valid_post() {
		add_theme_support( 'post-thumbnails' );

		$fields = array( 'post' );
		$results = $this->myxmlrpcserver->mw_getRecentPosts( array( 1, 'author', 'author' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$post = get_post( $result['postid'] );

			// Check data types
			$this->assertInternalType( 'string', $result['userid'] );
			$this->assertInternalType( 'string', $result['postid'] );
			$this->assertInternalType( 'string', $result['description'] );
			$this->assertInternalType( 'string', $result['title'] );
			$this->assertInternalType( 'string', $result['link'] );
			$this->assertInternalType( 'string', $result['permaLink'] );
			$this->assertInternalType( 'array',  $result['categories'] );
			$this->assertInternalType( 'string', $result['mt_excerpt'] );
			$this->assertInternalType( 'string', $result['mt_text_more'] );
			$this->assertInternalType( 'string', $result['wp_more_text'] );
			$this->assertInternalType( 'int', $result['mt_allow_comments'] );
			$this->assertInternalType( 'int', $result['mt_allow_pings'] );
			$this->assertInternalType( 'string', $result['mt_keywords'] );
			$this->assertInternalType( 'string', $result['wp_slug'] );
			$this->assertInternalType( 'string', $result['wp_password'] );
			$this->assertInternalType( 'string', $result['wp_author_id'] );
			$this->assertInternalType( 'string', $result['wp_author_display_name'] );
			$this->assertInternalType( 'string', $result['post_status'] );
			$this->assertInternalType( 'array', $result['custom_fields'] );
			$this->assertInternalType( 'string', $result['wp_post_format'] );

			// Check expected values
			$this->assertStringMatchesFormat( '%d', $result['userid'] );
			$this->assertStringMatchesFormat( '%d', $result['postid'] );
			$this->assertEquals( $post->post_title, $result['title'] );
			$this->assertEquals( 'draft', $result['post_status'] );
			$this->assertStringMatchesFormat( '%d', $result['wp_author_id'] );
			$this->assertEquals( $post->post_excerpt, $result['mt_excerpt'] );
			$this->assertEquals( url_to_postid( $result['link'] ), $post->ID );

			$this->assertEquals( '', $result['wp_post_thumbnail'] );
		}

		remove_theme_support( 'post-thumbnails' );
	}

	function test_post_thumbnail() {
		add_theme_support( 'post-thumbnails' );

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
		$attachment_id = wp_insert_attachment( $attachment, $upload['file'], $this->post_id );
		set_post_thumbnail( $this->post_id, $attachment_id );

		$results = $this->myxmlrpcserver->mw_getRecentPosts( array( $this->post_id, 'author', 'author' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$this->assertInternalType( 'string', $result['wp_post_thumbnail'] );
			$this->assertStringMatchesFormat( '%d', $result['wp_post_thumbnail'] );

			if( ! empty( $result['wp_post_thumbnail'] ) || $result['postid'] == $this->post_id ) {
				$attachment_id = get_post_meta( $result['postid'], '_thumbnail_id', true );

				$this->assertEquals( $attachment_id, $result['wp_post_thumbnail'] );
			}
		}

		remove_theme_support( 'post-thumbnails' );
	}

	function test_date() {
		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->mw_getRecentPosts( array( 1, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$post = get_post( $result['postid'] );
			$date_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $post->post_date, false ), 'Ymd\TH:i:s' ) );
			$date_modified_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $post->post_modified, false ), 'Ymd\TH:i:s' ) );

			$this->assertInstanceOf( 'IXR_Date', $result['dateCreated'] );
			$this->assertInstanceOf( 'IXR_Date', $result['date_created_gmt'] );
			$this->assertInstanceOf( 'IXR_Date', $result['date_modified'] );
			$this->assertInstanceOf( 'IXR_Date', $result['date_modified_gmt'] );

			$this->assertEquals( strtotime( $post->post_date ), $result['dateCreated']->getTimestamp() );
			$this->assertEquals( $date_gmt, $result['date_created_gmt']->getTimestamp() );
			$this->assertEquals( strtotime( $post->post_date ), $result['date_modified']->getTimestamp() );
			$this->assertEquals( $date_modified_gmt, $result['date_modified_gmt']->getTimestamp() );
		}
	}
}
