<?php

/**
 * @group taxonomy
 */
class Tests_Term extends WP_UnitTestCase {
	var $taxonomy = 'category';

	function setUp() {
		parent::setUp();

		_clean_term_filters();
		// insert one term into every post taxonomy
		// otherwise term_ids and term_taxonomy_ids might be identical, which could mask bugs
		$term = rand_str();
		foreach(get_object_taxonomies('post') as $tax)
			wp_insert_term( $term, $tax );
	}

	function deleted_term_cb( $term, $tt_id, $taxonomy, $deleted_term ) {
		$this->assertInternalType( 'object', $deleted_term );
		$this->assertInternalType( 'int', $term );
		// Pesky string $this->assertInternalType( 'int', $tt_id );
		$this->assertEquals( $term, $deleted_term->term_id );
		$this->assertEquals( $taxonomy, $deleted_term->taxonomy );
		$this->assertEquals( $tt_id, $deleted_term->term_taxonomy_id );
	}

	function test_wp_insert_delete_term() {
		// a new unused term
		$term = rand_str();
		$this->assertNull( term_exists($term) );

		$initial_count = wp_count_terms( $this->taxonomy );

		$t = wp_insert_term( $term, $this->taxonomy );
		$this->assertInternalType( 'array', $t );
		$this->assertFalse( is_wp_error($t) );
		$this->assertTrue( $t['term_id'] > 0 );
		$this->assertTrue( $t['term_taxonomy_id'] > 0 );
		$this->assertEquals( $initial_count + 1, wp_count_terms($this->taxonomy) );

		// make sure the term exists
		$this->assertTrue( term_exists($term) > 0 );
		$this->assertTrue( term_exists($t['term_id']) > 0 );

		// now delete it
		add_filter( 'delete_term', array( $this, 'deleted_term_cb' ), 10, 4 );
		$this->assertTrue( wp_delete_term($t['term_id'], $this->taxonomy) );
		remove_filter( 'delete_term', array( $this, 'deleted_term_cb' ), 10, 4 );
		$this->assertNull( term_exists($term) );
		$this->assertNull( term_exists($t['term_id']) );
		$this->assertEquals( $initial_count, wp_count_terms($this->taxonomy) );
	}

