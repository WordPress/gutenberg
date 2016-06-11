<?php

/**
 * @group taxonomy
 */
class Tests_Term_Query extends WP_UnitTestCase {
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
}
