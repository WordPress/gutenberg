<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPageList extends WP_XMLRPC_UnitTestCase {
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create( array(
			'post_type'   => 'page',
			'post_author' => $factory->user->create( array(
				'user_login' => 'author',
				'user_pass'  => 'author',
				'role'       => 'author'
			) ),
			'post_date'   => strftime( "%Y-%m-%d %H:%M:%S", strtotime( '+1 day' ) ),
		) );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getPageList( array( 1, 'username', 'password' ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'contributor' );

		$result = $this->myxmlrpcserver->wp_getPageList( array( 1, 'contributor', 'contributor' ) );
		$this->assertIXRError( $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_date() {
		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getPageList( array( 1, 'editor', 'editor' ) );
		$this->assertNotIXRError( $results );

		foreach( $results as $result ) {
			$page = get_post( $result->page_id );
			$date_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $page->post_date, false ), 'Ymd\TH:i:s' ) );

			$this->assertInstanceOf( 'IXR_Date', $result->dateCreated );
			$this->assertInstanceOf( 'IXR_Date', $result->date_created_gmt );

			$this->assertEquals( strtotime( $page->post_date ), $result->dateCreated->getTimestamp() );
			$this->assertEquals( $date_gmt, $result->date_created_gmt->getTimestamp() );
		}
	}
}
