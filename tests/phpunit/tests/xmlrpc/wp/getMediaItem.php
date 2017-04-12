<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getMediaItem extends WP_XMLRPC_UnitTestCase {
	protected static $post_id;

	var $attachment_data;
	var $attachment_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create();
	}

	function setUp() {
		parent::setUp();

		add_theme_support( 'post-thumbnails' );

		$filename = ( DIR_TESTDATA.'/images/waffles.jpg' );
		$contents = file_get_contents( $filename );
		$upload = wp_upload_bits(basename($filename), null, $contents);

		$this->attachment_id = $this->_make_attachment( $upload, self::$post_id );
		$this->attachment_data = get_post( $this->attachment_id, ARRAY_A );

		set_post_thumbnail( self::$post_id, $this->attachment_id );
	}

	function tearDown() {
		remove_theme_support( 'post-thumbnails' );

		$this->remove_added_uploads();

		parent::tearDown();
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getMediaItem( array( 1, 'username', 'password', 0 ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_valid_media_item() {
		$this->make_user_by_role( 'author' );

		$fields = array( 'post' );
		$result = $this->myxmlrpcserver->wp_getMediaItem( array( 1, 'author', 'author', $this->attachment_id, $fields ) );
		$this->assertNotIXRError( $result );

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