	public function test_wp_insert_term_taxonomy_does_not_exist() {
		$found = wp_insert_term( 'foo', 'bar' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	public function test_wp_insert_term_pre_insert_term_filter_returns_wp_error() {
		add_filter( 'pre_insert_term', array( $this, '_pre_insert_term_callback' ) );
		$found = wp_insert_term( 'foo', 'post_tag' );
		remove_filter( 'pre_insert_term', array( $this, '_pre_insert_term_callback' ) );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'custom_error', $found->get_error_code() );
	}

	public function test_wp_insert_term_term_0() {
		$found = wp_insert_term( 0, 'post_tag' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'invalid_term_id', $found->get_error_code() );
	}

	public function test_wp_insert_term_term_trims_to_empty_string() {
		$found = wp_insert_term( '  ', 'post_tag' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'empty_term_name', $found->get_error_code() );
	}

	public function test_wp_insert_term_parent_does_not_exist() {
		$found = wp_insert_term( 'foo', 'post_tag', array(
			'parent' => 999999,
		) );

		$this->assertTrue( is_wp_error( $found ) );
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
		$term = $this->factory->tag->create_and_get( array( 'name' => 'Bozo' ) );
		$this->assertFalse( is_wp_error( $term ) );
		$this->assertTrue( empty( $term->errors ) );

		// Test existing term name with unique slug
		$term1 = $this->factory->tag->create( array( 'name' => 'Bozo', 'slug' => 'bozo1' ) );
		$this->assertFalse( is_wp_error( $term1 ) );
		$this->assertTrue( empty($term1->errors ) );

		// Test an existing term name
		$term2 = $this->factory->tag->create( array( 'name' => 'Bozo' ) );
		$this->assertTrue( is_wp_error( $term2 ) );
		$this->assertNotEmpty( $term2->errors );

		// Test named terms ending in special characters
		$term3 = $this->factory->tag->create( array( 'name' => 'T$' ) );
		$term4 = $this->factory->tag->create( array( 'name' => 'T$$' ) );
		$term5 = $this->factory->tag->create( array( 'name' => 'T$$$' ) );
		$term6 = $this->factory->tag->create( array( 'name' => 'T$$$$' ) );
		$term7 = $this->factory->tag->create( array( 'name' => 'T$$$$' ) );
		$this->assertTrue( is_wp_error( $term7 ) );
		$this->assertNotEmpty( $term7->errors );
		$this->assertEquals( $term6, $term7->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term3, $term4, $term5, $term6 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		// Test named terms with only special characters
		$term8 = $this->factory->tag->create( array( 'name' => '$' ) );
		$term9 = $this->factory->tag->create( array( 'name' => '$$' ) );
		$term10 = $this->factory->tag->create( array( 'name' => '$$$' ) );
		$term11 = $this->factory->tag->create( array( 'name' => '$$$$' ) );
		$term12 = $this->factory->tag->create( array( 'name' => '$$$$' ) );
		$this->assertTrue( is_wp_error( $term12 ) );
		$this->assertNotEmpty( $term12->errors );
		$this->assertEquals( $term11, $term12->error_data['term_exists'] );

		$terms = array_map( 'get_tag', array( $term8, $term9, $term10, $term11 ) );
		$this->assertCount( 4, array_unique( wp_list_pluck( $terms, 'slug' ) ) );

		$term13 = $this->factory->tag->create( array( 'name' => 'A' ) );
		$this->assertFalse( is_wp_error( $term13 ) );
		$term14 = $this->factory->tag->create( array( 'name' => 'A' ) );
		$this->assertTrue( is_wp_error( $term14 ) );
		$term15 = $this->factory->tag->create( array( 'name' => 'A+', 'slug' => 'a' ) );
		$this->assertFalse( is_wp_error( $term15 ) );
		$term16 = $this->factory->tag->create( array( 'name' => 'A+' ) );
		$this->assertTrue( is_wp_error( $term16 ) );
		$term17 = $this->factory->tag->create( array( 'name' => 'A++' ) );
		$this->assertFalse( is_wp_error( $term17 ) );
		$term18 = $this->factory->tag->create( array( 'name' => 'A-', 'slug' => 'a' ) );
		$this->assertFalse( is_wp_error( $term18 ) );
		$term19 = $this->factory->tag->create( array( 'name' => 'A-' ) );
		$this->assertTrue( is_wp_error( $term19 ) );
		$term20 = $this->factory->tag->create( array( 'name' => 'A--' ) );
		$this->assertFalse( is_wp_error( $term20 ) );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_duplicate_slug_same_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
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
		$t = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$created = wp_insert_term( 'Foo 2', 'wptests_tax_2', array(
			'slug' => 'foo',
		) );

		$this->assertFalse( is_wp_error( $created ) );

		$new_term = get_term( $created['term_id'], 'wptests_tax_2' );

		$this->assertSame( 'foo', $new_term->slug );

		_unregister_taxonomy( 'wptests_tax', 'post' );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_insert_term_duplicate_slug_different_taxonomy_before_410_schema_change() {

		$db_version = get_option( 'db_version' );
		update_option( 'db_version', 30055 );

		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );
		$t = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$created = wp_insert_term( 'Foo 2', 'wptests_tax_2', array(
			'slug' => 'foo',
		) );

		$this->assertFalse( is_wp_error( $created ) );

		$new_term = get_term( $created['term_id'], 'wptests_tax_2' );

		/*
		 * As of 4.1, we no longer create a shared term, but we also do not
		 * allow for duplicate slugs.
		 */
		$this->assertSame( 'foo-2', $new_term->slug );
		$this->assertNotEquals( $new_term->term_id, $term->term_id );

		_unregister_taxonomy( 'wptests_tax', 'post' );
		update_option( 'db_version', $db_version );
	}

	public function test_wp_insert_term_alias_of_no_term_group() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = $this->factory->term->create( array(
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
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$term_1 = get_term( $t1, 'wptests_tax' );

		$t2 = $this->factory->term->create( array(
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

	public function test_wp_insert_term_duplicate_name_slug_non_hierarchical() {
		register_taxonomy( 'foo', 'post', array() );

		$existing_term = $this->factory->term->create( array(
			'slug' => 'new-term',
			'name' => 'New Term',
			'taxonomy' => 'foo',
		) );

		$found = wp_insert_term( 'New Term', 'foo', array(
			'slug' => 'new-term',
		) );

		_unregister_taxonomy( 'foo' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertEquals( $existing_term, $found->get_error_data() );
	}

	public function test_wp_insert_term_duplicate_name_hierarchical() {
		register_taxonomy( 'foo', 'post', array(
			'hierarchical' => true,
		) );

		$parent_term = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );

		$existing_term = $this->factory->term->create( array(
			'name' => 'New Term',
			'taxonomy' => 'foo',
			'parent' => $parent_term,
		) );

		$found = wp_insert_term( 'New Term', 'foo', array(
			'parent' => $parent_term,
		) );

		_unregister_taxonomy( 'foo' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertEquals( $existing_term, $found->get_error_data() );
	}

	public function test_wp_insert_term_duplicate_name_slug_hierarchical() {
		register_taxonomy( 'foo', 'post', array(
			'hierarchical' => true,
		) );

		$parent_term = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );

		$existing_term = $this->factory->term->create( array(
			'name' => 'New Term',
			'slug' => 'new-term-slug',
			'taxonomy' => 'foo',
			'parent' => $parent_term,
		) );

		$found = wp_insert_term( 'New Term', 'foo', array(
			'parent' => $parent_term,
			'slug' => 'new-term-slug',
		) );

		_unregister_taxonomy( 'foo' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertEquals( $existing_term, $found->get_error_data() );
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

		$t = $this->factory->term->create( array(
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

	public function test_wp_update_term_taxonomy_does_not_exist() {
		$found = wp_update_term( 1, 'bar' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'invalid_taxonomy', $found->get_error_code() );
	}

	public function test_wp_update_term_term_empty_string_should_return_wp_error() {
		$found = wp_update_term( '', 'post_tag' );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'invalid_term', $found->get_error_code() );
	}

	public function test_wp_update_term_unslash_name() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'name' => 'Let\\\'s all say \\"Hooray\\" for WordPress taxonomy',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'Let\'s all say "Hooray" for WordPress taxonomy', $term->name );
	}

	public function test_wp_update_term_unslash_description() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'description' => 'Let\\\'s all say \\"Hooray\\" for WordPress taxonomy',
		) );

		$term = get_term( $found['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 'Let\'s all say "Hooray" for WordPress taxonomy', $term->description );
	}

	public function test_wp_update_term_name_empty_string() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'name' => '',
		) );

		$this->assertTrue( is_wp_error( $found ) );
		$this->assertSame( 'empty_term_name', $found->get_error_code() );
		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 29614
	 */
	function test_wp_update_term_parent_does_not_exist() {
		register_taxonomy( 'wptests_tax', array(
			'hierarchical' => true,
		) );
		$fake_term_id = 787878;

		$this->assertNull( term_exists( $fake_term_id, 'wptests_tax' ) );

		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'parent' => $fake_term_id,
		) );

		$this->assertWPError( $found );
		$this->assertSame( 'missing_parent', $found->get_error_code() );

		$term = get_term( $t, 'wptests_tax' );
		$this->assertEquals( 0, $term->parent );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_slug_empty_string_while_not_updating_name() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'Foo Bar',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'slug' => '',
		) );

