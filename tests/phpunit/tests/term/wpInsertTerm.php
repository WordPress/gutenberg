<?php

/**
 * @group taxonomy
 */
class Tests_Term_WpInsertTerm extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();

		_clean_term_filters();
		// insert one term into every post taxonomy
		// otherwise term_ids and term_taxonomy_ids might be identical, which could mask bugs
		$term = 'seed_term';
		foreach(get_object_taxonomies('post') as $tax)
			wp_insert_term( $term, $tax );
	}

	public function test_wp_insert_delete_term() {
		$taxonomy = 'wptests_tax';
		register_taxonomy( $taxonomy, 'post' );

		// a new unused term
		$term = 'term';
		$this->assertNull( term_exists($term) );

		$initial_count = wp_count_terms( $taxonomy );

		$t = wp_insert_term( $term, $taxonomy );
		$this->assertInternalType( 'array', $t );
		$this->assertNotWPError( $t );
		$this->assertTrue( $t['term_id'] > 0 );
		$this->assertTrue( $t['term_taxonomy_id'] > 0 );
		$this->assertEquals( $initial_count + 1, wp_count_terms( $taxonomy ) );

		// make sure the term exists
		$this->assertTrue( term_exists($term) > 0 );
		$this->assertTrue( term_exists($t['term_id']) > 0 );

		// now delete it
		add_filter( 'delete_term', array( $this, 'deleted_term_cb' ), 10, 5 );
		$this->assertTrue( wp_delete_term( $t['term_id'], $taxonomy ) );
		remove_filter( 'delete_term', array( $this, 'deleted_term_cb' ), 10, 5 );
		$this->assertNull( term_exists($term) );
		$this->assertNull( term_exists($t['term_id']) );
		$this->assertEquals( $initial_count, wp_count_terms( $taxonomy ) );
	}

	public function test_wp_insert_term_taxonomy_does_not_exist() {
		$found = wp_insert_term( 'foo', 'bar' );

		$this->assertWPError( $found );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	public function test_wp_insert_term_pre_insert_term_filter_returns_wp_error() {
		add_filter( 'pre_insert_term', array( $this, '_pre_insert_term_callback' ) );
		$found = wp_insert_term( 'foo', 'post_tag' );
		remove_filter( 'pre_insert_term', array( $this, '_pre_insert_term_callback' ) );

		$this->assertWPError( $found );
		$this->assertSame( 'custom_error', $found->get_error_code() );
	}

	public function test_wp_insert_term_term_0() {
		$found = wp_insert_term( 0, 'post_tag' );

		$this->assertWPError( $found );
		$this->assertSame( 'invalid_term_id', $found->get_error_code() );
	}

	public function test_wp_insert_term_term_trims_to_empty_string() {
		$found = wp_insert_term( '  ', 'post_tag' );

		$this->assertWPError( $found );
		$this->assertSame( 'empty_term_name', $found->get_error_code() );
	}

	public function test_wp_insert_term_parent_does_not_exist() {
		$found = wp_insert_term( 'foo', 'post_tag', array(
			'parent' => 999999,
		) );

		$this->assertWPError( $found );
		$this->assertSame( 'missing_parent', $found->get_error_code() );
	}

	public function test_wp_insert_term_unslash_name() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Let\\\'s all say \\"Hooray\\" for WordPress taxonomy', 'wptests_tax' );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'Let\'s all say "Hooray" for WordPress taxonomy', $term->name );
	}

	public function test_wp_insert_term_unslash_description() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Quality', 'wptests_tax', array(
			'description' => 'Let\\\'s all say \\"Hooray\\" for WordPress taxonomy',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'Let\'s all say "Hooray" for WordPress taxonomy', $term->description );
	}

	public function test_wp_insert_term_parent_string() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Quality', 'wptests_tax', array(
			'parent' => 'foo1',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		// 'foo1' is cast to 0 in sanitize_term().
		$this->assertSame( 0, $term->parent );
	}

	public function test_wp_insert_term_slug_empty_string() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Quality', 'wptests_tax', array(
			'slug' => '',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'quality', $term->slug );

	}

	public function test_wp_insert_term_slug_whitespace_string() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Quality', 'wptests_tax', array(
			'slug' => '  ',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'quality', $term->slug );
	}

	public function test_wp_insert_term_slug_0() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'Quality', 'wptests_tax', array(
			'slug' => 0,
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'quality', $term->slug );
	}

	/**
	 * @ticket 17689
	 */
	public function test_wp_insert_term_duplicate_name() {
		$term = self::factory()->tag->create_and_get( array( 'name' => 'Bozo' ) );
		$this->assertNotWPError( $term );
		$this->assertTrue( empty( $term->errors ) );

		// Test existing term name with unique slug
		$term1 = self::factory()->tag->create( array( 'name' => 'Bozo', 'slug' => 'bozo1' ) );
		$this->assertNotWPError( $term1 );

		// Test an existing term name
		$term2 = self::factory()->tag->create( array( 'name' => 'Bozo' ) );
		$this->assertWPError( $term2 );
		$this->assertNotEmpty( $term2->errors );

		// Test named terms ending in special characters
		$term3 = self::factory()->tag->create( array( 'name' => 'T$' ) );
		$term4 = self::factory()->tag->create( array( 'name' => 'T$$' ) );
		$term5 = self::factory()->tag->create( array( 'name' => 'T$$$' ) );
		$term6 = self::factory()->tag->create( array( 'name' => 'T$$$$' ) );
		$term7 = self::factory()->tag->create( array( 'name' => 'T$$$$' ) );
		$this->assertWPError( $term7 );
		$this->assertNotEmpty( $term7->errors );
		$this->assertEquals( $term6, $term7->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term3, $term4, $term5, $term6 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		// Test named terms with only special characters
		$term8 = self::factory()->tag->create( array( 'name' => '$' ) );
		$term9 = self::factory()->tag->create( array( 'name' => '$$' ) );
		$term10 = self::factory()->tag->create( array( 'name' => '$$$' ) );
		$term11 = self::factory()->tag->create( array( 'name' => '$$$$' ) );
		$term12 = self::factory()->tag->create( array( 'name' => '$$$$' ) );
		$this->assertWPError( $term12 );
		$this->assertNotEmpty( $term12->errors );
		$this->assertEquals( $term11, $term12->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term8, $term9, $term10, $term11 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		$term13 = self::factory()->tag->create( array( 'name' => 'A' ) );
		$this->assertNotWPError( $term13 );
		$term14 = self::factory()->tag->create( array( 'name' => 'A' ) );
		$this->assertWPError( $term14 );
		$term15 = self::factory()->tag->create( array( 'name' => 'A+', 'slug' => 'a' ) );
		$this->assertNotWPError( $term15 );
		$term16 = self::factory()->tag->create( array( 'name' => 'A+' ) );
		$this->assertWPError( $term16 );
		$term17 = self::factory()->tag->create( array( 'name' => 'A++' ) );
		$this->assertNotWPError( $term17 );
		$term18 = self::factory()->tag->create( array( 'name' => 'A-', 'slug' => 'a' ) );
		$this->assertNotWPError( $term18 );
		$term19 = self::factory()->tag->create( array( 'name' => 'A-' ) );
		$this->assertWPError( $term19 );
		$term20 = self::factory()->tag->create( array( 'name' => 'A--' ) );
		$this->assertNotWPError( $term20 );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_slug_is_a_duplicate_of_the_same_term_in_non_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'foo',
		) );

		$this->assertWPError( $t2 );
		$this->assertSame( 'term_exists', $t2->get_error_code() );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_slug_is_a_duplicate_of_a_different_term_in_non_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = self::factory()->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax',
		) );

		$t3 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'bar',
		) );

		$this->assertWPError( $t3 );
		$this->assertSame( 'term_exists', $t3->get_error_code() );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_allow_duplicate_names_when_a_unique_slug_has_been_provided_in_non_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'foo-unique',
		) );

		$this->assertNotWPError( $t2 );

		$t2_term = get_term( $t2['term_id'], 'wptests_tax' );
		$this->assertSame( 'foo-unique', $t2_term->slug );
		$this->assertSame( 'Foo', $t2_term->name );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_the_slug_is_not_provided_in_non_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax' );

		$this->assertWPError( $t2 );
		$this->assertSame( 'term_exists', $t2->get_error_code() );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_slug_is_a_duplicate_of_the_same_term_in_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'foo',
		) );

		$this->assertWPError( $t2 );
		$this->assertSame( 'term_exists', $t2->get_error_code() );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_slug_is_a_duplicate_of_a_different_term_at_same_hierarchy_level_in_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = self::factory()->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax',
		) );

		$t3 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'bar',
		) );

		$this->assertWPError( $t3 );
		$this->assertSame( 'term_exists', $t3->get_error_code() );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_allow_duplicate_names_when_slug_is_a_duplicate_of_a_term_at_different_hierarchy_level_in_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = self::factory()->term->create();

		$t3 = self::factory()->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'parent' => $t2,
			'taxonomy' => 'wptests_tax',
		) );

		$t4 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'bar',
		) );

		$this->assertNotWPError( $t4 );
		$t4_term = get_term( $t4['term_id'], 'wptests_tax' );

		// `wp_unique_term_slug()` allows term creation but iterates the slug.
		$this->assertSame( 'bar-2', $t4_term->slug );
		$this->assertSame( 'Foo', $t4_term->name );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_allow_duplicate_names_when_a_unique_slug_has_been_provided_in_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax', array(
			'slug' => 'foo-unique',
		) );

		$this->assertNotWPError( $t2 );

		$t2_term = get_term( $t2['term_id'], 'wptests_tax' );
		$this->assertSame( 'foo-unique', $t2_term->slug );
		$this->assertSame( 'Foo', $t2_term->name );
	}

	/**
	 * @ticket 31328
	 */
	public function test_wp_insert_term_should_not_allow_duplicate_names_when_the_slug_is_not_provided_in_hierarchical_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array( 'hierarchical' => true ) );
		$t1 = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax' );

		$this->assertWPError( $t2 );
		$this->assertSame( 'term_exists', $t2->get_error_code() );
	}
	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_duplicate_slug_same_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$created = wp_insert_term( 'Foo 2', 'wptests_tax', array(
			'slug' => 'foo',
		) );

		$created_term = get_term( $created['term_id'], 'wptests_tax' );
		$this->assertSame( 'foo-2', $created_term->slug );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_duplicate_slug_different_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );
		$t = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$created = wp_insert_term( 'Foo 2', 'wptests_tax_2', array(
			'slug' => 'foo',
		) );

		$this->assertNotWPError( $created );

		$new_term = get_term( $created['term_id'], 'wptests_tax_2' );

		$this->assertSame( 'foo', $new_term->slug );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_duplicate_slug_different_taxonomy_before_410_schema_change() {
		$old_db_version = 30055;
		update_option( 'db_version', $old_db_version );

		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );
		$t = self::factory()->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$created = wp_insert_term( 'Foo 2', 'wptests_tax_2', array(
			'slug' => 'foo',
		) );

		$this->assertNotWPError( $created );

		$new_term = get_term( $created['term_id'], 'wptests_tax_2' );

		/*
		 * As of 4.1, we no longer create a shared term, but we also do not
		 * allow for duplicate slugs.
		 */
		$this->assertSame( 'foo-2', $new_term->slug );
		$this->assertNotEquals( $new_term->term_id, $term->term_id );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_wp_insert_term_alias_of_no_term_group() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$term_1 = get_term( $t1, 'wptests_tax' );

		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax', array(
			'alias_of' => $term_1->slug,
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );

		$updated_term_1 = get_term( $term_1->term_id, 'wptests_tax' );

		$term = get_term( $created_term_ids['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 0, $term_1->term_group );
		$this->assertNotEmpty( $created_term->term_group );
		$this->assertSame( $created_term->term_group, $updated_term_1->term_group );
	}

	public function test_wp_insert_term_alias_of_existing_term_group() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$term_1 = get_term( $t1, 'wptests_tax' );

		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'alias_of' => $term_1->slug,
		) );
		$term_2 = get_term( $t2, 'wptests_tax' );

		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax', array(
			'alias_of' => $term_2->slug,
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertNotEmpty( $created_term->term_group );
		$this->assertSame( $created_term->term_group, $term_2->term_group );
	}

	public function test_wp_insert_term_alias_of_nonexistent_term() {
		register_taxonomy( 'wptests_tax', 'post' );
		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax', array(
			'alias_of' => 'foo',
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 0, $created_term->term_group );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_should_not_create_shared_term() {
		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );

		$t1 = wp_insert_term( 'Foo', 'wptests_tax' );
		$t2 = wp_insert_term( 'Foo', 'wptests_tax_2' );

		$this->assertNotEquals( $t1['term_id'], $t2['term_id'] );
	}

	public function test_wp_insert_term_should_return_term_id_and_term_taxonomy_id() {
		register_taxonomy( 'wptests_tax', 'post' );
		$found = wp_insert_term( 'foo', 'wptests_tax' );

		$term_by_id = get_term( $found['term_id'], 'wptests_tax' );
		$term_by_slug = get_term_by( 'slug', 'foo', 'wptests_tax' );
		$term_by_ttid = get_term_by( 'term_taxonomy_id', $found['term_taxonomy_id'], 'wptests_tax' );

		_unregister_taxonomy( 'wptests_tax' );

		$this->assertInternalType( 'array', $found );
		$this->assertNotEmpty( $found['term_id'] );
		$this->assertNotEmpty( $found['term_taxonomy_id'] );
		$this->assertNotEmpty( $term_by_id );
		$this->assertEquals( $term_by_id, $term_by_slug );
		$this->assertEquals( $term_by_id, $term_by_ttid );
	}

	public function test_wp_insert_term_should_clean_term_cache() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		/**
		 * It doesn't appear that WordPress itself ever sets these
		 * caches, but we should ensure that they're being cleared for
		 * compatibility with third-party addons. Prime the caches
		 * manually.
		 */
		wp_cache_set( 'all_ids', array( 1, 2, 3 ), 'wptests_tax' );
		wp_cache_set( 'get', array( 1, 2, 3 ), 'wptests_tax' );

		$found = wp_insert_term( 'foo', 'wptests_tax', array(
			'parent' => $t,
		) );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( false, wp_cache_get( 'all_ids', 'wptests_tax' ) );
		$this->assertSame( false, wp_cache_get( 'get', 'wptests_tax' ) );

		$cached_children = get_option( 'wptests_tax_children' );
		$this->assertNotEmpty( $cached_children[ $t ] );
		$this->assertTrue( in_array( $found['term_id'], $cached_children[ $t ] ) );
	}

	/**
	 * @ticket 33864
	 */
	public function test_wp_insert_term_with_and_without_accents() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = self::factory()->term->create( array(
			'name' => 'Foó',
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = self::factory()->term->create( array(
			'name' => 'Foo',
			'taxonomy' => 'wptests_tax',
		) );

		$this->assertInternalType( 'int', $t1 );
		$this->assertInternalType( 'int', $t2 );
		$this->assertNotEquals( $t1, $t2 );

		$term_2 = get_term( $t2, 'wptests_tax' );
		$this->assertSame( $t2, $term_2->term_id );
		$this->assertSame( 'Foo', $term_2->name );

	}

	/**
	 * @ticket 37009
	 */
	public function test_term_whose_slug_matches_existing_term_but_name_does_not_should_get_suffixed_slug() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = self::factory()->term->create( array(
			'name' => 'Foo#bar',
			'taxonomy' => 'wptests_tax',
		) );

		$created = wp_insert_term( 'Foo$bar', 'wptests_tax' );

		$this->assertArrayHasKey( 'term_id', $created );

		$created_term = get_term( $created['term_id'] );
		$this->assertSame( 'Foo$bar', $created_term->name );
		$this->assertSame( 'foobar-2', $created_term->slug );
	}

	/**
	 * @ticket 35321
	 */
	public function test_wp_insert_term_with_null_description() {

		register_taxonomy( 'wptests_tax', 'post' );

		$term = wp_insert_term( 'foo', 'wptests_tax', array(
			'description' => null
		) );

		$term_object = get_term( $term['term_id'] );

		$this->assertInstanceOf( 'WP_Term', $term_object );
		$this->assertSame( '', $term_object->description );
	}

	/** Helpers **********************************************************/

	public function deleted_term_cb( $term, $tt_id, $taxonomy, $deleted_term, $object_ids ) {
		$this->assertInternalType( 'object', $deleted_term );
		$this->assertInternalType( 'int', $term );
		$this->assertInternalType( 'array', $object_ids );
		// Pesky string $this->assertInternalType( 'int', $tt_id );
		$this->assertEquals( $term, $deleted_term->term_id );
		$this->assertEquals( $taxonomy, $deleted_term->taxonomy );
		$this->assertEquals( $tt_id, $deleted_term->term_taxonomy_id );
		$this->assertEmpty( $object_ids );
	}

	public function _pre_insert_term_callback() {
		return new WP_Error( 'custom_error' );
	}
}
