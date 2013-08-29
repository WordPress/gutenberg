<?php

/**
 * @group xmlrpc
 * @group user
 */
class Tests_XMLRPC_wp_getUsers extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$results = $this->myxmlrpcserver->wp_getUsers( array( 1, 'username', 'password' ) );
		$this->assertInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 403, $results->code );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$results = $this->myxmlrpcserver->wp_getUsers( array( 1, 'subscriber', 'subscriber' ) );
		$this->assertInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 401, $results->code );
	}

	function test_capable_user() {
		$this->make_user_by_role( 'administrator' );

		$result = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $result );

		// check data types
		$this->assertInternalType( 'string', $result[0]['user_id'] );
		$this->assertStringMatchesFormat( '%d', $result[0]['user_id'] );
		$this->assertInternalType( 'string', $result[0]['username'] );
		$this->assertInternalType( 'string', $result[0]['first_name'] );
		$this->assertInternalType( 'string', $result[0]['last_name'] );
		$this->assertInstanceOf( 'IXR_Date', $result[0]['registered'] );
		$this->assertInternalType( 'string', $result[0]['bio'] );
		$this->assertInternalType( 'string', $result[0]['email'] );
		$this->assertInternalType( 'string', $result[0]['nickname'] );
		$this->assertInternalType( 'string', $result[0]['nicename'] );
		$this->assertInternalType( 'string', $result[0]['url'] );
		$this->assertInternalType( 'string', $result[0]['display_name'] );
		$this->assertInternalType( 'array', $result[0]['roles'] );
	}

	function test_invalid_role() {
		$administrator_id = $this->make_user_by_role( 'administrator' );
		if ( is_multisite() )
			grant_super_admin( $administrator_id );

		$filter = array( 'role' => rand_str() );
		$results = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator', $filter ) );
		$this->assertInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 403, $results->code );
	}

	function test_role_filter() {
		$author_id = $this->make_user_by_role( 'author' );
		$editor_id = $this->make_user_by_role( 'editor' );
		$administrator_id = $this->make_user_by_role( 'administrator' );
		if ( is_multisite() )
			grant_super_admin( $administrator_id );

		// test a single role ('editor')
		$filter = array( 'role' => 'editor' );
		$results = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertCount( 1, $results );
		$this->assertEquals( $editor_id, $results[0]['user_id'] );

		// test 'authors', which should return all non-subscribers
		$filter2 = array( 'who' => 'authors' );
		$results2 = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator', $filter2 ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$this->assertCount( 3, array_intersect( array( $author_id, $editor_id, $administrator_id ), wp_list_pluck( $results2, 'user_id' ) ) );
	}

	function test_paging_filters() {
		$administrator_id = $this->make_user_by_role( 'administrator' );
		if ( is_multisite() )
			grant_super_admin( $administrator_id );

		$this->factory->user->create_many( 13 );

		$user_ids = get_users( array( 'fields' => 'ID' ) );

		$users_found = array();
		$page_size = floor( count( $user_ids ) / 3 );

		$filter = array( 'number' => $page_size, 'offset' => 0 );
		do {
			$presults = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator', $filter ) );
			foreach ( $presults as $user ) {
				$users_found[] = $user['user_id'];
			}
			$filter['offset'] += $page_size;
		} while ( count( $presults ) > 0 );

		// verify that $user_ids matches $users_found
		$this->assertEquals( 0, count( array_diff( $user_ids, $users_found ) ) );
	}

	function test_order_filters() {
		$this->make_user_by_role( 'administrator' );

		$filter = array( 'orderby' => 'email', 'order' => 'ASC' );
		$results = $this->myxmlrpcserver->wp_getUsers( array( 1, 'administrator', 'administrator', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		$last_email = '';
		foreach ( $results as $user ) {
			$this->assertLessThanOrEqual( 0, strcmp( $last_email, $user['email'] ) );
			$last_email = $user['email'];
		}
	}
}
