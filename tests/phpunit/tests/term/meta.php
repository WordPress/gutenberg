<?php

/**
 * @group taxonomy
 * @group meta
 * @ticket 10142
 */
class Tests_Term_Meta extends WP_UnitTestCase {
	public function setUp() {
		parent::setUp();
		register_taxonomy( 'wptests_tax', 'post' );
	}

	public function test_add() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$this->assertNotEmpty( add_term_meta( $t, 'foo', 'bar' ) );
	}

	public function test_add_unique() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$this->assertNotEmpty( add_term_meta( $t, 'foo', 'bar' ) );
		$this->assertFalse( add_term_meta( $t, 'foo', 'bar', true ) );
	}

	public function test_delete() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $t, 'foo', 'bar' );

		$this->assertTrue( delete_term_meta( $t, 'foo' ) );
	}

	public function test_delete_with_invalid_meta_key_should_return_false() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$this->assertFalse( delete_term_meta( $t, 'foo' ) );
	}

	public function test_delete_should_respect_meta_value() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $t, 'foo', 'bar' );
		add_term_meta( $t, 'foo', 'baz' );

		$this->assertTrue( delete_term_meta( $t, 'foo', 'bar' ) );

		$metas = get_term_meta( $t, 'foo', false );
		$this->assertSame( array( 'baz' ), $metas );
	}

	public function test_get_with_no_key_should_fetch_all_keys() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $t, 'foo', 'bar' );
		add_term_meta( $t, 'foo1', 'baz' );

		$found = get_term_meta( $t );
		$expected = array(
			'foo' => array( 'bar' ),
			'foo1' => array( 'baz' ),
		);

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_with_key_should_fetch_all_for_key() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $t, 'foo', 'bar' );
		add_term_meta( $t, 'foo', 'baz' );
		add_term_meta( $t, 'foo1', 'baz' );

		$found = get_term_meta( $t, 'foo' );
		$expected = array( 'bar', 'baz' );

		$this->assertEqualSets( $expected, $found );
	}

	public function test_get_should_respect_single_true() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $t, 'foo', 'bar' );
		add_term_meta( $t, 'foo', 'baz' );

		$found = get_term_meta( $t, 'foo', true );
		$this->assertEquals( 'bar', $found );
	}

	public function test_update_should_pass_to_add_when_no_value_exists_for_key() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		$actual = update_term_meta( $t, 'foo', 'bar' );
		$this->assertInternalType( 'int', $actual );
		$this->assertNotEmpty( $actual );

		$meta = get_term_meta( $t, 'foo', true );
		$this->assertSame( 'bar', $meta );
	}

	public function test_update_should_return_true_when_updating_existing_value_for_key() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $t, 'foo', 'bar' );

		$actual = update_term_meta( $t, 'foo', 'baz' );
		$this->assertTrue( $actual );

		$meta = get_term_meta( $t, 'foo', true );
		$this->assertSame( 'baz', $meta );
	}

	public function test_term_meta_should_be_lazy_loaded_for_all_terms_in_wp_query_loop() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		register_taxonomy( 'wptests_tax', 'post' );
		$terms = self::factory()->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );
		wp_set_object_terms( $p, $terms, 'wptests_tax' );
		foreach ( $terms as $t ) {
			add_term_meta( $t, 'foo', 'bar' );
		}

		// Create another term, which should *not* be lazy loaded because it's unattached.
		$orphan_term = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );
		add_term_meta( $orphan_term, 'foo', 'bar' );

		// Force results to be cached, even when using extended cache.
		add_action( 'pre_get_posts', array( $this, 'set_cache_results' ) );
		$this->go_to( get_permalink( $p ) );
		remove_action( 'pre_get_posts', array( $this, 'set_cache_results' ) );

		if ( have_posts() ) {
			while ( have_posts() ) {
				the_post();

				// First request will hit the database.
				$num_queries = $wpdb->num_queries;
				$this->assertSame( 'bar', get_term_meta( $terms[0], 'foo', true ) );
				$num_queries++;
				$this->assertSame( $num_queries, $wpdb->num_queries );

				// Second and third requests should be in cache.
				$this->assertSame( 'bar', get_term_meta( $terms[1], 'foo', true ) );
				$this->assertSame( 'bar', get_term_meta( $terms[2], 'foo', true ) );
				$this->assertSame( $num_queries, $wpdb->num_queries );

				// Querying a term not primed should result in a hit.
				$num_queries++;
				$this->assertSame( 'bar', get_term_meta( $orphan_term, 'foo', true ) );
				$this->assertSame( $num_queries, $wpdb->num_queries );
			}
		}
	}

	/**
	 * @ticket 36593
	 */
	public function test_lazy_load_term_meta_should_fall_back_on_update_post_term_cache() {
		$q = new WP_Query( array(
			'update_post_term_cache' => true,
		) );

		$this->assertTrue( $q->get( 'lazy_load_term_meta' ) );

		$q = new WP_Query( array(
			'update_post_term_cache' => false,
		) );

		$this->assertFalse( $q->get( 'lazy_load_term_meta' ) );
	}

	/**
	 * @ticket 36593
	 */
	public function test_lazy_load_term_meta_false() {
		global $wpdb;

		$p = self::factory()->post->create( array( 'post_status' => 'publish' ) );

		register_taxonomy( 'wptests_tax', 'post' );
		$terms = self::factory()->term->create_many( 3, array( 'taxonomy' => 'wptests_tax' ) );
		wp_set_object_terms( $p, $terms, 'wptests_tax' );
		foreach ( $terms as $t ) {
			add_term_meta( $t, 'foo', 'bar' );
		}

		$q = new WP_Query( array(
			'cache_results' => true,
			'update_post_term_cache' => true,
			'lazy_load_term_meta' => false,
		) );

		if ( $q->have_posts() ) {
			while ( $q->have_posts() ) {
				$q->the_post();

				// Requests will hit the database.
				$num_queries = $wpdb->num_queries;
				$this->assertSame( 'bar', get_term_meta( $terms[0], 'foo', true ) );
				$num_queries++;
				$this->assertSame( $num_queries, $wpdb->num_queries );

				$this->assertSame( 'bar', get_term_meta( $terms[1], 'foo', true ) );
				$num_queries++;
				$this->assertSame( $num_queries, $wpdb->num_queries );
			}
		}
	}

	public function test_adding_term_meta_should_bust_get_terms_cache() {
		$terms = self::factory()->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $terms[0], 'foo', 'bar' );

		// Prime cache.
		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0] ), $found );

		add_term_meta( $terms[1], 'foo', 'bar' );

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0], $terms[1] ), $found );
	}

	public function test_updating_term_meta_should_bust_get_terms_cache() {
		$terms = self::factory()->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $terms[0], 'foo', 'bar' );
		add_term_meta( $terms[1], 'foo', 'baz' );

		// Prime cache.
		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0] ), $found );

		update_term_meta( $terms[1], 'foo', 'bar' );

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0], $terms[1] ), $found );
	}

	public function test_deleting_term_meta_should_bust_get_terms_cache() {
		$terms = self::factory()->term->create_many( 2, array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $terms[0], 'foo', 'bar' );
		add_term_meta( $terms[1], 'foo', 'bar' );

		// Prime cache.
		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0], $terms[1] ), $found );

		delete_term_meta( $terms[1], 'foo', 'bar' );

		$found = get_terms( 'wptests_tax', array(
			'hide_empty' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$this->assertEqualSets( array( $terms[0] ), $found );
	}

	/**
	 * @ticket 34544
	 */
	public function test_add_term_meta_should_return_error_when_term_id_is_shared() {
		global $wpdb;

		update_option( 'finished_splitting_shared_terms', false );

		register_taxonomy( 'wptests_tax', 'post' );
		register_taxonomy( 'wptests_tax_2', 'post' );
		register_taxonomy( 'wptests_tax_3', 'post' );

		$t1 = wp_insert_term( 'Foo', 'wptests_tax' );
		$t2 = wp_insert_term( 'Foo', 'wptests_tax_2' );
		$t3 = wp_insert_term( 'Foo', 'wptests_tax_3' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t3['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$found = add_term_meta( $t1['term_id'], 'bar', 'baz' );
		$this->assertWPError( $found );
		$this->assertSame( 'ambiguous_term_id', $found->get_error_code() );
	}

	/**
	 * @ticket 34544
	 */
	public function test_update_term_meta_should_return_error_when_term_id_is_shared() {
		global $wpdb;

		update_option( 'finished_splitting_shared_terms', false );

		register_taxonomy( 'wptests_tax', 'post' );
		$t1 = wp_insert_term( 'Foo', 'wptests_tax' );
		add_term_meta( $t1, 'foo', 'bar' );

		register_taxonomy( 'wptests_tax_2', 'post' );
		register_taxonomy( 'wptests_tax_3', 'post' );

		$t2 = wp_insert_term( 'Foo', 'wptests_tax_2' );
		$t3 = wp_insert_term( 'Foo', 'wptests_tax_3' );

		// Manually modify because shared terms shouldn't naturally occur.
		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t2['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$wpdb->update( $wpdb->term_taxonomy,
			array( 'term_id' => $t1['term_id'] ),
			array( 'term_taxonomy_id' => $t3['term_taxonomy_id'] ),
			array( '%d' ),
			array( '%d' )
		);

		$found = update_term_meta( $t1['term_id'], 'foo', 'baz' );
		$this->assertWPError( $found );
		$this->assertSame( 'ambiguous_term_id', $found->get_error_code() );
	}

	/**
	 * @ticket 34626
	 */
	public function test_term_meta_should_be_deleted_when_term_is_deleted() {
		$t = self::factory()->term->create( array( 'taxonomy' => 'wptests_tax' ) );

		add_term_meta( $t, 'foo', 'bar' );
		add_term_meta( $t, 'foo1', 'bar' );

		$this->assertSame( 'bar', get_term_meta( $t, 'foo', true ) );
		$this->assertSame( 'bar', get_term_meta( $t, 'foo1', true ) );

		$this->assertTrue( wp_delete_term( $t, 'wptests_tax' ) );

		$this->assertSame( '', get_term_meta( $t, 'foo', true ) );
		$this->assertSame( '', get_term_meta( $t, 'foo1', true ) );
	}

	public static function set_cache_results( $q ) {
		$q->set( 'cache_results', true );
	}
}
