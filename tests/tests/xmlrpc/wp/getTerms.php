<?php

/**
 * @group xmlrpc
 */
class Tests_XMLRPC_wp_getTerms extends WP_XMLRPC_UnitTestCase {

	function test_invalid_username_password() {
		$result = $this->myxmlrpcserver->wp_getTerms( array( 1, 'username', 'password', 'category' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
	}

	function test_empty_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', '' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_invalid_taxonomy() {
		$this->make_user_by_role( 'editor' );

		$result = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', 'not_existing' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 403, $result->code );
		$this->assertEquals( __( 'Invalid taxonomy' ), $result->message );
	}

	function test_incapable_user() {
		$this->make_user_by_role( 'subscriber' );

		$result = $this->myxmlrpcserver->wp_getTerms( array( 1, 'subscriber', 'subscriber', 'category' ) );
		$this->assertInstanceOf( 'IXR_Error', $result );
		$this->assertEquals( 401, $result->code );
		$this->assertEquals( __( 'You are not allowed to assign terms in this taxonomy.' ), $result->message );
	}

	function test_valid_terms() {
		$this->make_user_by_role( 'editor' );

		// make sure there's at least one category
		$cat = wp_insert_term( 'term' . rand_str() , 'category' );

		$results = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', 'category' ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		foreach( $results as $term ) {
			$this->assertInternalType( 'int', $term['count'] );

			// We expect all other IDs to be strings not integers so we don't return something larger than an XMLRPC integer can describe.
			$this->assertStringMatchesFormat( '%d', $term['term_id'] );
			$this->assertStringMatchesFormat( '%d', $term['term_group'] );
			$this->assertStringMatchesFormat( '%d', $term['term_taxonomy_id'] );
			$this->assertStringMatchesFormat( '%d', $term['parent'] );
		}
	}

	function test_custom_taxonomy() {
		$this->make_user_by_role( 'editor' );

		// create a taxonomy and some terms for it
		$tax_name = 'wp_getTerms_custom_taxonomy';
		$num_terms = 12;
		register_taxonomy( $tax_name, 'post' );
		for( $i = 0; $i < $num_terms; $i++ )
			wp_insert_term( rand_str( 10 ), $tax_name );


		// test fetching all terms
		$results = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', $tax_name ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );

		$this->assertEquals( $num_terms, count( $results ) );
		foreach ( $results as $term ) {
			$this->assertEquals( $tax_name, $term['taxonomy'] );
		}

		// test paged results
		$filter = array( 'number' => 5 );
		$results2 = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', $tax_name, $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 5, count( $results2 ) );
		$this->assertEquals( $results[1]['term_id'], $results2[1]['term_id'] ); // check one of the terms

		$filter['offset'] = 10;
		$results3 = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', $tax_name, $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results3 );
		$this->assertEquals( $num_terms - 10, count( $results3 ) );
		$this->assertEquals( $results[11]['term_id'], $results3[1]['term_id'] );

		// test hide_empty (since none have been attached to posts yet, all should be hidden
		$filter = array( 'hide_empty' => true );
		$results4 = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', $tax_name, $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results4 );
		$this->assertEquals( 0, count( $results4 ) );

		unset($GLOBALS['wp_taxonomies'][$tax_name]);
	}

	function test_term_ordering() {
		$this->make_user_by_role( 'editor' );

		$cat1 = wp_create_category( 'wp.getTerms_' . rand_str( 16 ) );
		$cat2 = wp_create_category( 'wp.getTerms_' . rand_str( 16 ) );

		$this->factory->post->create_many( 5, array( 'post_category' => array( $cat1 ) ) );
		$this->factory->post->create_many( 3, array( 'post_category' => array( $cat2 ) ) );

		$filter = array( 'orderby' => 'count', 'order' => 'DESC' );
		$results = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', 'category', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertNotEquals( 0, count( $results ) );

		foreach( $results as $term ) {
			if ( $term['term_id'] == $cat1 ) {
				break;  // found cat1 first as expected
			}
			else if ( $term['term_id'] == $cat2 ) {
				$this->assertFalse( false, 'Incorrect category ordering.' );
			}
		}
	}

	function test_terms_search() {
		$this->make_user_by_role( 'editor' );

		$name = rand_str( 30 );
		$name_id = wp_create_category( $name );

		// search by full name
		$filter = array( 'search' => $name );
		$results = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', 'category', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results );
		$this->assertEquals( 1, count( $results ) );
		$this->assertEquals( $name, $results[0]['name'] );
		$this->assertEquals( $name_id, $results[0]['term_id'] );

		// search by partial name
		$filter = array( 'search' => substr( $name, 0, 10 ) );
		$results2 = $this->myxmlrpcserver->wp_getTerms( array( 1, 'editor', 'editor', 'category', $filter ) );
		$this->assertNotInstanceOf( 'IXR_Error', $results2 );
		$this->assertEquals( 1, count( $results2 ) );
		$this->assertEquals( $name, $results2[0]['name'] );
		$this->assertEquals( $name_id, $results2[0]['term_id'] );
	}
}
