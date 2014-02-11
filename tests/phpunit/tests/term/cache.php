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

	/**
	 * @ticket 22526
	 */
	function test_category_name_change() {
		$term = $this->factory->category->create_and_get( array( 'name' => 'Foo' ) );
		$post_id = $this->factory->post->create();
		wp_set_post_categories( $post_id, $term->term_id );

		$post = get_post( $post_id );
		$cats1 = get_the_category( $post->ID );
		$this->assertEquals( $term->name, reset( $cats1 )->name );

		wp_update_term( $term->term_id, 'category', array( 'name' => 'Bar' ) );
		$cats2 = get_the_category( $post->ID );
		$this->assertNotEquals( $term->name, reset( $cats2 )->name );
	}

	/**
	 * @ticket 14485
	 */
	function test_hierachy_invalidation() {
		$tax = 'burrito';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );
		$this->assertTrue( get_taxonomy( $tax )->hierarchical );

		$step = 1;
		$parent_id = 0;
		$children = 0;

		foreach ( range( 1, 99 ) as $i ) {
			switch ( $step ) {
			case 1:
				$parent = wp_insert_term( 'Parent' . $i, $tax );
				$parent_id = $parent['term_id'];
				break;
			case 2:
				$parent = wp_insert_term( 'Child' . $i, $tax, array( 'parent' => $parent_id ) );
				$parent_id = $parent['term_id'];
				$children++;
				break;
			case 3:
				wp_insert_term( 'Grandchild' . $i, $tax, array( 'parent' => $parent_id ) );
				$parent_id = 0;
				$children++;
				break;
			}

			$terms = get_terms( $tax, array( 'hide_empty' => false ) );
			$this->assertEquals( $i, count( $terms ) );
			if ( $i > 1 ) {
				$hierarchy = _get_term_hierarchy( $tax );
				$this->assertNotEmpty( $hierarchy );
				$this->assertEquals( $children, count( $hierarchy, COUNT_RECURSIVE ) - count( $hierarchy ) );
			}

			if ( $i % 3 === 0 ) {
				$step = 1;
			} else {
				$step++;
			}
		}

		_unregister_taxonomy( $tax );
	}
}