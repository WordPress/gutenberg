<?php

class Tests_Post_Query extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_no_key() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'oof', 'bar' );
		add_post_meta( $p3, 'oof', 'baz' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'value' => 'bar',
				),
			),
		) );

		$expected = array( $p1, $p2 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_no_value() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'oof', 'bar' );
		add_post_meta( $p3, 'oof', 'baz' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'oof',
				),
			),
		) );

		$expected = array( $p2, $p3 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_default() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_equals() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
					'compare' => '=',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_not_equals() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'foo', 'baz' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'bar',
					'compare' => '!=',
				),
			),
		) );

		$expected = array( $p2 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_arithmetic_comparisons() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', '1' );
		add_post_meta( $p2, 'foo', '2' );
		add_post_meta( $p3, 'foo', '3' );

		// <
		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 2,
					'compare' => '<',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEqualSets( $expected, $query->posts );

		// <=
		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 2,
					'compare' => '<=',
				),
			),
		) );

		$expected = array( $p1, $p2 );
		$this->assertEqualSets( $expected, $query->posts );

		// >=
		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 2,
					'compare' => '>=',
				),
			),
		) );

		$expected = array( $p2, $p3 );
		$this->assertEqualSets( $expected, $query->posts );

		// >
		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 2,
					'compare' => '>',
				),
			),
		) );

		$expected = array( $p3 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_like() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'ba',
					'compare' => 'LIKE',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_not_like() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'foo', 'rab' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'ba',
					'compare' => 'NOT LIKE',
				),
			),
		) );

		$expected = array( $p2 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_between_not_between() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', '1' );
		add_post_meta( $p2, 'foo', '10' );
		add_post_meta( $p3, 'foo', '100' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => array( 9, 12 ),
					'compare' => 'BETWEEN',
					'type' => 'NUMERIC',
				),
			),
		) );

		$expected = array( $p2 );
		$this->assertEqualSets( $expected, $query->posts );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => array( 9, 12 ),
					'compare' => 'NOT BETWEEN',
					'type' => 'NUMERIC',
				),
			),
		) );

		$expected = array( $p1, $p3 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_regexp_rlike() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'foo', 'baz' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'z$',
					'compare' => 'REGEXP',
				),
			),
		) );

		$expected = array( $p2 );
		$this->assertEqualSets( $expected, $query->posts );

		// RLIKE is a synonym for REGEXP.
		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'z$',
					'compare' => 'RLIKE',
				),
			),
		) );

		$expected = array( $p2 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_single_query_compare_not_regexp() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'foo', 'baz' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'z$',
					'compare' => 'NOT REGEXP',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_relation_default() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'foo value 1' );
		add_post_meta( $p1, 'bar', 'bar value 1' );
		add_post_meta( $p2, 'foo', 'foo value 1' );
		add_post_meta( $p2, 'bar', 'bar value 2' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo',
					'value' => 'foo value 1',
				),
				array(
					'key' => 'bar',
					'value' => 'bar value 1',
				),
			),
		) );

		$expected = array( $p1 );
		$this->assertEquals( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_relation_or() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'val2' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'froo', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'tango', 'val2' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'bar', 'val1' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
					'value' => 'val2'
				),
				array(
					'key' => 'baz'
				),
				array(
					'key' => 'froo'
				),
				'relation' => 'OR',
			),
		) );

		$expected = array( $post_id, $post_id2, $post_id3, $post_id4 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	public function test_meta_query_relation_and() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'val2' );
		add_post_meta( $post_id2, 'foo', rand_str() );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'froo', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'tango', 'val2' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'bar', 'val1' );
		add_post_meta( $post_id6, 'foo', rand_str() );
		$post_id7 = $this->factory->post->create();
		add_post_meta( $post_id7, 'foo', rand_str() );
		add_post_meta( $post_id7, 'froo', rand_str() );
		add_post_meta( $post_id7, 'baz', rand_str() );
		add_post_meta( $post_id7, 'bar', 'val2' );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
					'value' => 'val2'
				),
				array(
					'key' => 'baz'
				),
				array(
					'key' => 'froo'
				),
				'relation' => 'AND',
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $post_id7 );
		$this->assertEqualSets( $expected, $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo'
				),
				array(
					'key' => 'bar',
				),
				'relation' => 'AND',
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $post_id2, $post_id6, $post_id7 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 18158
	 * @group meta
	 */
	public function test_meta_query_compare_not_exists() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', rand_str() );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', rand_str() );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'bar', rand_str() );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', rand_str() );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'foo', rand_str() );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo',
					'compare' => 'NOT EXISTS',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $post_id2, $post_id3, $post_id4 );
		$this->assertEqualSets( $expected, $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo',
					'compare' => 'NOT EXISTS',
				),
				array(
					'key' => 'bar',
					'compare' => 'NOT EXISTS',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $post_id4 );
		$this->assertEquals( $expected, $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'foo',
					'compare' => 'NOT EXISTS',
				),
				array(
					'key' => 'bar',
					'compare' => 'NOT EXISTS',
				),
				array(
					'key' => 'baz',
					'compare' => 'NOT EXISTS',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$this->assertEquals( 0, count( $query->posts ) );
	}

	/**
	 * @ticket 29062
	 */
	public function test_meta_query_compare_not_exists_with_another_condition_relation_or() {
		$posts = $this->factory->post->create_many( 4 );
		update_post_meta( $posts[0], 'color', 'orange' );
		update_post_meta( $posts[1], 'color', 'blue' );
		update_post_meta( $posts[1], 'vegetable', 'onion' );
		update_post_meta( $posts[2], 'vegetable', 'shallot' );

		$post_3_meta = get_post_meta( $posts[3] );
		foreach ( $post_3_meta as $meta_key => $meta_value ) {
			delete_post_meta( $posts[3], $meta_key );
		}

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
				),
				array(
					'key' => 'color',
					'compare' => 'NOT EXISTS',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[1], $posts[2], $posts[3] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_or_compare_equals() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '=',
				),
				array(
					'key' => 'vegetable',
					'value' => 'shallot',
					'compare' => '=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[1], $posts[2] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_or_compare_equals_different_keys() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '=',
				),
				array(
					'key' => 'color',
					'value' => 'orange',
					'compare' => '=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[0], $posts[1] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_or_compare_equals_and_in() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '=',
				),
				array(
					'key' => 'color',
					'value' => array( 'orange', 'green' ),
					'compare' => 'IN',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[0], $posts[1] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_or_compare_equals_and_like() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '=',
				),
				array(
					'key' => 'vegetable',
					'value' => 'hall',
					'compare' => 'LIKE',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[1], $posts[2] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_or_compare_equals_and_between() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'number_of_colors', '2' );
		add_post_meta( $posts[1], 'number_of_colors', '5' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'vegetable',
					'value' => 'shallot',
					'compare' => '=',
				),
				array(
					'key' => 'number_of_colors',
					'value' => array( 1, 3 ),
					'compare' => 'BETWEEN',
					'type' => 'SIGNED',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[0], $posts[2] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_in_same_keys() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );
		add_post_meta( $posts[3], 'vegetable', 'banana' );
		add_post_meta( $posts[3], 'vegetable', 'onion' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => array( 'onion', 'shallot' ),
					'compare' => 'IN',
				),
				array(
					'key' => 'vegetable',
					'value' => array( 'banana' ),
					'compare' => 'IN',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[3] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_in_different_keys() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[1], 'vegetable', 'shallot' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );
		add_post_meta( $posts[3], 'vegetable', 'banana' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => array( 'onion', 'shallot' ),
					'compare' => 'IN',
				),
				array(
					'key' => 'color',
					'value' => array( 'blue' ),
					'compare' => 'IN',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[1] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_not_equals() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );
		add_post_meta( $posts[3], 'vegetable', 'banana' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '!=',
				),
				array(
					'key' => 'vegetable',
					'value' => 'shallot',
					'compare' => '!=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[3] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_not_equals_different_keys() {
		$posts = $this->factory->post->create_many( 4 );

		// !shallot, but orange.
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[0], 'vegetable', 'onion' );

		// !orange, but shallot.
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'shallot' );

		// Neither.
		add_post_meta( $posts[2], 'color', 'blue' );
		add_post_meta( $posts[2], 'vegetable', 'onion' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => 'shallot',
					'compare' => '!=',
				),
				array(
					'key' => 'color',
					'value' => 'orange',
					'compare' => '!=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[2] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_not_equals_not_in() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );
		add_post_meta( $posts[3], 'vegetable', 'banana' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '!=',
				),
				array(
					'key' => 'vegetable',
					'value' => array( 'shallot' ),
					'compare' => 'NOT IN',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[3] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 24093
	 */
	public function test_meta_query_relation_and_compare_not_equals_and_not_like() {
		$posts = $this->factory->post->create_many( 4 );
		add_post_meta( $posts[0], 'color', 'orange' );
		add_post_meta( $posts[1], 'color', 'blue' );
		add_post_meta( $posts[1], 'vegetable', 'onion' );
		add_post_meta( $posts[2], 'vegetable', 'shallot' );
		add_post_meta( $posts[3], 'vegetable', 'banana' );

		$query = new WP_Query( array(
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'vegetable',
					'value' => 'onion',
					'compare' => '!=',
				),
				array(
					'key' => 'vegetable',
					'value' => 'hall',
					'compare' => 'NOT LIKE',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$expected = array( $posts[3] );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 23033
	 * @group meta
	 */
	public function test_meta_query_decimal_results() {
		$post_1 = $this->factory->post->create();
		$post_2 = $this->factory->post->create();
		$post_3 = $this->factory->post->create();
		$post_4 = $this->factory->post->create();

		update_post_meta( $post_1, 'decimal_value', '-0.3' );
		update_post_meta( $post_2, 'decimal_value', '0.23409844' );
		update_post_meta( $post_3, 'decimal_value', '0.3' );
		update_post_meta( $post_4, 'decimal_value', '0.4' );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '.300',
					'compare' => '=',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_3 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '0.35',
					'compare' => '>',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_4 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '0.3',
					'compare' => '>=',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_3, $post_4 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '0',
					'compare' => '<',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_1 ), $query->posts, 'ID' );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '0.3',
					'compare' => '<=',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_1, $post_2, $post_3 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => array( 0.23409845, .31 ),
					'compare' => 'BETWEEN',
					'type' => 'DECIMAL(10, 10)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_3 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => array( 0.23409845, .31 ),
					'compare' => 'NOT BETWEEN',
					'type' => 'DECIMAL(10,10)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_1, $post_2, $post_4 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '.3',
					'compare' => 'LIKE',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_1, $post_3 ), $query->posts );

		$query = new WP_Query( array(
			'meta_query' => array(
				array(
					'key' => 'decimal_value',
					'value' => '.3',
					'compare' => 'NOT LIKE',
					'type' => 'DECIMAL(10,2)'
				)
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_2, $post_4 ), $query->posts );

		$query = new WP_Query( array(
			'orderby' => 'meta_value',
			'order' => 'DESC',
			'meta_key' => 'decimal_value',
			'meta_type' => 'DECIMAL(10, 2)',
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );
		$this->assertEqualSets( array( $post_4, $post_3, $post_2, $post_1 ), $query->posts );
	}

	/**
	 * @group meta
	 * @ticket 29604
	 */
	public function test_meta_query_with_orderby_meta_value_relation_or() {
		$posts = $this->factory->post->create_many( 4 );
		update_post_meta( $posts[0], 'foo', 5 );
		update_post_meta( $posts[1], 'foo', 6 );
		update_post_meta( $posts[2], 'foo', 4 );
		update_post_meta( $posts[3], 'foo', 7 );

		update_post_meta( $posts[0], 'bar1', 'baz' );
		update_post_meta( $posts[1], 'bar1', 'baz' );
		update_post_meta( $posts[2], 'bar2', 'baz' );

		$query = new WP_Query( array(
			'orderby' => 'meta_value',
			'order' => 'ASC',
			'meta_key' => 'foo',
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'bar1',
					'value' => 'baz',
					'compare' => '=',
				),
				array(
					'key' => 'bar2',
					'value' => 'baz',
					'compare' => '=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $posts[2], $posts[0], $posts[1] ), $query->posts );
	}

	/**
	 * @group meta
	 * @ticket 29604
	 */
	public function test_meta_query_with_orderby_meta_value_relation_and() {
		$posts = $this->factory->post->create_many( 4 );
		update_post_meta( $posts[0], 'foo', 5 );
		update_post_meta( $posts[1], 'foo', 6 );
		update_post_meta( $posts[2], 'foo', 4 );
		update_post_meta( $posts[3], 'foo', 7 );

		update_post_meta( $posts[0], 'bar1', 'baz' );
		update_post_meta( $posts[1], 'bar1', 'baz' );
		update_post_meta( $posts[2], 'bar1', 'baz' );
		update_post_meta( $posts[3], 'bar1', 'baz' );
		update_post_meta( $posts[0], 'bar2', 'baz' );
		update_post_meta( $posts[1], 'bar2', 'baz' );
		update_post_meta( $posts[2], 'bar2', 'baz' );

		$query = new WP_Query( array(
			'orderby' => 'meta_value',
			'order' => 'ASC',
			'meta_key' => 'foo',
			'meta_query' => array(
				'relation' => 'AND',
				array(
					'key' => 'bar1',
					'value' => 'baz',
					'compare' => '=',
				),
				array(
					'key' => 'bar2',
					'value' => 'baz',
					'compare' => '=',
				),
			),
			'update_post_meta_cache' => false,
			'update_post_term_cache' => false,
			'fields' => 'ids',
		) );

		$this->assertEquals( array( $posts[2], $posts[0], $posts[1] ), $query->posts );
	}

	/**
	 * @ticket 29642
	 * @group meta
	 */
	public function test_meta_query_nested() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p2, 'foo2', 'bar' );
		add_post_meta( $p3, 'foo2', 'bar' );
		add_post_meta( $p3, 'foo3', 'bar' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_term_meta_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'relation' => 'AND',
					array(
						'key' => 'foo2',
						'value' => 'bar',
					),
					array(
						'key' => 'foo3',
						'value' => 'bar',
					),
				),
			),
		) );

		$expected = array( $p1, $p3 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @ticket 29642
	 * @group meta
	 */
	public function test_meta_query_nested_two_levels_deep() {
		$p1 = $this->factory->post->create();
		$p2 = $this->factory->post->create();
		$p3 = $this->factory->post->create();

		add_post_meta( $p1, 'foo', 'bar' );
		add_post_meta( $p3, 'foo2', 'bar' );
		add_post_meta( $p3, 'foo3', 'bar' );
		add_post_meta( $p3, 'foo4', 'bar' );

		$query = new WP_Query( array(
			'update_post_meta_cache' => false,
			'update_term_meta_cache' => false,
			'fields' => 'ids',
			'meta_query' => array(
				'relation' => 'OR',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'relation' => 'OR',
					array(
						'key' => 'foo2',
						'value' => 'bar',
					),
					array(
						'relation' => 'AND',
						array(
							'key' => 'foo3',
							'value' => 'bar',
						),
						array(
							'key' => 'foo4',
							'value' => 'bar',
						),
					),
				),
			),
		) );

		$expected = array( $p1, $p3 );
		$this->assertEqualSets( $expected, $query->posts );
	}

	/**
	 * @group meta
	 */
	function test_meta_between_not_between() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'time', 500 );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'time', 1001 );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'time', 0 );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'time', 1 );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'time', 1000 );

		$args = array(
			'meta_key' => 'time',
			'meta_value' => array( 1, 1000 ),
			'meta_type' => 'numeric',
			'meta_compare' => 'NOT BETWEEN'
			);

		$query = new WP_Query( $args );
		$this->assertEquals( 2, count ( $query->posts ) );
		foreach ( $query->posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $query->posts, 'ID' );
		$this->assertEqualSets( array( $post_id2, $post_id3 ), $posts );

		$args = array(
			'meta_key' => 'time',
			'meta_value' => array( 1, 1000 ),
			'meta_type' => 'numeric',
			'meta_compare' => 'BETWEEN'
			);

		$query = new WP_Query( $args );
		$this->assertEquals( 3, count ( $query->posts ) );
		foreach ( $query->posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $query->posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id4, $post_id5 ), $posts );
	}

	/**
	 * @ticket 16829
	 * @group meta
	 */
	function test_meta_default_compare() {
		// compare should default to IN when meta_value is an array
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', 'bar' );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'bar', 'baz' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'foo', 'baz' );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', 'bar' );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'foo', rand_str() );

		$posts = get_posts( array(
			'meta_key' => 'foo',
			'meta_value' => array( 'bar', 'baz' )
		) );

		$this->assertEquals( 2, count( $posts ) );
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3 ), $posts );

		$posts = get_posts( array(
			'meta_key' => 'foo',
			'meta_value' => array( 'bar', 'baz' ),
			'meta_compare' => 'IN'
		) );

		$this->assertEquals( 2, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3 ), $posts );
	}

	/**
	 * @ticket 17264
	 * @group meta
	 */
	function test_duplicate_posts_when_no_key() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'city', 'Lorem' );
		add_post_meta( $post_id, 'address', '123 Lorem St.' );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'city', 'Lorem' );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'city', 'Loren' );

		$args = array(
			'meta_query' => array(
			array(
				'value' => 'lorem',
				'compare' => 'LIKE'
			)
			)
		);

		$posts = get_posts( $args );
		$this->assertEquals( 2, count( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id2 ), $posts );
	}

	/**
	 * @ticket 15292
	 * @group meta
	 */
	function test_empty_meta_value() {
		$post_id = $this->factory->post->create();
		add_post_meta( $post_id, 'foo', '0' );
		add_post_meta( $post_id, 'bar', 0 );
		$post_id2 = $this->factory->post->create();
		add_post_meta( $post_id2, 'foo', 1 );
		$post_id3 = $this->factory->post->create();
		add_post_meta( $post_id3, 'baz', 0 );
		$post_id4 = $this->factory->post->create();
		add_post_meta( $post_id4, 'baz', 0 );
		$post_id5 = $this->factory->post->create();
		add_post_meta( $post_id5, 'baz', 0 );
		add_post_meta( $post_id5, 'bar', '0' );
		$post_id6 = $this->factory->post->create();
		add_post_meta( $post_id6, 'baz', 0 );

		$q = new WP_Query( array( 'meta_key' => 'foo', 'meta_value' => '0' ) );
		$this->assertEquals( 1, count ( $q->posts ) );
		foreach ( $q->posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$this->assertEquals( $post_id, $q->posts[0]->ID );

		$posts = get_posts( array( 'meta_key' => 'bar', 'meta_value' => '0' ) );
		$this->assertEquals( 2, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id5 ), $posts );

		$posts = get_posts( array( 'meta_key' => 'bar', 'meta_value' => 0 ) );
		$this->assertEquals( 2, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id5 ), $posts );

		$posts = get_posts( array( 'meta_value' => 0 ) );
		$this->assertEquals( 5, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3, $post_id4, $post_id5, $post_id6 ), $posts );

		$posts = get_posts( array( 'meta_value' => '0' ) );
		$this->assertEquals( 5, count ( $posts ) );
		foreach ( $posts as $post ) {
			$this->assertInstanceOf( 'WP_Post', $post );
			$this->assertEquals( 'raw', $post->filter );
		}
		$posts = wp_list_pluck( $posts, 'ID' );
		$this->assertEqualSets( array( $post_id, $post_id3, $post_id4, $post_id5, $post_id6 ), $posts );
	}

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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
	 * @group taxonomy
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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
	 * @group taxonomy
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
	 * @group taxonomy
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
	 * @group taxonomy
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
	 * @group taxonomy
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
	 * @group taxonomy
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
	function test_category__and_var() {
		$q = new WP_Query();

		$term_id = $this->factory->category->create( array( 'slug' => 'woo', 'name' => 'WOO!' ) );
		$term_id2 = $this->factory->category->create( array( 'slug' => 'hoo', 'name' => 'HOO!' ) );
		$post_id = $this->factory->post->create();

		wp_set_post_categories( $post_id, $term_id );

		$posts = $q->query( array( 'category__and' => array( $term_id ) ) );

		$this->assertEmpty( $q->get( 'category__and' ) );
		$this->assertCount( 0, $q->get( 'category__and' ) );
		$this->assertNotEmpty( $q->get( 'category__in' ) );
		$this->assertCount( 1, $q->get( 'category__in' ) );

		$this->assertNotEmpty( $posts );
		$this->assertEquals( array( $post_id ), wp_list_pluck( $posts, 'ID' ) );

		$posts2 = $q->query( array( 'category__and' => array( $term_id, $term_id2 ) ) );
		$this->assertNotEmpty( $q->get( 'category__and' ) );
		$this->assertCount( 2, $q->get( 'category__and' ) );
		$this->assertEmpty( $q->get( 'category__in' ) );
		$this->assertCount( 0, $q->get( 'category__in' ) );

		$this->assertEmpty( $posts2 );
	}

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
	function test_tax_query_no_taxonomy() {
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

	/**
	 * @group taxonomy
	 */
	function test_term_taxonomy_id_field_no_taxonomy() {
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
	 * @ticket 28099
	 * @group taxonomy
	 */
	function test_empty_category__in() {
		$cat_id = $this->factory->category->create();
		$post_id = $this->factory->post->create();
		wp_set_post_categories( $post_id, $cat_id );

		$q1 = get_posts( array( 'category__in' => array( $cat_id ) ) );
		$this->assertNotEmpty( $q1 );
		$q2 = get_posts( array( 'category__in' => array() ) );
		$this->assertNotEmpty( $q2 );

		$tag = wp_insert_term( 'woo', 'post_tag' );
		$tag_id = $tag['term_id'];
		$slug = get_tag( $tag_id )->slug;
		wp_set_post_tags( $post_id, $slug );

		$q3 = get_posts( array( 'tag__in' => array( $tag_id ) ) );
		$this->assertNotEmpty( $q3 );
		$q4 = get_posts( array( 'tag__in' => array() ) );
		$this->assertNotEmpty( $q4 );

		$q5 = get_posts( array( 'tag_slug__in' => array( $slug ) ) );
		$this->assertNotEmpty( $q5 );
		$q6 = get_posts( array( 'tag_slug__in' => array() ) );
		$this->assertNotEmpty( $q6 );
	}

	/**
	 * @group taxonomy
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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

	/**
	 * @group taxonomy
	 */
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
	 * @group taxonomy
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
	 * @group taxonomy
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

	/**
	 * @ticket 22448
	 */
	function test_the_posts_filter() {
		// Create posts and clear their caches.
		$post_ids = $this->factory->post->create_many( 10 );
		foreach ( $post_ids as $post_id )
			clean_post_cache( $post_id );

		add_filter( 'the_posts', array( $this, 'the_posts_filter' ) );

		$query = new WP_Query( array(
			'post_type' => 'post',
			'posts_per_page' => 5,
		) );

		// Sixth post added in filter
		$this->assertEquals( 6, count( $query->posts ) );
		$this->assertEquals( 6, $query->post_count );

		foreach ( $query->posts as $post ) {

			// posts are WP_Post objects
			$this->assertTrue( is_a( $post, 'WP_Post' ) );

			// filters are raw
			$this->assertEquals( 'raw', $post->filter );

			// custom data added in the_posts filter is preserved
			$this->assertEquals( array( $post->ID, 'custom data' ), $post->custom_data );
		}

		remove_filter( 'the_posts', array( $this, 'the_posts_filter' ) );
	}

	/**
	 * Use with the_posts filter, appends a post and adds some custom data.
	 */
	function the_posts_filter( $posts ) {
		$posts[] = clone $posts[0];

		// Add some custom data to each post.
		foreach ( $posts as $key => $post )
			$posts[ $key ]->custom_data = array( $post->ID, 'custom data' );

		return $posts;
	}

	function test_post__in_ordering() {
		$post_id1 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id2 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );
		$post_id3 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id4 = $this->factory->post->create( array(
			'post_type' => 'page',
			'post_parent' => $post_id2,
			'menu_order' => rand( 1, 100 )
		) );
		$post_id5 = $this->factory->post->create( array( 'post_type' => 'page', 'menu_order' => rand( 1, 100 ) ) );

		$ordered = array( $post_id2, $post_id4, $post_id3, $post_id1, $post_id5 );

		$q = new WP_Query( array(
			'post_type' => 'any',
			'post__in' => $ordered,
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $q->posts, 'ID' ) );
	}

	function test_post__in_attachment_ordering() {
		$post_id = $this->factory->post->create();
		$att_ids = array();
		$file = DIR_TESTDATA . '/images/canola.jpg';
		$att_ids[1] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[2] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[3] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[4] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );
		$att_ids[5] = $this->factory->attachment->create_object( $file, $post_id, array(
			'post_mime_type' => 'image/jpeg',
			'menu_order' => rand( 1, 100 )
		) );

		$ordered = array( $att_ids[5], $att_ids[1], $att_ids[4], $att_ids[3], $att_ids[2] );

		$attached = new WP_Query( array(
			'post__in' => $ordered,
			'post_type' => 'attachment',
			'post_parent' => $post_id,
			'post_mime_type' => 'image',
			'post_status' => 'inherit',
			'posts_per_page' => '-1',
			'orderby' => 'post__in'
		) );
		$this->assertEqualSets( $ordered, wp_list_pluck( $attached->posts, 'ID' ) );
	}

	function test_post_status() {
		$statuses1 = get_post_stati();
		$this->assertContains( 'auto-draft', $statuses1 );

		$statuses2 = get_post_stati( array( 'exclude_from_search' => true ) );
		$this->assertContains( 'auto-draft', $statuses2 );

		$statuses3 = get_post_stati( array( 'exclude_from_search' => false ) );
		$this->assertNotContains( 'auto-draft', $statuses3 );

		$q1 = new WP_Query( array( 'post_status' => 'any' ) );
		$this->assertContains( "post_status <> 'auto-draft'", $q1->request );

		$q2 = new WP_Query( array( 'post_status' => 'any, auto-draft' ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q2->request );

		$q3 = new WP_Query( array( 'post_status' => array( 'any', 'auto-draft' ) ) );
		$this->assertNotContains( "post_status <> 'auto-draft'", $q3->request );
	}

	/**
	 *
	 * @ticket 17065
	 */
	function test_orderby_array() {
		global $wpdb;

		$q1 = new WP_Query( array(
			'orderby' => array(
				'type' => 'DESC',
				'name' => 'ASC'
			)
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_type DESC, $wpdb->posts.post_name ASC",
			$q1->request
		);

		$q2 = new WP_Query( array( 'orderby' => array() ) );
		$this->assertNotContains( 'ORDER BY', $q2->request );
		$this->assertNotContains( 'ORDER', $q2->request );

		$q3 = new WP_Query( array( 'post_type' => 'post' ) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date DESC",
			$q3->request
		);

		$q4 = new WP_Query( array( 'post_type' => 'post' ) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date DESC",
			$q4->request
		);
	}

	/**
	 *
	 * @ticket 17065
	 */
	function test_order() {
		global $wpdb;

		$q1 = new WP_Query( array(
			'orderby' => array(
				'post_type' => 'foo'
			)
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_type DESC",
			$q1->request
		);

		$q2 = new WP_Query( array(
			'orderby' => 'title',
			'order'   => 'foo'
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_title DESC",
			$q2->request
		);

		$q3 = new WP_Query( array(
			'order' => 'asc'
		) );
		$this->assertContains(
			"ORDER BY $wpdb->posts.post_date ASC",
			$q3->request
		);
	}

	/**
	 * @ticket 29629
	 */
	function test_orderby() {
		// 'rand' is a valid value
		$q = new WP_Query( array( 'orderby' => 'rand' ) );
		$this->assertContains( 'ORDER BY RAND()', $q->request );
		$this->assertNotContains( 'ASC', $q->request );
		$this->assertNotContains( 'DESC', $q->request );

		// This isn't allowed
		$q2 = new WP_Query( array( 'order' => 'rand' ) );
		$this->assertContains( 'ORDER BY', $q2->request );
		$this->assertNotContains( 'RAND()', $q2->request );
		$this->assertContains( 'DESC', $q2->request );

		// 'none' is a valid value
		$q3 = new WP_Query( array( 'orderby' => 'none' ) );
		$this->assertNotContains( 'ORDER BY', $q3->request );
		$this->assertNotContains( 'DESC', $q3->request );
		$this->assertNotContains( 'ASC', $q3->request );

		// false is a valid value
		$q4 = new WP_Query( array( 'orderby' => false ) );
		$this->assertNotContains( 'ORDER BY', $q4->request );
		$this->assertNotContains( 'DESC', $q4->request );
		$this->assertNotContains( 'ASC', $q4->request );

		// empty array() is a valid value
		$q5 = new WP_Query( array( 'orderby' => array() ) );
		$this->assertNotContains( 'ORDER BY', $q5->request );
		$this->assertNotContains( 'DESC', $q5->request );
		$this->assertNotContains( 'ASC', $q5->request );
	}
}
