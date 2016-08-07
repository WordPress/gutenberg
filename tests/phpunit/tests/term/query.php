<?php

/**
 * @group taxonomy
 */
class Tests_Term_Query extends WP_UnitTestCase {
	/**
	 * @ticket 37545
	 */
	public function test_taxonomy_should_accept_single_taxonomy_as_string() {
		register_taxonomy( 'wptests_tax_1', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );

		$term_1 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax_1' ) );
		$term_2 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax_2' ) );

		$q = new WP_Term_Query( array(
			'taxonomy' => 'wptests_tax_2',
			'fields' => 'ids',
			'hide_empty' => false,
		) );

		$this->assertEqualSets( array( $term_2 ), $q->terms );
	}

	public function test_taxonomy_should_accept_taxonomy_array() {
		register_taxonomy( 'wptests_tax_1', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );

		$term_1 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax_1' ) );
		$term_2 = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax_2' ) );

		$q = new WP_Term_Query( array(
			'taxonomy' => array( 'wptests_tax_2' ),
			'fields' => 'ids',
			'hide_empty' => false,
		) );

		$this->assertEqualSets( array( $term_2 ), $q->terms );
	}

	/**
	 * @ticket 37074
	 */
	public function test_term_taxonomy_id_single() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );

		$terms = self::factory()->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );

		// Manually change the term_taxonomy_id to something else.
		$wpdb->update(
			$wpdb->term_taxonomy,
			array( 'term_taxonomy_id' => 12345 ),
			array( 'term_id' => $terms[0] )
		);

		$q = new WP_Term_Query( array(
			'term_taxonomy_id' => 12345,
			'fields' => 'ids',
			'hide_empty' => false,
		) );

		$this->assertEqualSets( array( $terms[0] ), $q->terms );
	}

	/**
	 * @ticket 37074
	 */
	public function test_term_taxonomy_id_array() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );

		$terms = self::factory()->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );

		// Manually change the term_taxonomy_id to something else.
		$wpdb->update(
			$wpdb->term_taxonomy,
			array( 'term_taxonomy_id' => 12345 ),
			array( 'term_id' => $terms[0] )
		);

		$wpdb->update(
			$wpdb->term_taxonomy,
			array( 'term_taxonomy_id' => 6789 ),
			array( 'term_id' => $terms[2] )
		);

		$q = new WP_Term_Query( array(
			'term_taxonomy_id' => array( 12345, 6789 ),
			'fields' => 'ids',
			'hide_empty' => false,
		) );

		$this->assertEqualSets( array( $terms[0], $terms[2] ), $q->terms );
	}

	/**
	 * @ticket 37151
	 */
	public function test_order_by_meta_value_num() {
		register_taxonomy( 'wptests_tax', 'post' );

		$terms = self::factory()->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $terms[0], 'foo', 10 );
		add_term_meta( $terms[1], 'foo', 1 );
		add_term_meta( $terms[2], 'foo', 100 );

		$q = new WP_Term_Query( array(
			'taxonomy' => array( 'wptests_tax' ),
			'fields' => 'ids',
			'hide_empty' => false,
			'meta_key' => 'foo',
			'orderby' => 'meta_value_num',
		) );

		$found = array_map( 'intval', $q->terms );
		$this->assertSame( array( $terms[1], $terms[0], $terms[2] ), $found );
	}

	/**
	 * @ticket 37378
	 */
	public function test_order_by_keyword_should_not_be_duplicated_when_filtered() {
		register_taxonomy( 'wptests_tax', 'post' );

		add_filter( 'terms_clauses', array( $this, 'filter_terms_clauses' ) );
		$q = new WP_Term_Query( array(
			'taxonomy' => array( 'wptests_tax' ),
			'orderby' => 'name',
		) );
		remove_filter( 'terms_clauses', array( $this, 'filter_terms_clauses' ) );

		$this->assertContains( 'ORDER BY tt.term_id', $q->request );
		$this->assertNotContains( 'ORDER BY ORDER BY', $q->request );
	}

	public function filter_terms_clauses( $clauses ) {
		$clauses['orderby'] = 'ORDER BY tt.term_id';
		return $clauses;
	}

	/**
	 * @ticket 37591
	 */
	public function test_terms_is_set() {
		register_taxonomy( 'wptests_tax_1', 'post' );

		self::factory()->term->create( array( 'taxonomy' => 'wptests_tax_1' ) );

		$q1 = new WP_Term_Query( array(
			'taxonomy' => 'wptests_tax_1',
			'hide_empty' => false
		) );

		$this->assertNotEmpty( $q1->terms );

		$q2 = new WP_Term_Query( array(
			'taxonomy' => 'wptests_tax_1',
			'hide_empty' => false
		) );

		$this->assertNotEmpty( $q2->terms );
	}
}
