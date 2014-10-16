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

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_slug_cache() {
		global $wpdb;
		$term_id = $this->factory->term->create( array( 'slug' => 'burrito', 'taxonomy' => 'post_tag' ) );

		$queries = $wpdb->num_queries;
		get_term_by( 'slug', 'burrito', 'post_tag' );
		$initial = $queries + 1;
		$this->assertEquals( $initial, $wpdb->num_queries );
		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$this->assertEquals( $initial, $wpdb->num_queries );

		$this->assertEquals( $term, wp_cache_get( $term_id, 'post_tag' ) );

		$this->assertEquals( get_term( $term_id, 'post_tag' ), $term );
		$this->assertEquals( $initial, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_slug_cache_update() {
		global $wpdb;
		$term_id = $this->factory->term->create( array( 'slug' => 'burrito', 'taxonomy' => 'post_tag' ) );

		$queries = $wpdb->num_queries;
		get_term_by( 'slug', 'burrito', 'post_tag' );
		$initial = $queries + 1;
		$this->assertEquals( $initial, $wpdb->num_queries );
		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$this->assertEquals( $initial, $wpdb->num_queries );

		$this->assertEquals( $term, wp_cache_get( $term_id, 'post_tag' ) );

		wp_update_term( $term_id, 'post_tag', array( 'name' => 'Taco' ) );
		$this->assertNotEquals( $term, get_term( $term_id, 'post_tag' ) );
		$after_queries = $wpdb->num_queries;
		get_term_by( 'slug', 'burrito', 'post_tag' );
		$this->assertEquals( $after_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_name_cache() {
		global $wpdb;
		$term_id = $this->factory->term->create( array( 'name' => 'burrito', 'taxonomy' => 'post_tag' ) );

		$queries = $wpdb->num_queries;
		get_term_by( 'name', 'burrito', 'post_tag' );
		$initial = $queries + 1;
		$this->assertEquals( $initial, $wpdb->num_queries );
		$term = get_term_by( 'name', 'burrito', 'post_tag' );
		$this->assertEquals( $initial, $wpdb->num_queries );

		$this->assertEquals( get_term( $term_id, 'post_tag' ), $term );
		$this->assertEquals( $initial, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_name_cache_update() {
		global $wpdb;
		$term_id = $this->factory->term->create( array( 'name' => 'burrito', 'taxonomy' => 'post_tag' ) );

		$queries = $wpdb->num_queries;
		get_term_by( 'name', 'burrito', 'post_tag' );
		$initial = $queries + 1;
		$this->assertEquals( $initial, $wpdb->num_queries );
		$term = get_term_by( 'name', 'burrito', 'post_tag' );
		$this->assertEquals( $initial, $wpdb->num_queries );

		wp_update_term( $term_id, 'post_tag', array( 'slug' => 'Taco' ) );
		$this->assertNotEquals( $term, get_term( $term_id, 'post_tag' ) );
		$after_queries = $wpdb->num_queries;
		get_term_by( 'name', 'burrito', 'post_tag' );
		$this->assertEquals( $after_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_invalidating_term_caches_should_fail_when_invalidation_is_suspended() {
		$slug = 'taco';
		$name = 'Taco';
		$taxonomy = 'post_tag';
		$cache_key_slug = 'slug:' . $slug;
		$cache_key_name = 'name:' . md5( $name );

		$term_id = $this->factory->term->create( array( 'slug' => $slug, 'name' => $name, 'taxonomy' => $taxonomy ) );

		$last_changed = wp_get_last_changed( 'terms' );
		$group = $taxonomy . ':' . $last_changed;

		$term = get_term_by( 'slug', $slug, $taxonomy );

		// Verify the term is cached by ID, slug and name
		$this->assertEquals( $term, wp_cache_get( $term_id, $taxonomy ) );
		$this->assertEquals( $term_id, wp_cache_get( $cache_key_slug, $group ) );
		$this->assertEquals( $term_id, wp_cache_get( $cache_key_name, $group ) );

		wp_suspend_cache_invalidation();
		clean_term_cache( $term_id, $taxonomy );

		// Verify that the cached value still matches the correct value
		$this->assertEquals( $term, wp_cache_get( $term_id, $taxonomy ) );
		$this->assertEquals( $term_id, wp_cache_get( $cache_key_slug, $group ) );
		$this->assertEquals( $term_id, wp_cache_get( $cache_key_name, $group ) );

		// Verify that last changed has not been updated as part of an invalidation routine
		$this->assertEquals( $last_changed, wp_get_last_changed( 'terms' ) );
	}
}