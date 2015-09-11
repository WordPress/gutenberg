<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTerm extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_should_return_error_for_empty_term() {
		$found = get_term( '', 'wptests_tax' );
		$this->assertWPError( $found );
		$this->assertSame( 'invalid_term', $found->get_error_code() );
	}

	public function test_should_return_error_for_invalid_taxonomy() {
		$found = get_term( 'foo', 'bar' );
		$this->assertWPError( $found );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	public function test_passing_term_object_should_skip_database_query_when_filter_property_is_empty() {
		global $wpdb;

		$term = $this->factory->term->create_and_get( array( 'taxonomy' => 'wptests_tax' ) );
		clean_term_cache( $term->term_id, 'wptests_tax' );

		$num_queries = $wpdb->num_queries;

		unset( $term->filter );
		$term_a = get_term( $term, 'wptests_tax' );

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	public function test_passing_term_object_should_not_skip_database_query_when_filter_property_is_set() {
		global $wpdb;

		$term = $this->factory->term->create_and_get( array( 'taxonomy' => 'wptests_tax' ) );
		clean_term_cache( $term->term_id, 'wptests_tax' );

		$num_queries = $wpdb->num_queries;

		$term_a = get_term( $term, 'wptests_tax' );

		$this->assertSame( $num_queries + 1, $wpdb->num_queries );
	}

	public function test_passing_term_string_that_casts_to_int_0_should_return_null() {
		$this->assertSame( null, get_term( 'abc', 'wptests_tax' ) );
	}

	public function test_should_return_null_for_invalid_term_id() {
		$this->assertSame( null, get_term( 99999999, 'wptests_tax' ) );
	}

	public function test_cache_should_be_populated_by_successful_fetch() {
		global $wpdb;

		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		clean_term_cache( $t, 'wptests_tax' );

		// Prime cache.
		$term_a = get_term( $t, 'wptests_tax' );
		$num_queries = $wpdb->num_queries;

		// Second call shouldn't require a database query.
		$term_b = get_term( $t, 'wptests_tax' );
		$this->assertSame( $num_queries, $wpdb->num_queries );
		$this->assertEquals( $term_a, $term_b );
	}

	public function test_output_object() {
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$this->assertInternalType( 'object', get_term( $t, 'wptests_tax', OBJECT ) );
	}

	public function test_output_array_a() {
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$term = get_term( $t, 'wptests_tax', ARRAY_A );
		$this->assertInternalType( 'array', $term );
		$this->assertTrue( isset( $term['term_id'] ) );
	}

	public function test_output_array_n() {
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$term = get_term( $t, 'wptests_tax', ARRAY_N );
		$this->assertInternalType( 'array', $term );
		$this->assertFalse( isset( $term['term_id'] ) );
		foreach ( $term as $k => $v ) {
			$this->assertInternalType( 'integer', $k );
		}
	}

	public function test_output_should_fall_back_to_object_for_invalid_input() {
		$t = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$this->assertInternalType( 'object', get_term( $t, 'wptests_tax', 'foo' ) );
	}
}
