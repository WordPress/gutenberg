<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_mt_getRecentPostTitles extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->mt_getRecentPostTitles( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_no_posts() {
		$this->make_user_by_role( 'author' );

		$result = $this->myxmlrpcserver->mt_getRecentPostTitles( array( 1, 'author', 'author' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 500, $result->code );
	}

	function test_no_editable_posts() {
		$this->make_user_by_role( 'author' );
		$editor = $this->make_user_by_role( 'editor' );
		$this->factory->post->create( array( 'post_author' => $editor ) );

		$result = $this->myxmlrpcserver->mt_getRecentPostTitles( array( 1, 'author', 'author' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 0, count( $result ) );
	}

	function test_date() {
		$this->make_user_by_role( 'author' );

		$this->factory->post->create();

		$results = $this->myxmlrpcserver->mt_getRecentPostTitles( array( 1, 'author', 'author' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $result ) {
			$post = get_post( $result['postid'] );
			$date_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $post->post_date, false ), 'Ymd\TH:i:s' ) );

			$this->assertInstanceOf( 'IXR_Date', $result['dateCreated'] );
			$this->assertInstanceOf( 'IXR_Date', $result['date_created_gmt'] );

			$this->assertEquals( strtotime( $post->post_date ), $result['dateCreated']->getTimestamp() );
			$this->assertEquals( $date_gmt, $result['date_created_gmt']->getTimestamp() );
		}
	}
}
