<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPageList extends WP_XMLRPC_UnitTestCase {
	var $post_data;
	var $post_id;
	var $post_date_ts;

	function setUp() {
		parent::setUp();

		$this->post_date_ts = strtotime( '+1 day' );
		$this->post_data = array(
			'post_type' => 'page',
			'post_title' => rand_str(),
			'post_content' => rand_str( 2000 ),
			'post_excerpt' => rand_str( 100 ),
			'post_author' => $this->make_user_by_role( 'author' ),
			'post_date'  => strftime( "%Y-%m-%d %H:%M:%S", $this->post_date_ts ),
		);
		$this->post_id = wp_insert_post( $this->post_data );
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getPageList( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'contributor' );

		$result = $this->myxmlrpcserver->wp_getPageList( array( 1, 'contributor', 'contributor' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_date() {
		$this->make_user_by_role( 'editor' );

		$results = $this->myxmlrpcserver->wp_getPageList( array( 1, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

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
