<?php

/**
 * @group taxonomy
 */
class Tests_Term_Cache extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		wp_cache_delete( 'last_changed', 'terms' );
	}

	/**
	 * @ticket 25711
	 */
	function test_category_children_cache() {
		// Test with only one Parent => Child
		$term_id1 = $this->factory->category->create();
		$term_id1_child = $this->factory->category->create( array( 'parent' => $term_id1 ) );
		$hierarchy = _get_term_hierarchy( 'category' );

		$this->assertEquals( array( $term_id1 => array( $term_id1_child ) ), $hierarchy );

		// Add another Parent => Child
		$term_id2 = $this->factory->category->create();
		$term_id2_child = $this->factory->category->create( array( 'parent' => $term_id2 ) );
		$hierarchy = _get_term_hierarchy( 'category' );

		$this->assertEquals( array( $term_id1 => array( $term_id1_child ), $term_id2 => array( $term_id2_child ) ), $hierarchy );

	}
}