		$term = get_term( $t, 'wptests_tax' );
		$this->assertSame( 'foo-bar', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_slug_empty_string_while_updating_name() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'name' => 'Foo Bar',
			'slug' => '',
		) );

		$term = get_term( $t, 'wptests_tax' );
		$this->assertSame( 'foo-bar', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_slug_set_slug() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'slug' => 'foo-bar',
		) );

		$term = get_term( $t, 'wptests_tax' );
		$this->assertSame( 'foo-bar', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_update_term_should_not_create_duplicate_slugs_within_the_same_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = $this->factory->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax',
		) );

		$updated = wp_update_term( $t2, 'wptests_tax', array(
			'slug' => 'foo',
		) );

		$this->assertWPError( $updated );
		$this->assertSame( 'duplicate_term_slug', $updated->get_error_code() );
	}

	/**
	 * @ticket 5809
	 */
	public function test_wp_update_term_should_allow_duplicate_slugs_in_different_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );

		$t1 = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax_2',
		) );

		$updated = wp_update_term( $t2, 'wptests_tax_2', array(
			'slug' => 'foo',
		) );

		$this->assertFalse( is_wp_error( $updated ) );

		$t1_term = get_term( $t1, 'wptests_tax' );
		$t2_term = get_term( $t2, 'wptests_tax_2' );
		$this->assertSame( $t1_term->slug, $t2_term->slug );
	}

	/**
	 * @ticket 30780
	 */
	public function test_wp_update_term_should_allow_duplicate_names_in_different_taxonomies() {
		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );

		$t1 = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = $this->factory->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax_2',
		) );

		$updated = wp_update_term( $t2, 'wptests_tax_2', array(
			'name' => 'Foo',
		) );

		$this->assertFalse( is_wp_error( $updated ) );

		$t2_term = get_term( $t2, 'wptests_tax_2' );
		$this->assertSame( 'Foo', $t2_term->name );
	}

	/**
	 * @ticket 30780
	 */
	public function test_wp_update_term_should_allow_duplicate_names_at_different_levels_of_the_same_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$t1 = $this->factory->term->create( array(
			'name' => 'Foo',
			'slug' => 'foo',
			'taxonomy' => 'wptests_tax',
		) );

		$t2 = $this->factory->term->create( array(
			'name' => 'Bar',
			'slug' => 'bar',
			'taxonomy' => 'wptests_tax',
			'parent' => $t1,
		) );

		$t3 = $this->factory->term->create( array(
			'name' => 'Bar Child',
			'slug' => 'bar-child',
			'taxonomy' => 'wptests_tax',
			'parent' => $t2,
		) );

		$updated = wp_update_term( $t3, 'wptests_tax', array(
			'name' => 'Bar',
		) );

		$this->assertFalse( is_wp_error( $updated ) );

		$t3_term = get_term( $t3, 'wptests_tax' );
		$this->assertSame( 'Bar', $t3_term->name );
	}

	public function test_wp_update_term_alias_of_no_term_group() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$term_1 = get_term( $t1, 'wptests_tax' );

		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax' );
		wp_update_term( $created_term_ids['term_id'], 'wptests_tax', array(
			'alias_of' => $term_1->slug,
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );

		$updated_term_1 = get_term( $t1, 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 0, $term_1->term_group );
		$this->assertNotEmpty( $created_term->term_group );
		$this->assertSame( $created_term->term_group, $updated_term_1->term_group );
	}

	public function test_wp_update_term_alias_of_existing_term_group() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$term_1 = get_term( $t1, 'wptests_tax' );

		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'alias_of' => $term_1->slug,
		) );
		$term_2 = get_term( $t2, 'wptests_tax' );

		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax' );
		wp_update_term( $created_term_ids['term_id'], 'wptests_tax', array(
			'alias_of' => $term_2->slug,
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertNotEmpty( $created_term->term_group );
		$this->assertSame( $created_term->term_group, $term_2->term_group );
	}

	public function test_wp_update_term_alias_of_nonexistent_term() {
		register_taxonomy( 'wptests_tax', 'post' );
		$created_term_ids = wp_insert_term( 'Foo', 'wptests_tax' );
		wp_update_term( $created_term_ids['term_id'], 'wptests_tax', array(
			'alias_of' => 'bar',
		) );
		$created_term = get_term( $created_term_ids['term_id'], 'wptests_tax' );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( 0, $created_term->term_group );
	}

	public function test_wp_update_term_slug_same_as_old_slug() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo',
		) );

		$found = wp_update_term( $t, 'wptests_tax', array(
			'slug' => 'foo',
		) );

		$term = get_term( $t, 'wptests_tax' );

		$this->assertSame( $t, $found['term_id'] );
		$this->assertSame( 'foo', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_duplicate_slug_generated_due_to_empty_slug_param() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo-bar',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => 'not foo bar',
		) );

		$found = wp_update_term( $t2, 'wptests_tax', array(
			'slug' => '',
			'name' => 'Foo? Bar!', // Will sanitize to 'foo-bar'.
		) );

		$term = get_term( $t2, 'wptests_tax' );

		$this->assertSame( $t2, $found['term_id'] );
		$this->assertSame( 'foo-bar-2', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_duplicate_slug_with_changed_parent() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );
		$p = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo-bar',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$found = wp_update_term( $t2, 'wptests_tax', array(
			'parent' => $p,
			'slug' => 'foo-bar',
		) );

		$term = get_term( $t2, 'wptests_tax' );
		$parent_term = get_term( $p, 'wptests_tax' );

		$this->assertSame( $t2, $found['term_id'] );
		$this->assertSame( 'foo-bar-' . $parent_term->slug, $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_duplicate_slug_failure() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo-bar',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'my-old-slug',
		) );

		$found = wp_update_term( $t2, 'wptests_tax', array(
			'slug' => 'foo-bar',
		) );

		$term = get_term( $t2, 'wptests_tax' );

		$this->assertWPError( $found );
		$this->assertSame( 'duplicate_term_slug', $found->get_error_code() );
		$this->assertSame( 'my-old-slug', $term->slug );
		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_update_term_should_return_term_id_and_term_taxonomy_id() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$found = wp_update_term( $t, 'wptests_tax', array(
			'slug' => 'foo',
		) );

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

	public function test_wp_update_term_should_clean_object_term_cache() {
		register_taxonomy( 'wptests_tax_for_post', 'post' );
		register_taxonomy( 'wptests_tax_for_page', 'page' );
		$post = $this->factory->post->create();
		$page = $this->factory->post->create( array(
			'post_type' => 'page',
		) );

		$t_for_post = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_for_post',
		) );
		$t_for_page = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_for_page',
		) );

		wp_set_post_terms( $post, array( $t_for_post ), 'wptests_tax_for_post' );
		wp_set_post_terms( $page, array( $t_for_page ), 'wptests_tax_for_page' );

		// Prime caches and verify.
		update_object_term_cache( array( $post ), 'post' );
		update_object_term_cache( array( $page ), 'page' );
		$this->assertNotEmpty( wp_cache_get( $post, 'wptests_tax_for_post_relationships' ) );
		$this->assertNotEmpty( wp_cache_get( $page, 'wptests_tax_for_page_relationships' ) );

		// Update a term in just one of the taxonomies.
		$found = wp_update_term( $t_for_post, 'wptests_tax_for_post', array(
			'slug' => 'foo',
		) );

		// Only the relevant cache should have been cleared.
		$this->assertFalse( wp_cache_get( $post, 'wptests_tax_for_post_relationships' ) );
		$this->assertNotEmpty( wp_cache_get( $page, 'wptests_tax_for_page_relationships' ) );
	}

	public function test_wp_update_term_should_clean_term_cache() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		/*
		 * It doesn't appear that WordPress itself ever sets these
		 * caches, but we should ensure that they're being cleared for
		 * compatibility with third-party addons. Prime the caches
		 * manually.
		 */
		wp_cache_set( 'all_ids', array( 1, 2, 3 ), 'wptests_tax' );
		wp_cache_set( 'get', array( 1, 2, 3 ), 'wptests_tax' );

		$found = wp_update_term( $t1, 'wptests_tax', array(
			'parent' => $t2,
		) );
		_unregister_taxonomy( 'wptests_tax' );

		$this->assertSame( false, wp_cache_get( 'all_ids', 'wptests_tax' ) );
		$this->assertSame( false, wp_cache_get( 'get', 'wptests_tax' ) );

		$cached_children = get_option( 'wptests_tax_children' );
		$this->assertNotEmpty( $cached_children[ $t2 ] );
		$this->assertTrue( in_array( $found['term_id'], $cached_children[ $t2 ] ) );
	}

	/**
	 * @ticket 29911
	 */
	public function test_wp_delete_term_should_invalidate_cache_for_child_terms() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );

		$parent = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$child = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'parent' => $parent,
			'slug' => 'foo',
		) );

		// Prime the cache.
		$child_term = get_term( $child, 'wptests_tax' );
		$this->assertSame( $parent, $child_term->parent );

		wp_delete_term( $parent, 'wptests_tax' );
		$child_term = get_term( $child, 'wptests_tax' );
		$this->assertSame( 0, $child_term->parent );
	}

	/**
	 * @ticket 5381
	 */
	function test_is_term_type() {
		// insert a term
		$term = rand_str();
		$t = wp_insert_term( $term, $this->taxonomy );
		$this->assertInternalType( 'array', $t );
		$term_obj = get_term_by('name', $term, $this->taxonomy);
		$this->assertEquals( $t['term_id'], term_exists($term_obj->slug) );

		// clean up
		$this->assertTrue( wp_delete_term($t['term_id'], $this->taxonomy) );
	}

	/**
	 * @ticket 21651
	 */
	function test_get_term_by_tt_id() {
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = get_term_by( 'term_taxonomy_id', $term1['term_taxonomy_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	/**
	 * @ticket 15919
	 */
	function test_wp_count_terms() {
		$count = wp_count_terms( 'category', array( 'hide_empty' => true ) );
		// the terms inserted in setUp aren't attached to any posts, so should return 0
		// this previously returned 2
		$this->assertEquals( 0, $count );
	}

	/**
	 * @ticket 26570
	 */
	function test_set_object_terms() {
		$non_hier = rand_str( 10 );
		$hier     = rand_str( 10 );

		// Register taxonomies
		register_taxonomy( $non_hier, array() );
		register_taxonomy( $hier, array( 'hierarchical' => true ) );

		// Create a post.
		$post_id = $this->factory->post->create();

		/*
		 * Set a single term (non-hierarchical) by ID.
		 */
		$tag = wp_insert_term( 'Foo', $non_hier );
		$this->assertFalse( has_term( $tag['term_id'], $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, $tag['term_id'], $non_hier );
		$this->assertTrue( has_term( $tag['term_id'], $non_hier, $post_id ) );

		/*
		 * Set a single term (non-hierarchical) by slug.
		 */
		$tag = wp_insert_term( 'Bar', $non_hier );
		$tag = get_term( $tag['term_id'], $non_hier );

		$this->assertFalse( has_term( $tag->slug, $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, $tag->slug, $non_hier );
		$this->assertTrue( has_term( $tag->slug, $non_hier, $post_id ) );

		/*
		 * Set a single term (hierarchical) by ID.
		 */
		$cat = wp_insert_term( 'Baz', $hier );
		$this->assertFalse( has_term( $cat['term_id'], $hier, $post_id ) );

		wp_set_object_terms( $post_id, $cat['term_id'], $hier );
		$this->assertTrue( has_term( $cat['term_id'], $hier, $post_id ) );

		/*
		 * Set a single term (hierarchical) by slug.
		 */
		$cat = wp_insert_term( 'Qux', $hier );
		$cat = get_term( $cat['term_id'], $hier );

		$this->assertFalse( has_term( $cat->slug, $hier, $post_id ) );

		wp_set_object_terms( $post_id, $cat->slug, $hier );
		$this->assertTrue( has_term( $cat->slug, $hier, $post_id ) );

		/*
		 * Set an array of term IDs (non-hierarchical) by ID.
		 */
		$tag1 = wp_insert_term( '_tag1', $non_hier );
		$this->assertFalse( has_term( $tag1['term_id'], $non_hier, $post_id ) );

		$tag2 = wp_insert_term( '_tag2', $non_hier );
		$this->assertFalse( has_term( $tag2['term_id'], $non_hier, $post_id ) );

		$tag3 = wp_insert_term( '_tag3', $non_hier );
		$this->assertFalse( has_term( $tag3['term_id'], $non_hier, $post_id ) );

		wp_set_object_terms( $post_id, array( $tag1['term_id'], $tag2['term_id'], $tag3['term_id'] ), $non_hier );
		$this->assertTrue( has_term( array( $tag1['term_id'], $tag2['term_id'], $tag3['term_id'] ), $non_hier, $post_id ) );

		/*
		 * Set an array of term slugs (hierarchical) by slug.
		 */
		$cat1 = wp_insert_term( '_cat1', $hier );
		$cat1 = get_term( $cat1['term_id'], $hier );
		$this->assertFalse( has_term( $cat1->slug, $hier, $post_id ) );

		$cat2 = wp_insert_term( '_cat2', $hier );
		$cat2 = get_term( $cat2['term_id'], $hier );
		$this->assertFalse( has_term( $cat2->slug, $hier, $post_id ) );

		$cat3 = wp_insert_term( '_cat3', $hier );
		$cat3 = get_term( $cat3['term_id'], $hier );
		$this->assertFalse( has_term( $cat3->slug, $hier, $post_id ) );

		wp_set_object_terms( $post_id, array( $cat1->slug, $cat2->slug, $cat3->slug ), $hier );
		$this->assertTrue( has_term( array( $cat1->slug, $cat2->slug, $cat3->slug ), $hier, $post_id ) );
	}

	function test_set_object_terms_by_id() {
		$ids = $this->factory->post->create_many(5);

		$terms = array();
		for ($i=0; $i<3; $i++ ) {
			$term = rand_str();
			$result = wp_insert_term( $term, $this->taxonomy );
			$this->assertInternalType( 'array', $result );
			$term_id[$term] = $result['term_id'];
		}

		foreach ($ids as $id) {
				$tt = wp_set_object_terms( $id, array_values($term_id), $this->taxonomy );
				// should return three term taxonomy ids
				$this->assertEquals( 3, count($tt) );
		}

		// each term should be associated with every post
		foreach ($term_id as $term=>$id) {
			$actual = get_objects_in_term($id, $this->taxonomy);
			$this->assertEquals( $ids, array_map('intval', $actual) );
		}

		// each term should have a count of 5
		foreach (array_keys($term_id) as $term) {
			$t = get_term_by('name', $term, $this->taxonomy);
			$this->assertEquals( 5, $t->count );
		}
	}

	function test_set_object_terms_by_name() {
		$ids = $this->factory->post->create_many(5);

		$terms = array(
				rand_str(),
				rand_str(),
				rand_str());

		foreach ($ids as $id) {
				$tt = wp_set_object_terms( $id, $terms, $this->taxonomy );
				// should return three term taxonomy ids
				$this->assertEquals( 3, count($tt) );
				// remember which term has which term_id
				for ($i=0; $i<3; $i++) {
					$term = get_term_by('name', $terms[$i], $this->taxonomy);
					$term_id[$terms[$i]] = intval($term->term_id);
				}
		}

		// each term should be associated with every post
		foreach ($term_id as $term=>$id) {
			$actual = get_objects_in_term($id, $this->taxonomy);
			$this->assertEquals( $ids, array_map('intval', $actual) );
		}

		// each term should have a count of 5
		foreach ($terms as $term) {
			$t = get_term_by('name', $term, $this->taxonomy);
			$this->assertEquals( 5, $t->count );
		}
	}

	function test_set_object_terms_invalid() {
		$post_id = $this->factory->post->create();

		// bogus taxonomy
		$result = wp_set_object_terms( $post_id, array(rand_str()), rand_str() );
		$this->assertTrue( is_wp_error($result) );
	}

	public function test_wp_set_object_terms_append_true() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax', true );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t1, $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_set_object_terms_append_false() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax', false );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	public function test_wp_set_object_terms_append_default_to_false() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$added1 = wp_set_object_terms( $p, array( $t1 ), 'wptests_tax' );
		$this->assertNotEmpty( $added1 );
		$this->assertEqualSets( array( $t1 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		$added2 = wp_set_object_terms( $p, array( $t2 ), 'wptests_tax' );
		$this->assertNotEmpty( $added2 );
		$this->assertEqualSets( array( $t2 ), wp_get_object_terms( $p, 'wptests_tax', array( 'fields' => 'ids' ) ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	function test_change_object_terms_by_id() {
		// set some terms on an object; then change them while leaving one intact

		$post_id = $this->factory->post->create();

		// first set: 3 terms
		$terms_1 = array();
		for ($i=0; $i<3; $i++ ) {
			$term = rand_str();
			$result = wp_insert_term( $term, $this->taxonomy );
			$this->assertInternalType( 'array', $result );
			$terms_1[$i] = $result['term_id'];
		}

		// second set: one of the original terms, plus one new term
		$terms_2 = array();
		$terms_2[0] = $terms_1[1];

		$term = rand_str();
		$result = wp_insert_term( $term, $this->taxonomy );
		$terms_2[1] = $result['term_id'];


		// set the initial terms
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'ids', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_1, $terms );

		// change the terms
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'ids', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_2, $terms );

		// make sure the tt id for 'bar' matches
		$this->assertEquals( $tt_1[1], $tt_2[0] );

	}

	function test_change_object_terms_by_name() {
		// set some terms on an object; then change them while leaving one intact

		$post_id = $this->factory->post->create();

		$terms_1 = array('foo', 'bar', 'baz');
		$terms_2 = array('bar', 'bing');

		// set the initial terms
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_1, $terms );

		// change the terms
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );

		// make sure they're correct
		$terms = wp_get_object_terms($post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id'));
		$this->assertEquals( $terms_2, $terms );

		// make sure the tt id for 'bar' matches
		$this->assertEquals( $tt_1[1], $tt_2[0] );

	}

	/**
	 * @ticket 15475
	 */
	function test_wp_add_remove_object_terms() {
		$posts = $this->factory->post->create_many( 5 );
		$tags = $this->factory->tag->create_many( 5 );

		$tt = wp_add_object_terms( $posts[0], $tags[1], 'post_tag' );
		$this->assertEquals( 1, count( $tt ) );
		$this->assertEquals( array( $tags[1] ), wp_get_object_terms( $posts[0], 'post_tag', array( 'fields' => 'ids' ) ) );

		$three_tags = array( $tags[0], $tags[1], $tags[2] );
		$tt = wp_add_object_terms( $posts[1], $three_tags, 'post_tag' );
		$this->assertEquals( 3, count( $tt ) );
		$this->assertEquals( $three_tags, wp_get_object_terms( $posts[1], 'post_tag', array( 'fields' => 'ids' ) ) );

		$this->assertTrue( wp_remove_object_terms( $posts[0], $tags[1], 'post_tag' ) );
		$this->assertFalse( wp_remove_object_terms( $posts[0], $tags[0], 'post_tag' ) );
		$this->assertInstanceOf( 'WP_Error', wp_remove_object_terms( $posts[0], $tags[1], 'non_existing_taxonomy' ) );
		$this->assertTrue( wp_remove_object_terms( $posts[1], $three_tags, 'post_tag' ) );
		$this->assertEquals( 0, count( wp_get_object_terms( $posts[1], 'post_tag' ) ) );

		foreach ( $tags as $term_id )
			$this->assertTrue( wp_delete_term( $term_id, 'post_tag' ) );

		foreach ( $posts as $post_id )
			$this->assertTrue( (bool) wp_delete_post( $post_id, true ) );
	}

	/**
	 * @group category.php
	 */
	function test_term_is_ancestor_of( ) {
		$term = rand_str();
		$term2 = rand_str();

		$t = wp_insert_term( $term, 'category' );
		$this->assertInternalType( 'array', $t );
		$t2 = wp_insert_term( $term, 'category', array( 'parent' => $t['term_id'] ) );
		$this->assertInternalType( 'array', $t2 );
		if ( function_exists( 'term_is_ancestor_of' ) ) {
			$this->assertTrue( term_is_ancestor_of( $t['term_id'], $t2['term_id'], 'category' ) );
			$this->assertFalse( term_is_ancestor_of( $t2['term_id'], $t['term_id'], 'category' ) );
		}
		$this->assertTrue( cat_is_ancestor_of( $t['term_id'], $t2['term_id']) );
		$this->assertFalse( cat_is_ancestor_of( $t2['term_id'], $t['term_id']) );

		wp_delete_term($t['term_id'], 'category');
		wp_delete_term($t2['term_id'], 'category');
	}

	function test_wp_insert_delete_category() {
		$term = rand_str();
		$this->assertNull( category_exists( $term ) );

		$initial_count = wp_count_terms( 'category' );

		$t = wp_insert_category( array( 'cat_name' => $term ) );
		$this->assertTrue( is_numeric($t) );
		$this->assertFalse( is_wp_error($t) );
		$this->assertTrue( $t > 0 );
		$this->assertEquals( $initial_count + 1, wp_count_terms( 'category' ) );

		// make sure the term exists
		$this->assertTrue( term_exists($term) > 0 );
		$this->assertTrue( term_exists($t) > 0 );

		// now delete it
		$this->assertTrue( wp_delete_category($t) );
		$this->assertNull( term_exists($term) );
		$this->assertNull( term_exists($t) );
		$this->assertEquals( $initial_count, wp_count_terms('category') );
	}

	/**
	 * @ticket 16550
	 */
	function test_wp_set_post_categories() {
		$post_id = $this->factory->post->create();
		$post = get_post( $post_id );

		$this->assertInternalType( 'array', $post->post_category );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = wp_insert_term( 'Bar', 'category' );
		$term3 = wp_insert_term( 'Baz', 'category' );
		wp_set_post_categories( $post_id, array( $term1['term_id'], $term2['term_id'] ) );
		$this->assertEquals( 2, count( $post->post_category ) );
		$this->assertEquals( array( $term2['term_id'], $term1['term_id'] ) , $post->post_category );

		wp_set_post_categories( $post_id, $term3['term_id'], true );
		$this->assertEquals( array( $term2['term_id'], $term3['term_id'], $term1['term_id'] ) , $post->post_category );

		$term4 = wp_insert_term( 'Burrito', 'category' );
		wp_set_post_categories( $post_id, $term4['term_id'] );
		$this->assertEquals( array( $term4['term_id'] ), $post->post_category );

		wp_set_post_categories( $post_id, array( $term1['term_id'], $term2['term_id'] ), true );
		$this->assertEquals( array( $term2['term_id'], $term4['term_id'], $term1['term_id'] ), $post->post_category );

		wp_set_post_categories( $post_id, array(), true );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );

		wp_set_post_categories( $post_id, array() );
		$this->assertEquals( 1, count( $post->post_category ) );
		$this->assertEquals( get_option( 'default_category' ), $post->post_category[0] );
	}

	function test_wp_unique_term_slug() {
		// set up test data
		$a = wp_insert_term( 'parent', $this->taxonomy );
		$this->assertInternalType( 'array', $a );
		$b = wp_insert_term( 'child',  $this->taxonomy, array( 'parent' => $a['term_id'] ) );
		$this->assertInternalType( 'array', $b );
		$c = wp_insert_term( 'neighbor', $this->taxonomy );
		$this->assertInternalType( 'array', $c );
		$d = wp_insert_term( 'pet',  $this->taxonomy, array( 'parent' => $c['term_id'] )  );
		$this->assertInternalType( 'array', $c );

		$a_term = get_term( $a['term_id'], $this->taxonomy );
		$b_term = get_term( $b['term_id'], $this->taxonomy );
		$c_term = get_term( $c['term_id'], $this->taxonomy );
		$d_term = get_term( $d['term_id'], $this->taxonomy );

		// a unique slug gets unchanged
		$this->assertEquals( 'unique-term', wp_unique_term_slug( 'unique-term', $c_term ) );

		// a non-hierarchicial dupe gets suffixed with "-#"
		$this->assertEquals( 'parent-2', wp_unique_term_slug( 'parent', $c_term ) );

		// a hierarchical dupe initially gets suffixed with its parent term
		$this->assertEquals( 'child-neighbor', wp_unique_term_slug( 'child', $d_term ) );

		// a hierarchical dupe whose parent already contains the {term}-{parent term}
		// term gets suffixed with parent term name and then '-#'
		$e = wp_insert_term( 'child-neighbor', $this->taxonomy, array( 'parent' => $c['term_id'] ) );
		$this->assertEquals( 'child-neighbor-2', wp_unique_term_slug( 'child', $d_term ) );

		$f = wp_insert_term( 'foo', $this->taxonomy );
		$this->assertInternalType( 'array', $f );
		$f_term = get_term( $f['term_id'], $this->taxonomy );
		$this->assertEquals( 'foo', $f_term->slug );
		$this->assertEquals( 'foo', wp_unique_term_slug(  'foo', $f_term ) );

		$g = wp_insert_term( 'foo',  $this->taxonomy );
		$this->assertInstanceOf( 'WP_Error', $g );

		// clean up
		foreach ( array( $a, $b, $c, $d, $e, $f ) as $t )
			$this->assertTrue( wp_delete_term( $t['term_id'], $this->taxonomy ) );
	}

	/**
	 * @ticket 25852
	 */
	function test_sanitize_term_field() {
		$term = wp_insert_term( 'foo', $this->taxonomy );

		$this->assertEquals( 0, sanitize_term_field( 'parent',  0, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 1, sanitize_term_field( 'parent',  1, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 0, sanitize_term_field( 'parent', -1, $term['term_id'], $this->taxonomy, 'raw' ) );
		$this->assertEquals( 0, sanitize_term_field( 'parent', '', $term['term_id'], $this->taxonomy, 'raw' ) );
	}

	private function assertPostHasTerms( $post_id, $expected_term_ids, $taxonomy ) {
		$assigned_term_ids = wp_get_object_terms( $post_id, $taxonomy, array(
			'fields' => 'ids'
		) );

		$this->assertEquals( $expected_term_ids, $assigned_term_ids );
	}

	/**
	 * @ticket 22560
	 */
	function test_object_term_cache() {
		$post_id = $this->factory->post->create();

		$terms_1 = array('foo', 'bar', 'baz');
		$terms_2 = array('bar', 'bing');

		// Cache should be empty after a set.
		$tt_1 = wp_set_object_terms( $post_id, $terms_1, $this->taxonomy );
		$this->assertEquals( 3, count($tt_1) );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );

		// wp_get_object_terms() does not prime the cache.
		wp_get_object_terms( $post_id, $this->taxonomy, array('fields' => 'names', 'orderby' => 't.term_id') );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );

		// get_the_terms() does prime the cache.
		$terms = get_the_terms( $post_id, $this->taxonomy );
		$cache = wp_cache_get( $post_id, $this->taxonomy . '_relationships');
		$this->assertInternalType( 'array', $cache );

		// Cache should be empty after a set.
		$tt_2 = wp_set_object_terms( $post_id, $terms_2, $this->taxonomy );
		$this->assertEquals( 2, count($tt_2) );
		$this->assertFalse( wp_cache_get( $post_id, $this->taxonomy . '_relationships') );
	}

	/**
	 * @ticket 24189
	 */
	function test_object_term_cache_when_term_changes() {
		$post_id = $this->factory->post->create();
		$tag_id = $this->factory->tag->create( array( 'description' => 'My Amazing Tag' ) );

		$tt_1 = wp_set_object_terms( $post_id, $tag_id, 'post_tag' );

		$terms = get_the_terms( $post_id, 'post_tag' );
		$this->assertEquals( $tag_id, $terms[0]->term_id );
		$this->assertEquals( 'My Amazing Tag', $terms[0]->description );

		$_updated = wp_update_term( $tag_id, 'post_tag', array(
			'description' => 'This description is even more amazing!'
		) );

		$_new_term = get_term( $tag_id, 'post_tag' );
		$this->assertEquals( $tag_id, $_new_term->term_id );
		$this->assertEquals( 'This description is even more amazing!', $_new_term->description );

		$terms = get_the_terms( $post_id, 'post_tag' );
		$this->assertEquals( $tag_id, $terms[0]->term_id );
		$this->assertEquals( 'This description is even more amazing!', $terms[0]->description );
	}

	/**
	 * @ticket 31086
	 */
	public function test_get_the_terms_should_return_zero_indexed_array_when_cache_is_empty() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		wp_set_object_terms( $p, array( 'foo', 'bar' ), 'wptests_tax' );

		$found = get_the_terms( $p, 'wptests_tax' );

		$this->assertEqualSets( array( 0, 1 ), array_keys( $found ) );
	}

	/**
	 * @ticket 31086
	 */
	public function test_get_the_terms_should_return_zero_indexed_array_when_cache_is_primed() {
		register_taxonomy( 'wptests_tax', 'post' );
		$p = $this->factory->post->create();
		wp_set_object_terms( $p, array( 'foo', 'bar' ), 'wptests_tax' );

		// Prime cache.
		update_object_term_cache( array( $p ), array( 'post' ) );

		$found = get_the_terms( $p, 'wptests_tax' );

		$this->assertEqualSets( array( 0, 1 ), array_keys( $found ) );
	}

	/**
	 * @ticket 19205
	 */
	function test_orphan_category() {
		$cat_id1 = $this->factory->category->create();

		wp_delete_category( $cat_id1 );

		$cat_id2 = $this->factory->category->create( array( 'parent' => $cat_id1 ) );
		$this->assertWPError( $cat_id2 );
	}

	/**
	 * @ticket 30780
	 */
	public function test_wp_update_term_should_assign_new_slug_when_reassigning_parent_as_long_as_there_is_no_other_term_with_the_same_slug() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );
		register_taxonomy( 'wptests_tax_2', 'post', array(
			'hierarchical' => true,
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'parent-term',
		) );

		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo',
		) );

		wp_update_term( $t2, 'wptests_tax', array(
			'parent' => $t1,
		) );

		$t2_term = get_term( $t2, 'wptests_tax' );

		$this->assertSame( 'foo', $t2_term->slug );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 30780
	 */
	public function test_wp_update_term_should_not_assign_new_slug_when_reassigning_parent_as_long_as_there_is_no_other_slug_conflict_within_the_taxonomy() {
		register_taxonomy( 'wptests_tax', 'post', array(
			'hierarchical' => true,
		) );
		register_taxonomy( 'wptests_tax_2', 'post', array(
			'hierarchical' => true,
		) );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'parent-term',
		) );

		// Same slug but in a different tax.
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax_2',
			'slug' => 'foo',
		) );

		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo',
		) );

		wp_update_term( $t3, 'wptests_tax', array(
			'parent' => $t1,
		) );

		$t3_term = get_term( $t3, 'wptests_tax' );

		$this->assertSame( 'foo', $t3_term->slug );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/** Helpers **********************************************************/

	public function _pre_insert_term_callback() {
		return new WP_Error( 'custom_error' );
	}
}
