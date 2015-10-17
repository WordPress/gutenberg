<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTermBy extends WP_UnitTestCase {
	/**
	 * @ticket 21651
	 */
	function test_get_term_by_tt_id() {
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = get_term_by( 'term_taxonomy_id', $term1['term_taxonomy_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	/**
	 * @ticket 33281
	 */
	function test_get_term_by_with_nonexistent_id_should_return_false() {
		$term = get_term_by( 'id', 123456, 'category' );
		$this->assertFalse( $term );
	}

	/**
	 * @ticket 16282
	 */
	public function test_get_term_by_slug_should_match_nonaccented_equivalents() {
		register_taxonomy( 'wptests_tax', 'post' );

		$slug = 'ńaș';
		$t = self::factory()->term->create( array(
			'slug' => $slug,
			'taxonomy' => 'wptests_tax',
		) );

		$found = get_term_by( 'slug', 'nas', 'wptests_tax' );
		$this->assertSame( $t, $found->term_id );
	}

	/**
	 * @ticket 30620
	 */
	public function test_taxonomy_should_be_ignored_if_matching_by_term_taxonomy_id() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$term = get_term( $t, 'wptests_tax' );

		$new_ttid = $term->term_taxonomy_id + 1;

		// Offset just to be sure.
		$wpdb->update(
			$wpdb->term_taxonomy,
			array( 'term_taxonomy_id' => $new_ttid ),
			array( 'term_id' => $t )
		);

		$found = get_term_by( 'term_taxonomy_id', $new_ttid, 'foo' );
		$this->assertSame( $t, $found->term_id );
	}

	/**
	 * @ticket 14162
	 */
	public function test_should_prime_term_cache() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );
		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo',
		) );

		clean_term_cache( $t, 'wptests_tax' );

		$num_queries = $wpdb->num_queries;
		$found = get_term_by( 'slug', 'foo', 'wptests_tax' );
		$num_queries++;

		$this->assertTrue( $found instanceof WP_Term );
		$this->assertSame( $t, $found->term_id );
		$this->assertSame( $num_queries, $wpdb->num_queries );

		// Calls to `get_term()` should now hit cache.
		$found2 = get_term( $t );
		$this->assertSame( $t, $found->term_id );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}
}
