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
		$term_id1 = self::factory()->category->create();
		$term_id1_child = self::factory()->category->create( array( 'parent' => $term_id1 ) );
		$hierarchy = _get_term_hierarchy( 'category' );

		$this->assertEquals( array( $term_id1 => array( $term_id1_child ) ), $hierarchy );

		// Add another Parent => Child
		$term_id2 = self::factory()->category->create();
		$term_id2_child = self::factory()->category->create( array( 'parent' => $term_id2 ) );
		$hierarchy = _get_term_hierarchy( 'category' );

		$this->assertEquals( array( $term_id1 => array( $term_id1_child ), $term_id2 => array( $term_id2_child ) ), $hierarchy );
	}

	/**
	 * @ticket 22526
	 */
	function test_category_name_change() {
		$term = self::factory()->category->create_and_get( array( 'name' => 'Foo' ) );
		$post_id = self::factory()->post->create();
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

		foreach ( range( 1, 9 ) as $i ) {
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

	public function test_get_term_should_update_term_cache_when_passed_an_object() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );
		$term = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$term_object = get_term( $term, 'wptests_tax' );
		wp_cache_delete( $term, 'terms' );

		// Affirm that the cache is empty.
		$this->assertEmpty( wp_cache_get( $term, 'terms' ) );

		$num_queries = $wpdb->num_queries;

		// get_term() will only be update the cache if the 'filter' prop is unset.
		unset( $term_object->filter );

		$term_object_2 = get_term( $term_object, 'wptests_tax' );

		// No new queries should have fired.
		$this->assertSame( $num_queries, $wpdb->num_queries );
		$this->assertEquals( $term_object, $term_object_2 );
	}

	public function test_get_term_should_update_term_cache_when_passed_a_valid_term_identifier() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );
		$term = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		wp_cache_delete( $term, 'terms' );

		// Affirm that the cache is empty.
		$this->assertEmpty( wp_cache_get( $term, 'terms' ) );

		$num_queries = $wpdb->num_queries;

		// Prime cache.
		$term_object = get_term( $term, 'wptests_tax' );
		$this->assertNotEmpty( wp_cache_get( $term, 'terms' ) );
		$this->assertSame( $num_queries + 1, $wpdb->num_queries );

		$term_object_2 = get_term( $term, 'wptests_tax' );

		// No new queries should have fired.
		$this->assertSame( $num_queries + 1, $wpdb->num_queries );
		$this->assertEquals( $term_object, $term_object_2 );
	}

	public function test_get_term_by_should_update_term_cache_when_passed_a_valid_term_identifier() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );
		$term = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		wp_cache_delete( $term, 'terms' );

		// Affirm that the cache is empty.
		$this->assertEmpty( wp_cache_get( $term, 'terms' ) );

		$num_queries = $wpdb->num_queries;

		// Prime cache.
		$term_object = get_term_by( 'id', $term, 'wptests_tax' );
		$this->assertNotEmpty( wp_cache_get( $term, 'terms' ) );
		$this->assertSame( $num_queries + 1, $wpdb->num_queries );

		$term_object_2 = get_term( $term, 'wptests_tax' );

		// No new queries should have fired.
		$this->assertSame( $num_queries + 1, $wpdb->num_queries );
		$this->assertEquals( $term_object, $term_object_2 );
	}

	/**
	 * @ticket 30749
	 */
	public function test_get_terms_should_update_cache_for_located_terms() {
		global $wpdb;

		register_taxonomy( 'wptests_tax', 'post' );

		$terms = self::factory()->term->create_many( 5, array(
			'taxonomy' => 'wptests_tax',
		) );

		$term_objects = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
		) );

		$num_queries = $wpdb->num_queries;

		foreach ( $terms as $term_id ) {
			get_term( $term_id, 'wptests_tax' );
		}

		$this->assertSame( $num_queries, $wpdb->num_queries );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 35462
	 */
	public function test_term_objects_should_not_be_modified_by_update_term_cache() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$p = self::factory()->post->create();

		wp_set_object_terms( $p, $t, 'wptests_tax' );

		$terms = wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'all_with_object_id' ) );

		update_term_cache( $terms );

		foreach ( $terms as $term ) {
			$this->assertSame( $p, $term->object_id );
		}
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_slug_cache() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'slug' => 'burrito', 'name' => 'Taco', 'taxonomy' => 'post_tag' ) );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;

		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( 'Taco', $term->name );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// This should now hit cache.
		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$this->assertEquals( 'Taco', $term->name );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		$this->assertEquals( get_term( $term_id, 'post_tag' ), $term );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_slug_cache_update() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'slug' => 'burrito', 'name' => 'Taco', 'taxonomy' => 'post_tag' ) );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;

		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( 'Taco', $term->name );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// This should now hit cache.
		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$this->assertEquals( 'Taco', $term->name );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// Update the tag which invalidates the cache.
		wp_update_term( $term_id, 'post_tag', array( 'name' => 'No Taco' ) );
		$num_queries = $wpdb->num_queries;

		// This should not hit cache.
		$term = get_term_by( 'slug', 'burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( 'No Taco', $term->name );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_name_cache() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'Burrito', 'slug' => 'noburrito', 'taxonomy' => 'post_tag' ) );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;

		get_term_by( 'name', 'Burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// This should now hit cache.
		$term = get_term_by( 'name', 'Burrito', 'post_tag' );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		$this->assertEquals( get_term( $term_id, 'post_tag' ), $term );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_get_term_by_name_cache_update() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'Burrito', 'slug' => 'noburrito', 'taxonomy' => 'post_tag' ) );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;

		get_term_by( 'name', 'Burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// This should now hit cache.
		get_term_by( 'name', 'Burrito', 'post_tag' );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// Update the tag which invalidates the cache.
		wp_update_term( $term_id, 'post_tag', array( 'slug' => 'taco' ) );
		$num_queries = $wpdb->num_queries;

		// This should not hit cache.
		get_term_by( 'name', 'burrito', 'post_tag' );
		$num_queries++;
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 21760
	 */
	function test_invalidating_term_caches_should_fail_when_invalidation_is_suspended() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'Burrito', 'taxonomy' => 'post_tag' ) );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;
		$last_changed = wp_cache_get( 'last_changed', 'terms' );

		$term1 = get_term_by( 'name', 'Burrito', 'post_tag' );
		$num_queries++;

		// Verify the term is cached.
		$term2 = get_term_by( 'name', 'Burrito', 'post_tag' );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
		$this->assertEquals( $term1, $term2 );

		$suspend = wp_suspend_cache_invalidation();

		// Update the tag.
		wp_update_term( $term_id, 'post_tag', array( 'name' => 'Taco' ) );
		$num_queries = $wpdb->num_queries;

		// Verify that the cached term still matches the initial cached term.
		$term3 = get_term_by( 'name', 'Burrito', 'post_tag' );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
		$this->assertEquals( $term1, $term3 );

		// Verify that last changed has not been updated as part of an invalidation routine.
		$this->assertSame( $last_changed, wp_cache_get( 'last_changed', 'terms' ) );

		// Clean up.
		wp_suspend_cache_invalidation( $suspend );
	}

	/**
	 * @ticket 21760
	 */
	public function test_get_term_by_does_not_prime_term_meta_cache() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'Burrito', 'taxonomy' => 'post_tag' ) );
		add_term_meta( $term_id, 'foo', 'bar' );

		clean_term_cache( $term_id, 'post_tag' );
		$num_queries = $wpdb->num_queries;

		$term = get_term_by( 'name', 'Burrito', 'post_tag' );
		$num_queries++;
		$this->assertTrue( $term instanceof WP_Term );
		$this->assertSame( $term_id, $term->term_id );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		$term_meta = get_term_meta( $term_id, 'foo', true );
		$num_queries++;
		$this->assertSame( $term_meta, 'bar' );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 37291
	 */
	public function test_get_object_term_cache_should_return_error_if_any_term_is_an_error() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		$p = self::factory()->post->create();
		wp_set_object_terms( $p, $t, 'wptests_tax' );

		// Prime cache.
		$terms = get_the_terms( $p, 'wptests_tax' );
		$this->assertEqualSets( array( $t ), wp_list_pluck( $terms, 'term_id' ) );

		/*
		 * Modify cached array to insert an empty term ID,
		 * which will trigger an error in get_term().
		 */
		$cached_ids = wp_cache_get( $p, 'wptests_tax_relationships' );
		$cached_ids[] = 0;
		wp_cache_set( $p, $cached_ids, 'wptests_tax_relationships' );

		$terms = get_the_terms( $p, 'wptests_tax' );
		$this->assertWPError( $terms );
	}
}
