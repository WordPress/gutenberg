<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getPosts extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getPosts( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	/**
	 * @ticket 20991
	 */
	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getPosts( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );

		$filter = array( 'post_type' => 'page' );
		$result = $this->myxmlrpcserver->wp_getPosts( array( 1, 'subscriber', 'subscriber', $filter ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
	}

	function test_capable_user() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );
	}

	function test_invalid_post_type() {
		$this->make_user_by_role( 'editor' );

		$filter = array( 'post_type' => 'invalid_post_type_name' );
		$result = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
	}

	function test_filters() {
		$this->make_user_by_role( 'editor' );

		$cpt_name = 'test_wp_getposts_cpt';
		register_post_type( $cpt_name, array(
			'taxonomies' => array( 'post_tag', 'category' ),
			'public' => true
		));

		$post_ids = array();
		$num_posts = 17;
		foreach ( range( 1, $num_posts ) as $i ) {
			$post_ids[] = $this->factory->post->create( array(
				'post_type' => $cpt_name,
				'post_date' => date( 'Y-m-d H:i:s', time() + $i )
			) );
		}
		// get them all
		$filter = array( 'post_type' => $cpt_name, 'number' => $num_posts + 10 );
		$results = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( $num_posts, count( $results ) );

		// page through results
		$posts_found = array();
		$filter['number'] = 5;
		$filter['offset'] = 0;
		do {
			$presults = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter ) );
			$posts_found = array_merge( $posts_found, wp_list_pluck( $presults, 'post_id' ) );
			$filter['offset'] += $filter['number'];
		} while ( count( $presults ) > 0 );
		// verify that $post_ids matches $posts_found
		$this->assertEquals( 0, count( array_diff( $post_ids, $posts_found ) ) );

		// add comments to some of the posts
		$random_posts = array_rand( $post_ids, $num_posts / 2 );
		foreach ( $random_posts as $i ) {
			$post = $post_ids[$i];
			$this->factory->comment->create_post_comments( $post, rand( 1, 20 ) );
		}

		// get results ordered by comment count
		$filter2 = array( 'post_type' => $cpt_name, 'number' => $num_posts, 'orderby' => 'comment_count', 'order' => 'DESC' );
		$results2 = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$last_comment_count = 100;
		foreach ( $results2 as $post ) {
			$comment_count = intval( get_comments_number( $post['post_id'] ) );
			$this->assertLessThanOrEqual( $last_comment_count, $comment_count );
			$last_comment_count = $comment_count;
		}

		// set one of the posts to draft and get drafts
		$post = get_post( $post_ids[$random_posts[0]] );
		$post->post_status = 'draft';
		wp_update_post( $post );
		$filter3 = array( 'post_type' => $cpt_name, 'post_status' => 'draft' );
		$results3 = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter3 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results3 );
		$this->assertEquals( 1, count( $results3 ) );
		$this->assertEquals( $post->ID, $results3[0]['post_id'] );

		_unregister_post_type( $cpt_name );
	}

	function test_fields() {
		$this->make_user_by_role( 'editor' );
		$this->factory->post->create();

		// check default fields
		$results = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$expected_fields = array( 'post_id', 'post_title', 'terms', 'custom_fields', 'link' ); // subset of expected fields
		foreach( $expected_fields as $field ) {
			$this->assertArrayHasKey( $field, $results[0] );
		}

		// request specific fields and verify that only those are returned
		$filter = array();
		$fields = array( 'post_name', 'post_author', 'enclosure' );
		$results2 = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter, $fields ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$expected_fields = array_merge( $fields, array( 'post_id' ) );
		foreach ( array_keys( $results2[0] ) as $field ) {
			$this->assertContains( $field, $expected_fields );
		}
	}

	/**
	 * @ticket 21623
	 */
	function test_search() {
		$this->make_user_by_role( 'editor' );

		$post_ids[] = $this->factory->post->create( array( 'post_title' => 'First: ' . rand_str() ) );
		$post_ids[] = $this->factory->post->create( array( 'post_title' => 'Second: ' . rand_str() ) );

		// Search for none of them
		$filter = array( 's' => rand_str() );
		$results = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 0, count( $results ) );

		// Search for one of them
		$filter = array( 's' => 'First:' );
		$results = $this->myxmlrpcserver->wp_getPosts( array( 1, 'editor', 'editor', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 1, count( $results ) );
	}

}