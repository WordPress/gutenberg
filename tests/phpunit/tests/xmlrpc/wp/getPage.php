<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPage extends WP_XMLRPC_UnitTestCase {
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

	function tearDown() {
		wp_delete_post( $this->post_id );
		parent::tearDown();
	}

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getPage( array( 1, $this->post_id, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	/**
	 * @ticket 20336
	 */
	function test_invalid_pageid() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPage( array( 1, 9999, 'editor', 'editor' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 404, $result->code );
	}

	function test_valid_page() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPage( array( 1, $this->post_id, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// Check data types
		$this->assertInternalType( 'string', $result['userid'] );
		$this->assertInternalType( 'int',    $result['page_id'] );
		$this->assertInternalType( 'string', $result['page_status'] );
		$this->assertInternalType( 'string', $result['description'] );
		$this->assertInternalType( 'string', $result['title'] );
		$this->assertInternalType( 'string', $result['link'] );
		$this->assertInternalType( 'string', $result['permaLink'] );
		$this->assertInternalType( 'array',  $result['categories'] );
		$this->assertInternalType( 'string', $result['excerpt'] );
		$this->assertInternalType( 'string', $result['text_more'] );
		$this->assertInternalType( 'int',    $result['mt_allow_comments'] );
		$this->assertInternalType( 'int',    $result['mt_allow_pings'] );
		$this->assertInternalType( 'string', $result['wp_slug'] );
		$this->assertInternalType( 'string', $result['wp_password'] );
		$this->assertInternalType( 'string', $result['wp_author'] );
		$this->assertInternalType( 'int',    $result['wp_page_parent_id'] );
		$this->assertInternalType( 'string', $result['wp_page_parent_title'] );
		$this->assertInternalType( 'int',    $result['wp_page_order'] );
		$this->assertInternalType( 'string', $result['wp_author_id'] );
		$this->assertInternalType( 'string', $result['wp_author_display_name'] );
		$this->assertInternalType( 'array',  $result['custom_fields'] );
		$this->assertInternalType( 'string', $result['wp_page_template'] );

		// Check expected values
		$this->assertStringMatchesFormat( '%d', $result['userid'] );
		$this->assertEquals( 'draft', $result['page_status'] );
		$this->assertEquals( $this->post_data['post_title'], $result['title'] );
		$this->assertEquals( url_to_postid( $result['link'] ), $this->post_id );
		$this->assertEquals( $this->post_data['post_excerpt'], $result['excerpt'] );
		$this->assertStringMatchesFormat( '%d', $result['wp_author_id'] );
	}

	function test_date() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPage( array( 1, $this->post_id, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		$this->assertInstanceOf( 'IXR_Date', $result['dateCreated'] );
		$this->assertInstanceOf( 'IXR_Date', $result['date_created_gmt'] );

		$date_gmt = strtotime( get_gmt_from_date( mysql2date( 'Y-m-d H:i:s', $this->post_data['post_date'], false ), 'Ymd\TH:i:s' ) );

		$this->assertEquals( $this->post_date_ts, $result['dateCreated']->getTimestamp() );
		$this->assertEquals( $date_gmt, $result['date_created_gmt']->getTimestamp() );
	}
}
