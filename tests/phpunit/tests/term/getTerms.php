<?php

/**
 * @group taxonomy
 */
class Tests_Term_getTerms extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();

		_clean_term_filters();
		wp_cache_delete( 'last_changed', 'terms' );
	}

	/**
	 * @ticket 23326
	 */
	public function test_get_terms_cache() {
		global $wpdb;

		$this->set_up_three_posts_and_tags();

		$num_queries = $wpdb->num_queries;

		// last_changed and num_queries should bump
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 3, count( $terms ) );
		$time1 = wp_cache_get( 'last_changed', 'terms' );
		$this->assertNotEmpty( $time1 );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 3, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 23326
	 */
	public function test_get_terms_cache_should_be_missed_when_passing_number() {
		global $wpdb;

		$this->set_up_three_posts_and_tags();

		// Prime cache
		$terms = get_terms( 'post_tag' );
		$time1 = wp_cache_get( 'last_changed', 'terms' );
		$num_queries = $wpdb->num_queries;

		// num_queries should bump, last_changed should remain the same.
		$terms = get_terms( 'post_tag', array( 'number' => 2 ) );
		$this->assertEquals( 2, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag', array( 'number' => 2 ) );
		$this->assertEquals( 2, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 23326
	 */
	public function test_wp_delete_term_should_invalidate_cache() {
		global $wpdb;

		$this->set_up_three_posts_and_tags();

		// Prime cache
		$terms = get_terms( 'post_tag' );
		$time1 = wp_cache_get( 'last_changed', 'terms' );
		$num_queries = $wpdb->num_queries;

		// Force last_changed to bump.
		wp_delete_term( $terms[0]->term_id, 'post_tag' );

		$num_queries = $wpdb->num_queries;
		$this->assertNotEquals( $time1, $time2 = wp_cache_get( 'last_changed', 'terms' ) );

		// last_changed and num_queries should bump after a term is deleted.
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 2, count( $terms ) );
		$this->assertEquals( $time2, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 2, count( $terms ) );
		$this->assertEquals( $time2, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// @todo Repeat with term insert and update.
	}

	/**
	 * @ticket 23506
	 */
	function test_get_terms_should_allow_arbitrary_indexed_taxonomies_array() {
		$term_id = $this->factory->tag->create();
		$terms = get_terms( array( '111' => 'post_tag' ), array( 'hide_empty' => false ) );
		$this->assertEquals( $term_id, reset( $terms )->term_id );
	}

	/**
	 * @ticket 13661
	 */
	function test_get_terms_fields() {
		$term_id1 = $this->factory->tag->create( array( 'slug' => 'woo', 'name' => 'WOO!' ) );
		$term_id2 = $this->factory->tag->create( array( 'slug' => 'hoo', 'name' => 'HOO!', 'parent' => $term_id1 ) );

		$terms_id_parent = get_terms( 'post_tag', array( 'hide_empty' => false, 'fields' => 'id=>parent' ) );
		$this->assertEquals( array(
			$term_id1 => 0,
			$term_id2 => $term_id1
		), $terms_id_parent );

		$terms_ids = get_terms( 'post_tag', array( 'hide_empty' => false, 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms_ids );

		$terms_name = get_terms( 'post_tag', array( 'hide_empty' => false, 'fields' => 'names' ) );
		$this->assertEqualSets( array( 'WOO!', 'HOO!' ), $terms_name );

		$terms_id_name = get_terms( 'post_tag', array( 'hide_empty' => false, 'fields' => 'id=>name' ) );
		$this->assertEquals( array(
			$term_id1 => 'WOO!',
			$term_id2 => 'HOO!',
		), $terms_id_name );

		$terms_id_slug = get_terms( 'post_tag', array( 'hide_empty' => false, 'fields' => 'id=>slug' ) );
		$this->assertEquals( array(
			$term_id1 => 'woo',
			$term_id2 => 'hoo'
		), $terms_id_slug );
	}

 	/**
	 * @ticket 11823
 	 */
	function test_get_terms_include_exclude() {
		global $wpdb;

		$term_id1 = $this->factory->tag->create();
		$term_id2 = $this->factory->tag->create();
		$inc_terms = get_terms( 'post_tag', array(
			'include' => array( $term_id1, $term_id2 ),
			'hide_empty' => false
		) );
		$this->assertEquals( array( $term_id1, $term_id2 ), wp_list_pluck( $inc_terms, 'term_id' ) );

		$exc_terms = get_terms( 'post_tag', array(
			'exclude' => array( $term_id1, $term_id2 ),
			'hide_empty' => false
		) );
		$this->assertEquals( array(), wp_list_pluck( $exc_terms, 'term_id' ) );

		// These should not generate query errors.
		get_terms( 'post_tag', array( 'exclude' => array( 0 ), 'hide_empty' => false ) );
		$this->assertEmpty( $wpdb->last_error );

		get_terms( 'post_tag', array( 'exclude' => array( 'unexpected-string' ), 'hide_empty' => false ) );
		$this->assertEmpty( $wpdb->last_error );

		get_terms( 'post_tag', array( 'include' => array( 'unexpected-string' ), 'hide_empty' => false ) );
		$this->assertEmpty( $wpdb->last_error );
	}

	/**
	 * @ticket 30275
	 */
	public function test_exclude_with_hierarchical_true_for_non_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );

		$terms = $this->factory->term->create_many( 2, array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = get_terms( 'wptests_tax', array(
			'taxonomy' => 'wptests_tax',
			'hide_empty' => false,
			'exclude_tree' => array( $terms[0] ),
			'hierarchical' => true,
		) );

		$this->assertEquals( array( $terms[1] ), wp_list_pluck( $found, 'term_id' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 25710
	 */
	function test_get_terms_exclude_tree() {

		$term_id_uncategorized = get_option( 'default_category' );

		$term_id1 = $this->factory->category->create();
		$term_id11 = $this->factory->category->create( array( 'parent' => $term_id1 ) );
		$term_id2 = $this->factory->category->create();
		$term_id22 = $this->factory->category->create( array( 'parent' => $term_id2 ) );

		$terms = get_terms( 'category', array(
			'exclude' => $term_id_uncategorized,
			'fields' => 'ids',
			'hide_empty' => false,
		) );
		$this->assertEquals( array( $term_id1, $term_id11, $term_id2, $term_id22 ), $terms );

		$terms = get_terms( 'category', array(
			'fields' => 'ids',
			'exclude_tree' => "$term_id1,$term_id_uncategorized",
			'hide_empty' => false,
		) );

		$this->assertEquals( array( $term_id2, $term_id22 ), $terms );

	}

	/**
	 * @ticket 13992
	 */
	function test_get_terms_search() {
		$term_id1 = $this->factory->tag->create( array( 'slug' => 'burrito' ) );
		$term_id2 = $this->factory->tag->create( array( 'name' => 'Wilbur' ) );

		$terms = get_terms( 'post_tag', array( 'hide_empty' => false, 'search' => 'bur', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms );
	}

	/**
	 * @ticket 8214
	 */
	function test_get_terms_like() {
		$term_id1 = $this->factory->tag->create( array( 'name' => 'burrito', 'description' => 'This is a burrito.' ) );
		$term_id2 = $this->factory->tag->create( array( 'name' => 'taco', 'description' => 'Burning man.' ) );

		$terms = get_terms( 'post_tag', array( 'hide_empty' => false, 'name__like' => 'bur', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1 ), $terms );

		$terms2 = get_terms( 'post_tag', array( 'hide_empty' => false, 'description__like' => 'bur', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms2 );

		$terms3 = get_terms( 'post_tag', array( 'hide_empty' => false, 'name__like' => 'Bur', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1 ), $terms3 );

		$terms4 = get_terms( 'post_tag', array( 'hide_empty' => false, 'description__like' => 'Bur', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms4 );

		$terms5 = get_terms( 'post_tag', array( 'hide_empty' => false, 'name__like' => 'ENCHILADA', 'fields' => 'ids' ) );
		$this->assertEmpty( $terms5 );

		$terms6 = get_terms( 'post_tag', array( 'hide_empty' => false, 'description__like' => 'ENCHILADA', 'fields' => 'ids' ) );
		$this->assertEmpty( $terms6 );

		$terms7 = get_terms( 'post_tag', array( 'hide_empty' => false, 'name__like' => 'o', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms7 );

		$terms8 = get_terms( 'post_tag', array( 'hide_empty' => false, 'description__like' => '.', 'fields' => 'ids' ) );
		$this->assertEqualSets( array( $term_id1, $term_id2 ), $terms8 );
	}

	/**
	 * @ticket 26903
	 */
	function test_get_terms_parent_zero() {
		$tax = 'food';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$cheese = $this->factory->term->create( array( 'name' => 'Cheese', 'taxonomy' => $tax ) );

		$cheddar = $this->factory->term->create( array( 'name' => 'Cheddar', 'parent' => $cheese, 'taxonomy' => $tax ) );

		$post_ids = $this->factory->post->create_many( 2 );
		foreach ( $post_ids as $id ) {
			wp_set_post_terms( $id, $cheddar, $tax );
		}
		$term = get_term( $cheddar, $tax );
		$this->assertEquals( 2, $term->count );

		$brie = $this->factory->term->create( array( 'name' => 'Brie', 'parent' => $cheese, 'taxonomy' => $tax ) );
		$post_ids = $this->factory->post->create_many( 7 );
		foreach ( $post_ids as $id ) {
			wp_set_post_terms( $id, $brie, $tax );
		}
		$term = get_term( $brie, $tax );
		$this->assertEquals( 7, $term->count );

		$crackers = $this->factory->term->create( array( 'name' => 'Crackers', 'taxonomy' => $tax ) );

		$butter = $this->factory->term->create( array( 'name' => 'Butter', 'parent' => $crackers, 'taxonomy' => $tax ) );
		$post_ids = $this->factory->post->create_many( 1 );
		foreach ( $post_ids as $id ) {
			wp_set_post_terms( $id, $butter, $tax );
		}
		$term = get_term( $butter, $tax );
		$this->assertEquals( 1, $term->count );

		$multigrain = $this->factory->term->create( array( 'name' => 'Multigrain', 'parent' => $crackers, 'taxonomy' => $tax ) );
		$post_ids = $this->factory->post->create_many( 3 );
		foreach ( $post_ids as $id ) {
			wp_set_post_terms( $id, $multigrain, $tax );
		}
		$term = get_term( $multigrain, $tax );
		$this->assertEquals( 3, $term->count );

		$fruit = $this->factory->term->create( array( 'name' => 'Fruit', 'taxonomy' => $tax ) );
		$cranberries = $this->factory->term->create( array( 'name' => 'Cranberries', 'parent' => $fruit, 'taxonomy' => $tax ) );

		$terms = get_terms( $tax, array( 'parent' => 0, 'cache_domain' => $tax ) );
		$this->assertEquals( 2, count( $terms ) );
		$this->assertEquals( wp_list_pluck( $terms, 'name' ), array( 'Cheese', 'Crackers' ) );
	}

	/**
	 * @ticket 26903
	 */
	function test_get_terms_grandparent_zero() {
		$tax = 'food';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$cheese = $this->factory->term->create( array( 'name' => 'Cheese', 'taxonomy' => $tax ) );
		$cheddar = $this->factory->term->create( array( 'name' => 'Cheddar', 'parent' => $cheese, 'taxonomy' => $tax ) );
		$spread = $this->factory->term->create( array( 'name' => 'Spread', 'parent' => $cheddar, 'taxonomy' => $tax ) );
		$post_id = $this->factory->post->create();
		wp_set_post_terms( $post_id, $spread, $tax );
		$term = get_term( $spread, $tax );
		$this->assertEquals( 1, $term->count );

		$terms = get_terms( $tax, array( 'parent' => 0, 'cache_domain' => $tax ) );
		$this->assertEquals( 1, count( $terms ) );
		$this->assertEquals( array( 'Cheese' ), wp_list_pluck( $terms, 'name' ) );

		_unregister_taxonomy( $tax );
	}

	/**
	 * @ticket 26903
	 */
	function test_get_terms_seven_levels_deep() {
		$tax = 'deep';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );
		$parent = 0;
		$t = array();
		foreach ( range( 1, 7 ) as $depth ) {
			$t[$depth] = $this->factory->term->create( array( 'name' => 'term' . $depth, 'taxonomy' => $tax, 'parent' => $parent ) );
			$parent = $t[$depth];
		}
		$post_id = $this->factory->post->create();
		wp_set_post_terms( $post_id, $t[7], $tax );
		$term = get_term( $t[7], $tax );
		$this->assertEquals( 1, $term->count );

		$terms = get_terms( $tax, array( 'parent' => 0, 'cache_domain' => $tax ) );
		$this->assertEquals( 1, count( $terms ) );
		$this->assertEquals( array( 'term1' ), wp_list_pluck( $terms, 'name' ) );

		_unregister_taxonomy( $tax );
	}

	/**
	 * @ticket 27123
	 */
	function test_get_terms_child_of() {
		$parent = $this->factory->category->create();
		$child = $this->factory->category->create( array( 'parent' => $parent ) );

		$terms = get_terms( 'category', array( 'child_of' => $parent, 'hide_empty' => false ) );
		$this->assertEquals( 1, count( $terms ) );
	}

	/**
	 * @ticket 31118
	 */
	public function test_child_of_should_skip_query_when_specified_parent_is_not_found_in_hierarchy_cache() {
		global $wpdb;

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true, ) );

		$terms = $this->factory->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );

		$num_queries = $wpdb->num_queries;

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'child_of' => $terms[0],
		) );

		$this->assertEmpty( $found );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 31118
	 */
	public function test_child_of_should_respect_multiple_taxonomies() {
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => true ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t2 ) );

		$found = get_terms( array( 'wptests_tax1', 'wptests_tax2' ), array(
			'fields' => 'ids',
			'hide_empty' => false,
			'child_of' => $t2,
		) );

		$this->assertEqualSets( array( $t3 ), $found );
	}

	/**
	 * @ticket 27123
	 */
	function test_get_term_children_recursion() {
		// Assume there is a way to insert a term with the parent pointing to itself
		// See: https://core.trac.wordpress.org/changeset/15806
		remove_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10 );

		$term = wp_insert_term( 'Test', 'category' );
		$term = wp_update_term( $term['term_id'], 'category', array( 'parent' => $term['term_id'] ) );
		$term = get_term( $term['term_id'], 'category' );

		$this->assertEquals( $term->term_id, $term->parent );
		$this->assertInternalType( 'array', get_term_children( $term->term_id, 'category' ) );

		add_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10, 3 );
	}

	/**
	 * @covers ::_get_term_children
	 * @ticket 24461
	 */
	public function test__get_term_children_handles_cycles() {
		remove_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10 );

		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array( 'parent' => $c1 ) );
		$c3 = $this->factory->category->create( array( 'parent' => $c2 ) );
		wp_update_term( $c1, 'category', array( 'parent' => $c3 ) );

		add_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10, 3 );

		$result = _get_term_children( $c1, array( $c1, $c2, $c3 ), 'category' );

		$this->assertEqualSets( array( $c2, $c3 ), $result );
	}

	/**
	 * @covers ::_get_term_children
	 * @ticket 24461
	 */
	public function test__get_term_children_handles_cycles_when_terms_argument_contains_objects() {
		remove_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10 );

		$c1 = $this->factory->category->create_and_get();
		$c2 = $this->factory->category->create_and_get( array( 'parent' => $c1->term_id ) );
		$c3 = $this->factory->category->create_and_get( array( 'parent' => $c2->term_id ) );
		wp_update_term( $c1->term_id, 'category', array( 'parent' => $c3->term_id ) );

		add_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10, 3 );

		$result = _get_term_children( $c1->term_id, array( $c1, $c2, $c3 ), 'category' );

		$this->assertEqualSets( array( $c2, $c3 ), $result );
	}

	public function test_get_terms_by_slug() {
		$t1 = $this->factory->tag->create( array( 'slug' => 'foo' ) );
		$t2 = $this->factory->tag->create( array( 'slug' => 'bar' ) );

		$found = get_terms( 'post_tag', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'slug' => 'foo',
		) );

		$this->assertEquals( array( $t1 ), $found );
	}

	/**
	 * @ticket 23636
	 */
	public function test_get_terms_by_multiple_slugs() {
		$t1 = $this->factory->tag->create( array( 'slug' => 'foo' ) );
		$t2 = $this->factory->tag->create( array( 'slug' => 'bar' ) );
		$t3 = $this->factory->tag->create( array( 'slug' => 'barry' ) );

		$found = get_terms( 'post_tag', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'slug' => array( 'foo', 'barry' )
		) );

		$this->assertEquals( array( $t1, $t3 ), $found );
	}

	/**
	 * @ticket 30611
	 */
	public function test_get_terms_by_name() {
		$t1 = $this->factory->tag->create( array( 'name' => 'Foo' ) );
		$t2 = $this->factory->tag->create( array( 'name' => 'Bar' ) );

		$found = get_terms( 'post_tag', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'name' => 'Foo',
		) );

		$this->assertEquals( array( $t1 ), $found );
	}

	/**
	 * @ticket 30611
	 */
	public function test_get_terms_by_multiple_names() {
		$t1 = $this->factory->tag->create( array( 'name' => 'Foo' ) );
		$t2 = $this->factory->tag->create( array( 'name' => 'Bar' ) );
		$t3 = $this->factory->tag->create( array( 'name' => 'Barry' ) );

		$found = get_terms( 'post_tag', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'name' => array( 'Foo', 'Barry' )
		) );

		$this->assertEqualSets( array( $t3, $t1 ), $found );
	}

	/**
	 * @ticket 32248
	 */
	public function test_name_should_match_encoded_html_entities() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'Foo & Bar',
			'slug' => 'foo-and-bar',
		) );

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'name' => 'Foo & Bar',
		) );
		$this->assertEqualSets( array( $t ), $found );

		// array format.
		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'name' => array( 'Foo & Bar' ),
		) );
		$this->assertEqualSets( array( $t ), $found );
	}

	/**
	 * @ticket 29839
	 */
	public function test_childless_should_return_all_terms_for_flat_hierarchy() {
		// If run on a flat hierarchy it should return everything.
		$flat_tax = 'countries';
		register_taxonomy( $flat_tax, 'post', array( 'hierarchical' => false ) );
		$australia = $this->factory->term->create( array( 'name' => 'Australia', 'taxonomy' => $flat_tax ) );
		$china     = $this->factory->term->create( array( 'name' => 'China',     'taxonomy' => $flat_tax ) );
		$tanzania  =  $this->factory->term->create( array( 'name' => 'Tanzania',  'taxonomy' => $flat_tax ) );

		$terms = get_terms( $flat_tax, array(
			'childless' => true,
			'hide_empty' => false,
			'fields' => 'ids',
		) );

		$expected = array( $australia, $china, $tanzania );
		$this->assertEqualSets( $expected, $terms );
	}


	/**
	 * @ticket 29839
	 */
	public function test_childless_hierarchical_taxonomy() {
		$tax = 'location';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );
		/*
		Canada
			Ontario
				Ottawa
					Nepean
				Toronto
			Quebec
				Montreal
			PEI
		*/
		// Level 1
		$canada = $this->factory->term->create( array( 'name' => 'Canada', 'taxonomy' => $tax ) );

		// Level 2
		$ontario = $this->factory->term->create( array( 'name' => 'Ontario', 'parent' => $canada, 'taxonomy' => $tax ) );
		$quebec  = $this->factory->term->create( array( 'name' => 'Quebec', 'parent' => $canada, 'taxonomy' => $tax ) );
		$pei     = $this->factory->term->create( array( 'name' => 'PEI', 'parent' => $canada, 'taxonomy' => $tax ) );

		// Level 3
		$toronto  = $this->factory->term->create( array( 'name' => 'Toronto', 'parent' => $ontario, 'taxonomy' => $tax ) );
		$ottawa   = $this->factory->term->create( array( 'name' => 'Ottawa', 'parent' => $ontario, 'taxonomy' => $tax ) );
		$montreal = $this->factory->term->create( array( 'name' => 'Montreal', 'parent' => $quebec, 'taxonomy' => $tax ) );

		// Level 4
		$nepean = $this->factory->term->create( array( 'name' => 'Nepean', 'parent' => $ottawa, 'taxonomy' => $tax ) );

		$terms = get_terms( $tax, array(
			'childless' => true,
			'hide_empty' => false,
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $montreal, $nepean, $toronto, $pei ), $terms );
	}

	/**
	 * @ticket 29839
	 */
	public function test_childless_hierarchical_taxonomy_used_with_child_of() {
		$tax = 'location';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		// Level 1
		$canada = $this->factory->term->create( array( 'name' => 'Canada', 'taxonomy' => $tax ) );

		// Level 2
		$ontario = $this->factory->term->create( array( 'name' => 'Ontario', 'parent' => $canada, 'taxonomy' => $tax ) );
		$quebec  = $this->factory->term->create( array( 'name' => 'Quebec', 'parent' => $canada, 'taxonomy' => $tax ) );

		// Level 3
		$laval   = $this->factory->term->create( array( 'name' => 'Laval', 'parent' => $quebec, 'taxonomy' => $tax ) );
		$montreal = $this->factory->term->create( array( 'name' => 'Montreal', 'parent' => $quebec, 'taxonomy' => $tax ) );

		// Level 4
		$dorval = $this->factory->term->create( array( 'name' => 'Dorval', 'parent' => $montreal, 'taxonomy' => $tax ) );

		$terms = get_terms( $tax, array(
			'childless' => true,
			'child_of' => $quebec,
			'hide_empty' => false,
			'fields' => 'ids',
		) );

		$this->assertEqualSets( array( $laval ), $terms );
	}

	/**
	 * @ticket 29839
	 */
	public function test_childless_should_enforce_childless_status_for_all_queried_taxonomies() {
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => true ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1', 'parent' => $t1 ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t4 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t3 ) );

		$found = get_terms( array( 'wptests_tax1', 'wptests_tax2' ), array(
			'fields' => 'ids',
			'hide_empty' => false,
			'childless' => true,
		) );

		$this->assertEqualSets( array( $t2, $t4 ), $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_ids() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'ids',
		) );

		$expected = array(
			$terms['parent1'],
			$terms['parent2'],
			$terms['child1'],
			$terms['child2'],
			$terms['grandchild1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_ids() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'ids',
		) );

		$expected = array(
			$terms['parent1'],
			$terms['parent2'],
			$terms['child1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_ids_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'ids',
			'hierarchical' => false,
		) );

		$expected = array(
			$terms['parent2'],
			$terms['child1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_names() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'names',
		) );

		$expected = array(
			'Parent 1',
			'Parent 2',
			'Child 1',
			'Child 2',
			'Grandchild 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_names() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'names',
		) );

		$expected = array(
			'Parent 1',
			'Parent 2',
			'Child 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_names_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'names',
			'hierarchical' => false,
		) );

		$expected = array(
			'Parent 2',
			'Child 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_count() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'count',
		) );

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEquals( 5, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_count() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'count',
		) );

		_unregister_taxonomy( 'hierarchical_fields' );

		// When using 'fields=count', 'hierarchical' is forced to false.
		$this->assertEquals( 2, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_count_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'count',
			'hierarchical' => false,
		) );

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEquals( 2, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_idparent() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'id=>parent',
		) );

		$expected = array(
			$terms['parent1'] => 0,
			$terms['parent2'] => 0,
			$terms['child1'] => $terms['parent1'],
			$terms['child2'] => $terms['parent1'],
			$terms['grandchild1'] => $terms['child1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idparent() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>parent',
		) );

		$expected = array(
			$terms['parent1'] => 0,
			$terms['parent2'] => 0,
			$terms['child1'] => $terms['parent1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idparent_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>parent',
			'hierarchical' => false,
		) );

		$expected = array(
			$terms['parent2'] => 0,
			$terms['child1'] => $terms['parent1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_idslug() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'id=>slug',
		) );

		$expected = array(
			$terms['parent1'] => 'parent-1',
			$terms['parent2'] => 'parent-2',
			$terms['child1'] => 'child-1',
			$terms['child2'] => 'child-2',
			$terms['grandchild1'] => 'grandchild-1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	/**
	 * @ticket 29859
	 */
	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idslug() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>slug',
		) );

		$expected = array(
			$terms['parent1'] => 'parent-1',
			$terms['parent2'] => 'parent-2',
			$terms['child1'] => 'child-1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idslug_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>slug',
			'hierarchical' => false,
		) );

		$expected = array(
			$terms['parent2'] => 'parent-2',
			$terms['child1'] => 'child-1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_false_fields_idname() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => false,
			'fields' => 'id=>name',
		) );

		$expected = array(
			$terms['parent1'] => 'Parent 1',
			$terms['parent2'] => 'Parent 2',
			$terms['child1'] => 'Child 1',
			$terms['child2'] => 'Child 2',
			$terms['grandchild1'] => 'Grandchild 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	/**
	 * @ticket 29859
	 */
	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idname() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>name',
		) );

		$expected = array(
			$terms['parent1'] => 'Parent 1',
			$terms['parent2'] => 'Parent 2',
			$terms['child1'] => 'Child 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	public function test_get_terms_hierarchical_tax_hide_empty_true_fields_idname_hierarchical_false() {
		// Set up a clean taxonomy.
		$tax = 'hierarchical_fields';
		register_taxonomy( $tax, 'post', array( 'hierarchical' => true ) );

		$terms = $this->create_hierarchical_terms_and_posts();

		$found = get_terms( $tax, array(
			'hide_empty' => true,
			'fields' => 'id=>name',
			'hierarchical' => false,
		) );

		$expected = array(
			$terms['parent2'] => 'Parent 2',
			$terms['child1'] => 'Child 1',
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSetsWithIndex( $expected, $found );
	}

	/**
	 * @ticket 31118
	 */
	public function test_hierarchical_should_recurse_properly_for_all_taxonomies() {
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => true ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1', 'parent' => $t1 ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1', 'parent' => $t2 ) );

		$t4 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t5 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t4 ) );
		$t6 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t5 ) );

		$p = $this->factory->post->create();

		wp_set_object_terms( $p, $t3, 'wptests_tax1' );
		wp_set_object_terms( $p, $t6, 'wptests_tax2' );

		$found = get_terms( array( 'wptests_tax1', 'wptests_tax2' ), array(
			'hierarchical' => true,
			'hide_empty' => true,
			'fields' => 'ids',
		) );

		/*
		 * Should contain all terms, since they all have non-empty descendants.
		 * To make the case clearer, test taxonomies separately.
		 */

		// First taxonomy.
		$this->assertContains( $t1, $found );
		$this->assertContains( $t2, $found );
		$this->assertContains( $t3, $found );

		// Second taxonomy.
		$this->assertContains( $t4, $found );
		$this->assertContains( $t5, $found );
		$this->assertContains( $t6, $found );
	}

	/**
	 * @ticket 23261
	 */
	public function test_orderby_include() {
		$tax = 'wptests_tax';
		register_taxonomy( $tax, 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => $tax ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => $tax ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => $tax ) );
		$t4 = $this->factory->term->create( array( 'taxonomy' => $tax ) );

		$found = get_terms( $tax, array(
			'fields' => 'ids',
			'include' => array( $t4, $t1, $t2 ),
			'orderby' => 'include',
			'hide_empty' => false,
		) );

		_unregister_taxonomy( 'wptests_tax' );

		$this->assertEquals( array( $t4, $t1, $t2 ), $found );
	}

	/**
	 * @ticket 31364
	 */
	public function test_orderby_description() {
		$tax = 'wptests_tax';
		register_taxonomy( $tax, 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => $tax, 'description' => 'fff' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => $tax, 'description' => 'aaa' ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => $tax, 'description' => 'zzz' ) );
		$t4 = $this->factory->term->create( array( 'taxonomy' => $tax, 'description' => 'jjj' ) );

		$found = get_terms( $tax, array(
			'fields' => 'ids',
			'orderby' => 'description',
			'hide_empty' => false,
		) );

		_unregister_taxonomy( 'wptests_tax' );

		$this->assertEquals( array( $t2, $t1, $t4, $t3 ), $found );
	}

	public function test_hierarchical_false_with_parent() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is false
		$terms = get_terms( 'category', array(
			'hierarchical' => false,
			'parent' => $initial_terms['one_term']['term_id']
		) );

		// Verify that there are no children
		$this->assertEquals( 0, count( $terms ) );
	}

	/**
	 * @ticket 29185
	 */
	public function test_hierarchical_true_with_parent() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is true
		$terms = get_terms( 'category', array(
			'hierarchical' => true,
			'parent' => $initial_terms['one_term']['term_id']
		) );

		// Verify that the children with non-empty descendants are returned
		$expected = array(
			$initial_terms['two_term']['term_id'],
			$initial_terms['five_term']['term_id'],
		);
		$actual = wp_list_pluck( $terms, 'term_id' );
		$this->assertEqualSets( $expected, $actual );
	}

	public function test_hierarchical_false_with_child_of_and_direct_child() {
		$initial_terms = $this->create_hierarchical_terms();
		$post_id = $this->factory->post->create();
		wp_set_post_terms(
			$post_id,
			array( $initial_terms['seven_term']['term_id'] ),
			'category'
		);

		// Case where hierarchical is false
		$terms = get_terms( 'category', array(
			'hierarchical' => false,
			'child_of' => $initial_terms['one_term']['term_id']
		) );

		$expected = array(
			$initial_terms['seven_term']['term_id'],
		);

		$actual = wp_list_pluck( $terms, 'term_id' );
		$this->assertEqualSets( $expected, $actual );
	}

	public function test_hierarchical_false_with_child_of_should_not_return_grandchildren() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is false
		$terms = get_terms( 'category', array(
			'hierarchical' => false,
			'child_of' => $initial_terms['one_term']['term_id']
		) );

		// Verify that there are no children
		$this->assertEquals( 0, count( $terms ) );
	}

	public function test_hierarchical_true_with_child_of_should_return_grandchildren() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is true
		$terms = get_terms( 'category', array(
			'hierarchical' => true,
			'child_of' => $initial_terms['one_term']['term_id']
		) );

		$expected = array(
			$initial_terms['two_term']['term_id'],
			$initial_terms['three_term']['term_id'],
			$initial_terms['five_term']['term_id'],
			$initial_terms['six_term']['term_id'],
		);
		$actual = wp_list_pluck( $terms, 'term_id' );
		$this->assertEqualSets( $expected, $actual );
	}

	public function test_parent_should_override_child_of() {
		$initial_terms = $this->create_hierarchical_terms();

		$terms = get_terms( 'category', array(
			'hide_empty' => false,
			'child_of' => $initial_terms['one_term']['term_id'],
			'parent' => $initial_terms['one_term']['term_id']
		) );

		// Verify that parent takes precedence over child_of and returns only direct children.
		$expected = array(
			$initial_terms['two_term']['term_id'],
			$initial_terms['five_term']['term_id'],
			$initial_terms['seven_term']['term_id']
		);
		$actual = wp_list_pluck( $terms, 'term_id' );
		$this->assertEqualSets( $expected, $actual );
	}

	/**
	 * @ticket 31118
	 */
	public function test_parent_should_skip_query_when_specified_parent_is_not_found_in_hierarchy_cache() {
		global $wpdb;

		if ( is_multisite() ) {
			$this->markTestSkipped( 'Not testable in MS: wpmu_create_blog() defines WP_INSTALLING, which causes cache misses.' );
		}

		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true, ) );

		$terms = $this->factory->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );

		$num_queries = $wpdb->num_queries;

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'parent' => $terms[0],
		) );

		$this->assertEmpty( $found );
		$this->assertSame( $num_queries, $wpdb->num_queries );
	}

	/**
	 * @ticket 31118
	 */
	public function test_parent_should_respect_multiple_taxonomies() {
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => true ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t2 ) );

		$found = get_terms( array( 'wptests_tax1', 'wptests_tax2' ), array(
			'fields' => 'ids',
			'hide_empty' => false,
			'parent' => $t2,
		) );

		$this->assertEqualSets( array( $t3 ), $found );
	}

	public function test_hierarchical_false_parent_should_override_child_of() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is false
		$terms = get_terms( 'category', array(
			'hierarchical' => false,
			'child_of' => $initial_terms['one_term']['term_id'],
			'parent' => $initial_terms['one_term']['term_id']
		) );

		// hierarchical=false means that descendants are not fetched.
		$this->assertEquals( 0, count( $terms ) );
	}

	/**
	 * @ticket 29185
	 */
	public function test_hierarchical_true_parent_overrides_child_of() {
		$initial_terms = $this->create_hierarchical_terms();

		// Case where hierarchical is true
		$terms = get_terms( 'category', array(
			'hierarchical' => true,
			'child_of' => $initial_terms['one_term']['term_id'],
			'parent' => $initial_terms['one_term']['term_id'],
		) );

		// Verify that parent takes precedence over child_of
		$expected = array(
			$initial_terms['two_term']['term_id'],
			$initial_terms['five_term']['term_id'],
		);
		$actual = wp_list_pluck( $terms, 'term_id' );
		$this->assertEqualSets( $expected, $actual );
	}

	public function test_pad_counts() {
		register_taxonomy( 'wptests_tax_1', 'post', array( 'hierarchical' => true ) );

		$posts = $this->factory->post->create_many( 3 );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_1',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_1',
			'parent' => $t1,
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_1',
			'parent' => $t2,
		) );

		wp_set_object_terms( $posts[0], array( $t1 ), 'wptests_tax_1' );
		wp_set_object_terms( $posts[1], array( $t2 ), 'wptests_tax_1' );
		wp_set_object_terms( $posts[2], array( $t3 ), 'wptests_tax_1' );

		$found = get_terms( 'wptests_tax_1', array(
			'pad_counts' => true,
		) );

		$this->assertEqualSets( array( $t1, $t2, $t3 ), wp_list_pluck( $found, 'term_id' ) );

		foreach ( $found as $f ) {
			if ( $t1 == $f->term_id ) {
				$this->assertSame( 3, $f->count );
			} elseif ( $t2 == $f->term_id ) {
				$this->assertSame( 2, $f->count );
			} else {
				$this->assertSame( 1, $f->count );
			}
		}
	}

	/**
	 * @ticket 20635
	 */
	public function test_pad_counts_should_not_recurse_infinitely_when_term_hierarchy_has_a_loop() {
		remove_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10 );

		$c1 = $this->factory->category->create();
		$c2 = $this->factory->category->create( array( 'parent' => $c1 ) );
		$c3 = $this->factory->category->create( array( 'parent' => $c2 ) );
		wp_update_term( $c1, 'category', array( 'parent' => $c3 ) );

		add_filter( 'wp_update_term_parent', 'wp_check_term_hierarchy_for_loops', 10, 3 );

		$posts = $this->factory->post->create_many( 3 );
		wp_set_post_terms( $posts[0], $c1, 'category' );
		wp_set_post_terms( $posts[1], $c2, 'category' );
		wp_set_post_terms( $posts[2], $c3, 'category' );

		$terms = get_terms( 'category', array(
			'pad_counts' => true,
		) );

		$this->assertEqualSets( array( $c1, $c2, $c3 ), wp_list_pluck( $terms, 'term_id' ) );

		foreach ( $terms as $term ) {
			$this->assertSame( 3, $term->count );
		}
	}

	/**
	 * @ticket 31118
	 */
	public function test_pad_counts_should_work_when_first_taxonomy_is_nonhierarchical_and_second_taxonomy_is_hierarchical() {
		register_taxonomy( 'wptests_tax1', 'post', array( 'hierarchical' => false ) );
		register_taxonomy( 'wptests_tax2', 'post', array( 'hierarchical' => true ) );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );
		$t3 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2', 'parent' => $t2 ) );

		$posts = $this->factory->post->create_many( 3 );
		wp_set_object_terms( $posts[0], $t1, 'wptests_tax1' );
		wp_set_object_terms( $posts[1], $t2, 'wptests_tax2' );
		wp_set_object_terms( $posts[2], $t3, 'wptests_tax2' );

		$found = get_terms( array( 'wptests_tax1', 'wptests_tax2' ), array(
			'pad_counts' => true,
		) );

		$this->assertEqualSets( array( $t1, $t2, $t3 ), wp_list_pluck( $found, 'term_id' ) );

		foreach ( $found as $f ) {
			if ( $t1 == $f->term_id ) {
				$this->assertEquals( 1, $f->count );
			} elseif ( $t2 == $f->term_id ) {
				$this->assertEquals( 2, $f->count );
			} else {
				$this->assertEquals( 1, $f->count );
			}
		}
	}

	protected function create_hierarchical_terms_and_posts() {
		$terms = array();

		$terms['parent1'] = $this->factory->term->create( array( 'slug' => 'parent-1', 'name' => 'Parent 1', 'taxonomy' => 'hierarchical_fields' ) );
		$terms['parent2'] = $this->factory->term->create( array( 'slug' => 'parent-2', 'name' => 'Parent 2', 'taxonomy' => 'hierarchical_fields' ) );
		$terms['child1'] = $this->factory->term->create( array( 'slug' => 'child-1', 'name' => 'Child 1', 'taxonomy' => 'hierarchical_fields', 'parent' => $terms['parent1'] ) );
		$terms['child2'] = $this->factory->term->create( array( 'slug' => 'child-2', 'name' => 'Child 2', 'taxonomy' => 'hierarchical_fields', 'parent' => $terms['parent1'] ) );
		$terms['grandchild1'] = $this->factory->term->create( array( 'slug' => 'grandchild-1', 'name' => 'Grandchild 1', 'taxonomy' => 'hierarchical_fields', 'parent' => $terms['child1'] ) );

		$post_id = $this->factory->post->create();
		wp_set_post_terms( $post_id, $terms['parent2'], 'hierarchical_fields', true );
		wp_set_post_terms( $post_id, $terms['child1'], 'hierarchical_fields', true );

		return $terms;
	}

	protected function create_hierarchical_terms() {
		// Set up the following hierarchy:
		// - One
		//   - Two
		//     - Three (1)
		//     - Four
		//   - Five
		//     - Six (1)
		//   - Seven
		$one_term = wp_insert_term(
			'One',
			'category'
		);
		$two_term = wp_insert_term(
			'Two',
			'category',
			array(
				'parent' => $one_term['term_id']
			)
		);
		$three_term = wp_insert_term(
			'Three',
			'category',
			array(
				'parent' => $two_term['term_id']
			)
		);
		$four_term = wp_insert_term(
			'Four',
			'category',
			array(
				'parent' => $two_term['term_id']
			)
		);
		$five_term = wp_insert_term(
			'Five',
			'category',
			array(
				'parent' => $one_term['term_id']
			)
		);
		$six_term = wp_insert_term(
			'Six',
			'category',
			array(
				'parent' => $five_term['term_id']
			)
		);
		$seven_term = wp_insert_term(
			'Seven',
			'category',
			array(
				'parent' => $one_term['term_id']
			)
		);

		// Ensure child terms are not empty
		$first_post_id = $this->factory->post->create();
		$second_post_id = $this->factory->post->create();
		wp_set_post_terms( $first_post_id, array( $three_term['term_id'] ), 'category' );
		wp_set_post_terms( $second_post_id, array( $six_term['term_id'] ), 'category' );

		return array(
			'one_term' => $one_term,
			'two_term' => $two_term,
			'three_term' => $three_term,
			'four_term' => $four_term,
			'five_term' => $five_term,
			'six_term' => $six_term,
			'seven_term' => $seven_term
		);
	}

	protected function set_up_three_posts_and_tags() {
		$posts = $this->factory->post->create_many( 3, array( 'post_type' => 'post' ) );
		foreach ( $posts as $post ) {
			wp_set_object_terms( $post, rand_str(), 'post_tag' );
		}

		wp_cache_delete( 'last_changed', 'terms' );
	}
}
