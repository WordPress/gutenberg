<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getMediaItem extends WP_XMLRPC_UnitTestCase {
	var $post_id;
	var $attachment_data;
	var $attachment_id;

	function setUp() {
		parent::setUp();

		add_theme_support( 'post-thumbnails' );

		$this->post_id = wp_insert_post( array(
			'post_title' => rand_str(),
			'post_content' => rand_str(),
			'post_status' => 'publish'
		));

		$filename = ( DIR_TESTDATA.'/images/waffles.jpg' );
		$contents = file_get_contents( $filename );
		$upload = wp_upload_bits(basename($filename), null, $contents);
		$mime = wp_check_filetype( $filename );
		$this->attachment_data = array(
			'post_title' => basename( $upload['file'] ),
			'post_content' => '',
			'post_type' => 'attachment',
			'post_parent' => $this->post_id,
			'post_mime_type' => $mime['type'],
			'guid' => $upload[ 'url' ]
		);

		$id = wp_insert_attachment( $this->attachment_data, $upload[ 'file' ], $this->post_id );
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
		$this->attachment_id = $id;

		set_post_thumbnail( $this->post_id, $this->attachment_id );
	}

	function tearDown() {
		remove_theme_support( 'post-thumbnails' );

		parent::tearDown();
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getMediaItem( array( 1, 'username', 'password', 0 ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_valid_media_item() {
		$this->make_user_by_role( 'author' );

		$fields = array( 'post' );
		$result = $this->myxmlrpcserver->wp_getMediaItem( array( 1, 'author', 'author', $this->attachment_id, $fields ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Check data types
		$this->assertInternalType( 'string', $result['attachment_id'] );
		$this->assertInternalType( 'int', $result['parent'] );
		$this->assertInternalType( 'string', $result['title'] );
		$this->assertInstanceOf( 'IXR_Date', $result['date_created_gmt'] );
		$this->assertInternalType( 'string', $result['caption'] );
		$this->assertInternalType( 'string', $result['description'] );
		$this->assertInternalType( 'string', $result['link'] );
		$this->assertInternalType( 'string', $result['thumbnail'] );
		$this->assertInternalType( 'array', $result['metadata'] );

		// Check expected values
		$this->assertStringMatchesFormat( '%d', $result['attachment_id'] );
		$this->assertEquals( $this->attachment_data['post_title'], $result['title'] );
		$this->assertEquals( wp_get_attachment_url( $this->attachment_id ), $result['link'] );
		$this->assertEquals( wp_get_attachment_thumb_url( $this->attachment_id ), $result['thumbnail'] );
	}
}
