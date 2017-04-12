<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_mw_getPost extends WP_XMLRPC_UnitTestCase {
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create( array(
			'post_author' => $factory->user->create( array(
				'user_login' => 'author',
				'user_pass'  => 'author',
				'role'       => 'author'
			) ),
			'post_date'   => strftime( "%Y-%m-%d %H:%M:%S", strtotime( '+1 day' ) ),
		) );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->mw_getPost( array( self::$post_id, 'username', 'password' ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->mw_getPost( array( self::$post_id, 'subscriber', 'subscriber' ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 401, $result->code );
	}

	/**
	 * @ticket 20336
	 */
	function test_invalid_postid() {
		$result = $this->myxmlrpcserver->mw_getPost( array( 9999, 'author', 'author' ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 404, $result->code );
	}

	function test_valid_post() {
		add_theme_support( 'post-thumbnails' );

		$fields = array( 'post' );
		$result = $this->myxmlrpcserver->mw_getPost( array( self::$post_id, 'author', 'author' ) );
		$this->assertNotIXRError( $result );

		// Check data types
		$this->assertInternalType( 'string', $result['userid'] );
		$this->assertInternalType( 'int', $result['postid'] );
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
		$this->assertInternalType( 'bool',   $result['sticky'] );

		$post_data = get_post( self::$post_id );

		// Check expected values
		$this->assertStringMatchesFormat( '%d', $result['userid'] );
		$this->assertEquals( $post_data->post_title, $result['title'] );
		$this->assertEquals( 'publish', $result['post_status'] );
		$this->assertStringMatchesFormat( '%d', $result['wp_author_id'] );
		$this->assertEquals( $post_data->post_excerpt, $result['mt_excerpt'] );
		$this->assertEquals( url_to_postid( $result['link'] ), self::$post_id );

		$this->assertEquals( '', $result['wp_post_thumbnail'] );

		remove_theme_support( 'post-thumbnails' );
	}

	function test_post_thumbnail() {
		add_theme_support( 'post-thumbnails' );

		// create attachment
		$filename = ( DIR_TESTDATA.'/images/a2-small.jpg' );
		$attachment_id = self::factory()->attachment->create_upload_object( $filename );

		set_post_thumbnail( self::$post_id, $attachment_id );

		$fields = array( 'post' );
		$result = $this->myxmlrpcserver->mw_getPost( array( self::$post_id, 'author', 'author' ) );
		$this->assertNotIXRError( $result );

		$this->assertInternalType( 'string', $result['wp_post_thumbnail'] );
		$this->assertStringMatchesFormat( '%d', $result['wp_post_thumbnail'] );
		$this->assertEquals( $attachment_id, $result['wp_post_thumbnail'] );

		remove_theme_support( 'post-thumbnails' );
	}

	function test_date() {
		$fields = array( 'post' );
		$result = $this->myxmlrpcserver->mw_getPost( array( self::$post_id, 'author', 'author' ) );
		$this->assertNotIXRError( $result );

		$this->assertInstanceOf( 'IXR_Date', $result['dateCreated'] );
		$this->assertInstanceOf( 'IXR_Date', $result['date_created_gmt'] );
		$this->assertInstanceOf( 'IXR_Date', $result['date_modified'] );
		$this->assertInstanceOf( 'IXR_Date', $result['date_modified_gmt'] );

		$post_data = get_post( self::$post_id );

		$this->assertEquals( strtotime( $post_data->post_date ), $result['dateCreated']->getTimestamp() );
		$this->assertEquals( strtotime( $post_data->post_date ), $result['date_modified']->getTimestamp() );

		$post_date_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $post_data->post_date, false ), 'Ymd\TH:i:s' ) );
		$post_modified_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $post_data->post_date, false ), 'Ymd\TH:i:s' ) );

		$this->assertEquals( $post_date_gmt, $result['date_created_gmt']->getTimestamp() );
		$this->assertEquals( $post_modified_gmt, $result['date_modified_gmt']->getTimestamp() );
	}
}
