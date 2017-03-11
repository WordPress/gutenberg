<?php

/**
 * @group taxonomy
 */
class Tests_Term_GetTermBy extends WP_UnitTestCase {

	function test_get_term_by_slug() {
		$term1 = wp_insert_term( 'Foo', 'category', array( 'slug' => 'foo' ) );
		$term2 = get_term_by( 'slug', 'foo', 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	function test_get_term_by_name() {
		$term1 = wp_insert_term( 'Foo', 'category', array( 'slug' => 'foo' ) );
		$term2 = get_term_by( 'name', 'Foo', 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	function test_get_term_by_id() {
		$term1 = wp_insert_term( 'Foo', 'category', array( 'slug' => 'foo' ) );
		$term2 = get_term_by( 'id', $term1['term_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	/**
	 * 'term_id' is an alias of 'id'.
	 */
	function test_get_term_by_term_id() {
		$term1 = wp_insert_term( 'Foo', 'category', array( 'slug' => 'foo' ) );
		$term2 = get_term_by( 'term_id', $term1['term_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	/**
	 * @ticket 21651
	 */
	function test_get_term_by_tt_id() {
		$term1 = wp_insert_term( 'Foo', 'category' );
		$term2 = get_term_by( 'term_taxonomy_id', $term1['term_taxonomy_id'], 'category' );
		$this->assertEquals( get_term( $term1['term_id'], 'category' ), $term2 );
	}

	function test_get_term_by_unknown() {
		wp_insert_term( 'Foo', 'category', array( 'slug' => 'foo' ) );
		$term2 = get_term_by( 'unknown', 'foo', 'category' );
		$this->assertFalse( $term2 );
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

	/**
	 * @ticket 21760
	 */
	public function test_should_unslash_name() {
		register_taxonomy( 'wptests_tax', 'post' );
		$term_name = 'Foo " \o/';
		$term_name_slashed = wp_slash( $term_name );
		$t = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'name' => $term_name_slashed,
		) );

		$found = get_term_by( 'name', $term_name_slashed, 'wptests_tax' );

		$this->assertTrue( $found instanceof WP_Term );
		$this->assertSame( $t, $found->term_id );
		$this->assertSame( $term_name, $found->name );
	}

	/**
	 * @ticket 21760
	 */
	public function test_should_sanitize_slug() {
		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo-foo',
		) );

		// Whitespace should get replaced by a '-'.
		$found1 = get_term_by( 'slug', 'foo foo', 'wptests_tax' );

		$this->assertTrue( $found1 instanceof WP_Term );
		$this->assertSame( $t1, $found1->term_id );

		$t2 = self::factory()->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => '%e4%bb%aa%e8%a1%a8%e7%9b%98',
		) );

		// Slug should get urlencoded.
		$found2 = get_term_by( 'slug', '仪表盘', 'wptests_tax' );

		$this->assertTrue( $found2 instanceof WP_Term );
		$this->assertSame( $t2, $found2->term_id );
	}

	/**
	 * @ticket 21760
	 */
	public function test_query_should_not_contain_order_by_clause() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'burrito', 'taxonomy' => 'post_tag' ) );
		$found = get_term_by( 'name', 'burrito', 'post_tag' );
		$this->assertSame( $term_id, $found->term_id );
		$this->assertNotContains( 'ORDER BY', $wpdb->last_query );
	}

	/**
	 * @ticket 21760
	 */
	public function test_query_should_contain_limit_clause() {
		global $wpdb;

		$term_id = $this->factory->term->create( array( 'name' => 'burrito', 'taxonomy' => 'post_tag' ) );
		$found = get_term_by( 'name', 'burrito', 'post_tag' );
		$this->assertSame( $term_id, $found->term_id );
		$this->assertContains( 'LIMIT 1', $wpdb->last_query );
	}

	/**
	 * @ticket 21760
	 */
	public function test_prevent_recursion_by_get_terms_filter() {
		$action = new MockAction();

		add_filter( 'get_terms', array( $action, 'filter' ) );
		get_term_by( 'name', 'burrito', 'post_tag' );
		remove_filter( 'get_terms', array( $action, 'filter' ) );

		$this->assertEquals( 0, $action->get_call_count() );
	}
}
