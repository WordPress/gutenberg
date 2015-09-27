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
}
