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
	function test_get_terms_cache() {
		global $wpdb;

		$posts = $this->factory->post->create_many( 15, array( 'post_type' => 'post' ) );
		foreach ( $posts as $post )
			wp_set_object_terms( $post, rand_str(), 'post_tag' );
		wp_cache_delete( 'last_changed', 'terms' );

		$this->assertFalse( wp_cache_get( 'last_changed', 'terms' ) );

		$num_queries = $wpdb->num_queries;

		// last_changed and num_queries should bump
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 15, count( $terms ) );
		$time1 = wp_cache_get( 'last_changed', 'terms' );
		$this->assertNotEmpty( $time1 );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 15, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;


		// Different query. num_queries should bump, last_changed should remain the same.
		$terms = get_terms( 'post_tag', array( 'number' => 10 ) );
		$this->assertEquals( 10, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag', array( 'number' => 10 ) );
		$this->assertEquals( 10, count( $terms ) );
		$this->assertEquals( $time1, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries, $wpdb->num_queries );

		// Force last_changed to bump
		wp_delete_term( $terms[0]->term_id, 'post_tag' );

		$num_queries = $wpdb->num_queries;
		$this->assertNotEquals( $time1, $time2 = wp_cache_get( 'last_changed', 'terms' ) );

		// last_changed and num_queries should bump after a term is deleted
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 14, count( $terms ) );
		$this->assertEquals( $time2, wp_cache_get( 'last_changed', 'terms' ) );
		$this->assertEquals( $num_queries + 1, $wpdb->num_queries );

		$num_queries = $wpdb->num_queries;

		// Again. last_changed and num_queries should remain the same.
		$terms = get_terms( 'post_tag' );
		$this->assertEquals( 14, count( $terms ) );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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
			$terms['child2'] => $terms['parent1'],
		);

		_unregister_taxonomy( 'hierarchical_fields' );

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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

		$this->assertEqualSets( $expected, $found );
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
}
