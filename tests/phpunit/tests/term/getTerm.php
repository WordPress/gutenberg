<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTerm extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax', 'post' );
	}

	/**
	 * Utility function for generating two shared terms, in the 'wptests_tax' and 'wptests_tax_2' taxonomies.
	 *
	 * @return array Array of term_id/old_term_id/term_taxonomy_id triplets.
	 */
	protected function generate_shared_terms() {
		global $wpdb;

		register_taxonomy( 'wptests_tax_2', 'post' );

		$t1 = wp_insert_term( 'Foo', 'wptests_tax' );
		$t2 = wp_insert_term( 'Foo', 'wptests_tax_2' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		return array(
			array(
				'term_id' => $t1['term_id'],
				'old_term_id' => $t1['term_id'],
				'term_taxonomy_id' => $t1['term_taxonomy_id'],
			),
			array(
				'term_id' => $t1['term_id'],
				'old_term_id' => $t2['term_id'],
				'term_taxonomy_id' => $t2['term_taxonomy_id'],
			),
		);
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

		$term = self::factory()->term->create_and_get( array( 'taxonomy' => 'wptests_tax' ) );
		clean_term_cache( $term->term_id, 'wptests_tax' );

		$num_queries = $wpdb->num_queries;

		unset( $term->filter );
		$term_a = get_term( $term, 'wptests_tax' );

		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	public function test_passing_term_string_that_casts_to_int_0_should_return_null() {
		$this->assertSame( null, get_term( 'abc', 'wptests_tax' ) );
	}

	public function test_should_return_null_for_invalid_term_id() {
		$this->assertSame( null, get_term( 99999999, 'wptests_tax' ) );
	}

	public function test_cache_should_be_populated_by_successful_fetch() {
		global $wpdb;

		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
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
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$this->assertInternalType( 'object', get_term( $t, 'wptests_tax', OBJECT ) );
	}

	public function test_output_array_a() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$term = get_term( $t, 'wptests_tax', ARRAY_A );
		$this->assertInternalType( 'array', $term );
		$this->assertTrue( isset( $term['term_id'] ) );
	}

	public function test_output_array_n() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$term = get_term( $t, 'wptests_tax', ARRAY_N );
		$this->assertInternalType( 'array', $term );
		$this->assertFalse( isset( $term['term_id'] ) );
		foreach ( $term as $k => $v ) {
			$this->assertInternalType( 'integer', $k );
		}
	}

	public function test_output_should_fall_back_to_object_for_invalid_input() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$this->assertInternalType( 'object', get_term( $t, 'wptests_tax', 'foo' ) );
	}

	/**
	 * @ticket 14162
	 */
	public function test_numeric_properties_should_be_cast_to_ints() {
		global $wpdb;

		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		// Get raw data from the database.
		$term_data = $wpdb->get_row( $wpdb->prepare( "SELECT * FROM $wpdb->terms t JOIN $wpdb->term_taxonomy tt ON ( t.term_id = tt.term_id ) WHERE t.term_id = %d", $t ) );

		$found = get_term( $term_data );

		$this->assertTrue( $found instanceof WP_Term );
		$this->assertInternalType( 'int', $found->term_id );
		$this->assertInternalType( 'int', $found->term_taxonomy_id );
		$this->assertInternalType( 'int', $found->parent );
		$this->assertInternalType( 'int', $found->count );
		$this->assertInternalType( 'int', $found->term_group );
	}

	/**
	 * @ticket 34332
	 */
	 public function test_should_return_null_when_provided_taxonomy_does_not_match_actual_term_taxonomy() {
		$term_id = self::factory()->term->create( array( 'taxonomy' => 'post_tag' ) );
		$this->assertNull( get_term( $term_id, 'category' ) );
	}

	/**
	 * @ticket 34533
	 */
	public function test_should_return_wp_error_when_term_is_shared_and_no_taxonomy_is_specified() {
		$terms = $this->generate_shared_terms();

		$found = get_term( $terms[0]['term_id'] );

		$this->assertWPError( $found );
	}

	/**
	 * @ticket 34533
	 */
	public function test_should_return_term_when_term_is_shared_and_correct_taxonomy_is_specified() {
		$terms = $this->generate_shared_terms();

		$found = get_term( $terms[0]['term_id'], 'wptests_tax' );

		$this->assertInstanceOf( 'WP_Term', $found );
		$this->assertSame( $terms[0]['term_id'], $found->term_id );
	}

	/**
	 * @ticket 34533
	 */
	public function test_should_return_null_when_term_is_shared_and_incorrect_taxonomy_is_specified() {
		$terms = $this->generate_shared_terms();

		$found = get_term( $terms[0]['term_id'], 'post_tag' );

		$this->assertNull( $found );
	}

	/**
	 * @ticket 34533
	 */
	public function test_shared_term_in_cache_should_be_ignored_when_specifying_a_different_taxonomy() {
		global $wpdb;

		$terms = $this->generate_shared_terms();

		// Prime cache for 'wptests_tax'.
		get_term( $terms[0]['term_id'], 'wptests_tax' );
		$num_queries = $wpdb->num_queries;

		// Database should be hit again.
		$found = get_term( $terms[1]['term_id'], 'wptests_tax_2' );
		$num_queries++;

		$this->assertSame( $num_queries, $wpdb->num_queries );
		$this->assertInstanceOf( 'WP_Term', $found );
		$this->assertSame( 'wptests_tax_2', $found->taxonomy );
	}

	/**
	 * @ticket 34533
	 */
	public function test_should_return_error_when_only_matching_term_is_in_an_invalid_taxonomy() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		_unregister_taxonomy( 'wptests_tax' );

		$found = get_term( $t );
		$this->assertWPError( $found );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	/**
	 * @ticket 34533
	 */
	public function test_term_should_be_returned_when_id_is_shared_only_with_invalid_taxonomies() {
		$terms = $this->generate_shared_terms();

		_unregister_taxonomy( 'wptests_tax' );

		$found = get_term( $terms[1]['term_id'] );
		$this->assertInstanceOf( 'WP_Term', $found );
		$this->assertSame( 'wptests_tax_2', $found->taxonomy );
		$this->assertSame( $terms[1]['term_id'], $found->term_id );
	}
}
