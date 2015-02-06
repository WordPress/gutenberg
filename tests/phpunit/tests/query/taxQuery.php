<?php

/**
 * @group query
 * @group taxonomy
 */
class Tests_Query_TaxQuery extends WP_UnitTestCase {
	public function test_tax_query_single_query_single_term_field_slug() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_field_name() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'Foo' ),
					'field' => 'name',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	/**
	 * @ticket 27810
	 */
	public function test_field_name_should_work_for_names_with_spaces() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
			'slug' => 'foo',
			'name' => 'Foo Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_object_terms( $p1, $t, 'wptests_tax' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'tax_query' => array(
				array(
					'taxonomy' => 'wptests_tax',
					'terms' => array( 'Foo Bar' ),
					'field' => 'name',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_field_term_taxonomy_id() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		$tt_ids = wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => $tt_ids,
					'field' => 'term_taxonomy_id',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_field_term_id() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( $t ),
					'field' => 'term_id',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_operator_in() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
					'operator' => 'IN',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_operator_not_in() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
					'operator' => 'NOT IN',
				),
			),
		) );

		$this->assertEquals( array( $p2 ), $q->posts );
	}

	public function test_tax_query_single_query_single_term_operator_and() {
		$t = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
					'operator' => 'AND',
				),
			),
		) );

		$this->assertEquals( array( $p1 ), $q->posts );
	}

	public function test_tax_query_single_query_multiple_terms_operator_in() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t1, 'category' );
		wp_set_post_terms( $p2, $t2, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo', 'bar' ),
					'field' => 'slug',
					'operator' => 'IN',
				),
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );
	}

	public function test_tax_query_single_query_multiple_terms_operator_not_in() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t1, 'category' );
		wp_set_post_terms( $p2, $t2, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo', 'bar' ),
					'field' => 'slug',
					'operator' => 'NOT IN',
				),
			),
		) );

		$this->assertEquals( array( $p3 ), $q->posts );
	}

	/**
	 * @ticket 18105
	 */
	public function test_tax_query_single_query_multiple_queries_operator_not_in() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_post_terms( $p1, $t1, 'category' );
		wp_set_post_terms( $p2, $t2, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'AND',
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
					'operator' => 'NOT IN',
				),
				array(
					'taxonomy' => 'category',
					'terms' => array( 'bar' ),
					'field' => 'slug',
					'operator' => 'NOT IN',
				),
			),
		) );

		$this->assertEquals( array( $p3 ), $q->posts );
	}

	public function test_tax_query_single_query_multiple_terms_operator_and() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, $t1, 'category' );
		wp_set_object_terms( $p2, array( $t1, $t2 ), 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo', 'bar' ),
					'field' => 'slug',
					'operator' => 'AND',
				),
			),
		) );

		$this->assertEquals( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 29181
	 */
	public function test_tax_query_operator_not_exists() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $p2, array( $t2 ), 'wptests_tax2' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				array(
					'taxonomy' => 'wptests_tax2',
					'operator' => 'NOT EXISTS',
				),
			),
		) );

		$this->assertEqualSets( array( $p1, $p3 ), $q->posts );
	}

	/**
	 * @ticket 29181
	 */
	public function test_tax_query_operator_exists() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $p2, array( $t2 ), 'wptests_tax2' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				array(
					'taxonomy' => 'wptests_tax2',
					'operator' => 'EXISTS',
				),
			),
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 29181
	 */
	public function test_tax_query_operator_exists_should_ignore_terms() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $p2, array( $t2 ), 'wptests_tax2' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				array(
					'taxonomy' => 'wptests_tax2',
					'operator' => 'EXISTS',
					'terms' => array( 'foo', 'bar' ),
				),
			),
		) );

		$this->assertEqualSets( array( $p2 ), $q->posts );
	}

	/**
	 * @ticket 29181
	 */
	public function test_tax_query_operator_exists_with_no_taxonomy() {
		register_taxonomy( 'wptests_tax1', 'post' );
		register_taxonomy( 'wptests_tax2', 'post' );

		$t1 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax1' ) );
		$t2 = $this->factory->term->create( array( 'taxonomy' => 'wptests_tax2' ) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $t1 ), 'wptests_tax1' );
		wp_set_object_terms( $p2, array( $t2 ), 'wptests_tax2' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				array(
					'operator' => 'EXISTS',
				),
			),
		) );

		$this->assertEmpty( $q->posts );
	}

	public function test_tax_query_multiple_queries_relation_and() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, $t1, 'category' );
		wp_set_object_terms( $p2, array( $t1, $t2 ), 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'AND',
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
				),
				array(
					'taxonomy' => 'category',
					'terms' => array( 'bar' ),
					'field' => 'slug',
				),
			),
		) );

		$this->assertEquals( array( $p2 ), $q->posts );
	}

	public function test_tax_query_multiple_queries_relation_or() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, $t1, 'category' );
		wp_set_object_terms( $p2, array( $t1, $t2 ), 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'category',
					'terms' => array( 'foo' ),
					'field' => 'slug',
				),
				array(
					'taxonomy' => 'category',
					'terms' => array( 'bar' ),
					'field' => 'slug',
				),
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );
	}

	public function test_tax_query_multiple_queries_different_taxonomies() {
		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'post_tag',
			'slug' => 'foo',
			'name' => 'Foo',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
			'name' => 'Bar',
		) );
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, $t1, 'post_tag' );
		wp_set_object_terms( $p2, $t2, 'category' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'post_tag',
					'terms' => array( 'foo' ),
					'field' => 'slug',
				),
				array(
					'taxonomy' => 'category',
					'terms' => array( 'bar' ),
					'field' => 'slug',
				),
			),
		) );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );
	}

	/**
	 * @ticket 29738
	 */
	public function test_tax_query_two_nested_queries() {
		register_taxonomy( 'foo', 'post' );
		register_taxonomy( 'bar', 'post' );

		$foo_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$foo_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$bar_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );
		$bar_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p1, array( $bar_term_1 ), 'bar' );
		wp_set_object_terms( $p2, array( $foo_term_2 ), 'foo' );
		wp_set_object_terms( $p2, array( $bar_term_2 ), 'bar' );
		wp_set_object_terms( $p3, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p3, array( $bar_term_2 ), 'bar' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'relation' => 'AND',
					array(
						'taxonomy' => 'foo',
						'terms' => array( $foo_term_1 ),
						'field' => 'term_id',
					),
					array(
						'taxonomy' => 'bar',
						'terms' => array( $bar_term_1 ),
						'field' => 'term_id',
					),
				),
				array(
					'relation' => 'AND',
					array(
						'taxonomy' => 'foo',
						'terms' => array( $foo_term_2 ),
						'field' => 'term_id',
					),
					array(
						'taxonomy' => 'bar',
						'terms' => array( $bar_term_2 ),
						'field' => 'term_id',
					),
				),
			),
		) );

		_unregister_taxonomy( 'foo' );
		_unregister_taxonomy( 'bar' );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );
	}

	/**
	 * @ticket 29738
	 */
	public function test_tax_query_one_nested_query_one_first_order_query() {
		register_taxonomy( 'foo', 'post' );
		register_taxonomy( 'bar', 'post' );

		$foo_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$foo_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$bar_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );
		$bar_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p1, array( $bar_term_1 ), 'bar' );
		wp_set_object_terms( $p2, array( $foo_term_2 ), 'foo' );
		wp_set_object_terms( $p2, array( $bar_term_2 ), 'bar' );
		wp_set_object_terms( $p3, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p3, array( $bar_term_2 ), 'bar' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'foo',
					'terms' => array( $foo_term_2 ),
					'field' => 'term_id',
				),
				array(
					'relation' => 'AND',
					array(
						'taxonomy' => 'foo',
						'terms' => array( $foo_term_1 ),
						'field' => 'term_id',
					),
					array(
						'taxonomy' => 'bar',
						'terms' => array( $bar_term_1 ),
						'field' => 'term_id',
					),
				),
			),
		) );

		_unregister_taxonomy( 'foo' );
		_unregister_taxonomy( 'bar' );

		$this->assertEqualSets( array( $p1, $p2 ), $q->posts );
	}

	/**
	 * @ticket 29738
	 */
	public function test_tax_query_one_double_nested_query_one_first_order_query() {
		register_taxonomy( 'foo', 'post' );
		register_taxonomy( 'bar', 'post' );

		$foo_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$foo_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$bar_term_1 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );
		$bar_term_2 = $this->factory->term->create( array(
			'taxonomy' => 'bar',
		) );

		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();
		$p4 = $this->factory->post->create();

		wp_set_object_terms( $p1, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p1, array( $bar_term_1 ), 'bar' );
		wp_set_object_terms( $p2, array( $foo_term_2 ), 'foo' );
		wp_set_object_terms( $p2, array( $bar_term_2 ), 'bar' );
		wp_set_object_terms( $p3, array( $foo_term_1 ), 'foo' );
		wp_set_object_terms( $p3, array( $bar_term_2 ), 'bar' );

		$q = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'foo',
					'terms' => array( $foo_term_2 ),
					'field' => 'term_id',
				),
				array(
					'relation' => 'AND',
					array(
						'taxonomy' => 'foo',
						'terms' => array( $foo_term_1 ),
						'field' => 'term_id',
					),
					array(
						'relation' => 'OR',
						array(
							'taxonomy' => 'bar',
							'terms' => array( $bar_term_1 ),
							'field' => 'term_id',
						),
						array(
							'taxonomy' => 'bar',
							'terms' => array( $bar_term_2 ),
							'field' => 'term_id',
						),
					),
				),
			),
		) );

		_unregister_taxonomy( 'foo' );
		_unregister_taxonomy( 'bar' );

		$this->assertEqualSets( array( $p1, $p2, $p3 ), $q->posts );
	}

	/**
	 * @ticket 20604
	 */
	public function test_tax_query_relation_or_both_clauses_empty_terms() {
		// An empty tax query should return an empty array, not all posts.

		$this->factory->post->create_many( 10 );

		$query = new WP_Query( array(
			'fields' => 'ids',
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'post_tag',
					'field' => 'id',
					'terms' => false,
					'operator' => 'IN'
				),
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => false,
					'operator' => 'IN'
				),
			)
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 0 , count( $posts ) );
	}

	/**
	 * @ticket 20604
	 */
	public function test_tax_query_relation_or_one_clause_empty_terms() {
		// An empty tax query should return an empty array, not all posts.

		$this->factory->post->create_many( 10 );

		$query = new WP_Query( array(
			'fields' => 'ids',
			'update_post_term_cache' => false,
			'update_post_meta_cache' => false,
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'post_tag',
					'field' => 'id',
					'terms' => array( 'foo' ),
					'operator' => 'IN'
				),
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => false,
					'operator' => 'IN'
				),
			)
		) );

		$posts = $query->get_posts();
		$this->assertEquals( 0 , count( $posts ) );
	}

	public function test_tax_query_include_children() {
		$cat_a = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'Australia' ) );
		$cat_b = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'Sydney', 'parent' => $cat_a ) );
		$cat_c = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'East Syndney', 'parent' => $cat_b ) );
		$cat_d = $this->factory->term->create( array( 'taxonomy' => 'category', 'name' => 'West Syndney', 'parent' => $cat_b ) );

		$post_a = $this->factory->post->create( array( 'post_category' => array( $cat_a ) ) );
		$post_b = $this->factory->post->create( array( 'post_category' => array( $cat_b ) ) );
		$post_c = $this->factory->post->create( array( 'post_category' => array( $cat_c ) ) );
		$post_d = $this->factory->post->create( array( 'post_category' => array( $cat_d ) ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_a ),
				)
			)
		) );

		$this->assertEquals( 4 , count( $posts ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_a ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_b ),
				)
			)
		) );

		$this->assertEquals( 3 , count( $posts ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_b ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_c ),
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );

		$posts = get_posts( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'field' => 'id',
					'terms' => array( $cat_c ),
					'include_children' => false
				)
			)
		) );

		$this->assertEquals( 1 , count( $posts ) );
	}

	public function test_tax_query_taxonomy_with_attachments() {
		$q = new WP_Query();

		register_taxonomy_for_object_type( 'post_tag', 'attachment:image' );
		$tag_id = $this->factory->term->create( array( 'slug' => rand_str(), 'name' => rand_str() ) );
		$image_id = $this->factory->attachment->create_object( 'image.jpg', 0, array(
			'post_mime_type' => 'image/jpeg',
			'post_type' => 'attachment'
		) );
		wp_set_object_terms( $image_id, $tag_id, 'post_tag' );

		$posts = $q->query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'post_type' => 'attachment',
			'post_status' => 'inherit',
			'tax_query' => array(
				array(
					'taxonomy' => 'post_tag',
					'field' => 'term_id',
					'terms' => array( $tag_id )
				)
			)
		) );

		$this->assertEquals( array( $image_id ), $posts );
	}

	public function test_tax_query_no_taxonomy() {
		$cat_id = $this->factory->category->create( array( 'name' => 'alpha' ) );
		$this->factory->post->create( array( 'post_title' => 'alpha', 'post_category' => array( $cat_id ) ) );

		$response1 = new WP_Query( array(
			'tax_query' => array(
				array( 'terms' => array( $cat_id ) )
			)
		) );
		$this->assertEmpty( $response1->posts );

		$response2 = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'taxonomy' => 'category',
					'terms' => array( $cat_id )
				)
			)
		) );
		$this->assertNotEmpty( $response2->posts );

		$term = get_category( $cat_id );
		$response3 = new WP_Query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'tax_query' => array(
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $term->term_taxonomy_id )
				)
			)
		) );
		$this->assertNotEmpty( $response3->posts );
	}

	public function test_term_taxonomy_id_field_no_taxonomy() {
		$q = new WP_Query();

		$posts = $this->factory->post->create_many( 5 );

		$cats = $tags = array();

		// need term_taxonomy_ids in addition to term_ids, so no factory
		for ( $i = 0; $i < 5; $i++ ) {
			$cats[$i] = wp_insert_term( 'category-' . $i , 'category' );
			$tags[$i] = wp_insert_term( 'tag-' . $i, 'post_tag' );

			// post 0 gets all terms
			wp_set_object_terms( $posts[0], array( $cats[$i]['term_id'] ), 'category', true );
			wp_set_object_terms( $posts[0], array( $tags[$i]['term_id'] ), 'post_tag', true );
		}

		wp_set_object_terms( $posts[1], array( $cats[0]['term_id'], $cats[2]['term_id'], $cats[4]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[1], array( $tags[0]['term_id'], $tags[2]['term_id'], $cats[4]['term_id'] ), 'post_tag' );

		wp_set_object_terms( $posts[2], array( $cats[1]['term_id'], $cats[3]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[2], array( $tags[1]['term_id'], $tags[3]['term_id'] ), 'post_tag' );

		wp_set_object_terms( $posts[3], array( $cats[0]['term_id'], $cats[2]['term_id'], $cats[4]['term_id'] ), 'category' );
		wp_set_object_terms( $posts[3], array( $tags[1]['term_id'], $tags[3]['term_id'] ), 'post_tag' );

		$results1 = $q->query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				'relation' => 'OR',
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[0]['term_taxonomy_id'], $cats[2]['term_taxonomy_id'], $cats[4]['term_taxonomy_id'], $tags[0]['term_taxonomy_id'], $tags[2]['term_taxonomy_id'], $cats[4]['term_taxonomy_id'] ),
					'operator' => 'AND',
					'include_children' => false,
				),
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[1]['term_taxonomy_id'], $cats[3]['term_taxonomy_id'], $tags[1]['term_taxonomy_id'], $tags[3]['term_taxonomy_id'] ),
					'operator' => 'AND',
					'include_children' => false,
				)
			)
		) );

		$this->assertEquals( array( $posts[0], $posts[1], $posts[2] ), $results1, 'Relation: OR; Operator: AND' );

		$results2 = $q->query( array(
			'fields' => 'ids',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'orderby' => 'ID',
			'order' => 'ASC',
			'tax_query' => array(
				'relation' => 'AND',
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[0]['term_taxonomy_id'], $tags[0]['term_taxonomy_id'] ),
					'operator' => 'IN',
					'include_children' => false,
				),
				array(
					'field' => 'term_taxonomy_id',
					'terms' => array( $cats[3]['term_taxonomy_id'], $tags[3]['term_taxonomy_id'] ),
					'operator' => 'IN',
					'include_children' => false,
				)
			)
		) );

		$this->assertEquals( array( $posts[0], $posts[3] ), $results2, 'Relation: AND; Operator: IN' );
	}

	/**
	 * @ticket 29738
	 */
	public function test_populate_taxonomy_query_var_from_tax_query() {
		register_taxonomy( 'foo', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$c = $this->factory->term->create( array(
			'taxonomy' => 'category',
		) );

		$q = new WP_Query( array(
			'tax_query' => array(
				// Empty terms mean that this one should be skipped
				array(
					'taxonomy' => 'bar',
					'terms' => array(),
				),

				// Category and post tags should be skipped
				array(
					'taxonomy' => 'category',
					'terms' => array( $c ),
				),

				array(
					'taxonomy' => 'foo',
					'terms' => array( $t ),
				),
			),
		) );

		$this->assertSame( 'foo', $q->get( 'taxonomy' ) );

		_unregister_taxonomy( 'foo' );
	}

	public function test_populate_taxonomy_query_var_from_tax_query_taxonomy_already_set() {
		register_taxonomy( 'foo', 'post' );
		register_taxonomy( 'foo1', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );

		$q = new WP_Query( array(
			'taxonomy' => 'bar',
			'tax_query' => array(
				array(
					'taxonomy' => 'foo',
					'terms' => array( $t ),
				),
			),
		) );

		$this->assertSame( 'bar', $q->get( 'taxonomy' ) );

		_unregister_taxonomy( 'foo' );
		_unregister_taxonomy( 'foo1' );
	}

	public function test_populate_term_query_var_from_tax_query() {
		register_taxonomy( 'foo', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
			'slug' => 'bar',
		) );

		$q = new WP_Query( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'foo',
					'terms' => array( 'bar' ),
					'field' => 'slug',
				),
			),
		) );

		$this->assertSame( 'bar', $q->get( 'term' ) );

		_unregister_taxonomy( 'foo' );
	}

	public function test_populate_term_id_query_var_from_tax_query() {
		register_taxonomy( 'foo', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
			'slug' => 'bar',
		) );

		$q = new WP_Query( array(
			'tax_query' => array(
				array(
					'taxonomy' => 'foo',
					'terms' => array( $t ),
					'field' => 'term_id',
				),
			),
		) );

		$this->assertEquals( $t, $q->get( 'term_id' ) );

		_unregister_taxonomy( 'foo' );
	}

	/**
	 * @ticket 29738
	 */
	public function test_populate_cat_category_name_query_var_from_tax_query() {
		register_taxonomy( 'foo', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$c = $this->factory->term->create( array(
			'taxonomy' => 'category',
			'slug' => 'bar',
		) );

		$q = new WP_Query( array(
			'tax_query' => array(
				// Non-category should be skipped
				array(
					'taxonomy' => 'foo',
					'terms' => array( $t ),
				),

				// Empty terms mean that this one should be skipped
				array(
					'taxonomy' => 'category',
					'terms' => array(),
				),

				// Category and post tags should be skipped
				array(
					'taxonomy' => 'category',
					'terms' => array( $c ),
				),
			),
		) );

		$this->assertEquals( $c, $q->get( 'cat' ) );
		$this->assertEquals( 'bar', $q->get( 'category_name' ) );

		_unregister_taxonomy( 'foo' );
	}

	/**
	 * @ticket 29738
	 */
	public function test_populate_tag_id_query_var_from_tax_query() {
		register_taxonomy( 'foo', 'post' );
		$t = $this->factory->term->create( array(
			'taxonomy' => 'foo',
		) );
		$tag = $this->factory->term->create( array(
			'taxonomy' => 'post_tag',
			'slug' => 'bar',
		) );

		$q = new WP_Query( array(
			'tax_query' => array(
				// Non-tag should be skipped
				array(
					'taxonomy' => 'foo',
					'terms' => array( $t ),
				),

				// Empty terms mean that this one should be skipped
				array(
					'taxonomy' => 'post_tag',
					'terms' => array(),
				),

				// Category and post tags should be skipped
				array(
					'taxonomy' => 'post_tag',
					'terms' => array( $tag ),
				),
			),
		) );

		$this->assertEquals( $tag, $q->get( 'tag_id' ) );

		_unregister_taxonomy( 'foo' );
	}
}
