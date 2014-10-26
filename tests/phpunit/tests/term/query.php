<?php

/**
 * @group taxonomy
 */
class Tests_Tax_Query extends WP_UnitTestCase {
	protected $q;

	public function setUp() {
		parent::setUp();
		unset( $this->q );
		$this->q = new WP_Query();
	}

	public function test_construct_with_relation_default() {
		$tq = new WP_Tax_Query( array() );
		$this->assertSame( 'AND', $tq->relation );
	}

	public function test_construct_with_relation_or_lowercase() {
		$tq = new WP_Tax_Query( array(
			'relation' => 'or',
		) );
		$this->assertSame( 'OR', $tq->relation );
	}

	public function test_construct_with_relation_or_uppercase() {
		$tq = new WP_Tax_Query( array(
			'relation' => 'OR',
		) );
		$this->assertSame( 'OR', $tq->relation );
	}

	public function test_construct_with_relation_other() {
		$tq = new WP_Tax_Query( array(
			'relation' => 'foo',
		) );
		$this->assertSame( 'AND', $tq->relation );
	}

	public function test_construct_fill_missing_query_params() {
		$tq = new WP_Tax_Query( array(
			array(),
		) );

		$expected = array(
			'taxonomy' => '',
			'terms' => array(),
			'include_children' => true,
			'field' => 'term_id',
			'operator' => 'IN',
		);

		$this->assertEquals( $expected, $tq->queries[0] );
	}

	public function test_construct_fill_missing_query_params_merge_with_passed_values() {
		$tq = new WP_Tax_Query( array(
			array(
				'taxonomy' => 'foo',
				'include_children' => false,
				'foo' => 'bar',
			),
		) );

		$expected = array(
			'taxonomy' => 'foo',
			'terms' => array(),
			'include_children' => false,
			'field' => 'term_id',
			'operator' => 'IN',
			'foo' => 'bar',
		);

		$this->assertEquals( $expected, $tq->queries[0] );
	}

	public function test_construct_cast_terms_to_array() {
		$tq = new WP_Tax_Query( array(
			array(
				'terms' => 'foo',
			),
		) );

		$this->assertEquals( array( 'foo', ), $tq->queries[0]['terms'] );
	}

	/**
	 * @ticket 30117
	 */
	public function test_construct_empty_strings_array_members_should_be_discarded() {
		$q = new WP_Tax_Query( array(
			'',
			array(
				'taxonomy' => 'post_tag',
				'terms' => 'foo',
			),
		) );

		$this->assertSame( 1, count( $q->queries ) );
	}

	public function test_transform_query_terms_empty() {
		$tq = new WP_Tax_Query( array(
			array(),
		) );
		$query = $tq->queries[0];

		$tq->transform_query( $tq->queries[0], 'term_id' );

		$this->assertSame( $query, $tq->queries[0] );
	}

	public function test_transform_query_field_same_as_resulting_field() {
		$tq = new WP_Tax_Query( array(
			array(
				'field' => 'term_id',
			),
		) );
		$query = $tq->queries[0];

		$tq->transform_query( $tq->queries[0], 'term_id' );

		$this->assertSame( $query, $tq->queries[0] );
	}

	public function test_transform_query_resulting_field_sanitized() {
		$t1 = $this->factory->category->create( array( 'slug' => 'foo', ) );
		$t2 = $this->factory->category->create( array( 'slug' => 'bar', ) );
		$p = $this->factory->post->create();
		wp_set_post_categories( $p, $t1 );

		$tq1 = new WP_Tax_Query( array(
			array(
				'terms' => array( 'foo' ),
				'field' => 'slug',
			),
		) );
		$tq1->transform_query( $tq1->queries[0], 'term_taxonomy_id' );

		$tq2 = new WP_Tax_Query( array(
			array(
				'terms' => array( 'foo' ),
				'field' => 'slug',
			),
		) );
		$tq2->transform_query( $tq2->queries[0], 'TERM_ ta%xonomy_id' );

		$this->assertSame( $tq1->queries[0], $tq2->queries[0] );
	}

	public function test_transform_query_field_slug() {
		$t1 = $this->factory->category->create( array( 'slug' => 'foo', ) );
		$p = $this->factory->post->create();
		$tt_ids = wp_set_post_categories( $p, $t1 );

		$tq = new WP_Tax_Query( array(
			array(
				'taxonomy' => 'category',
				'terms' => array( 'foo' ),
				'field' => 'slug',
			),
		) );
		$tq->transform_query( $tq->queries[0], 'term_taxonomy_id' );

		$this->assertSame( $tt_ids, $tq->queries[0]['terms'] );
		$this->assertSame( 'term_taxonomy_id', $tq->queries[0]['field'] );
	}

	public function test_transform_query_field_name() {
		$t1 = $this->factory->category->create( array( 'slug' => 'foo', 'name' => 'Foo', ) );
		$p = $this->factory->post->create();
		$tt_ids = wp_set_post_categories( $p, $t1 );

		$tq = new WP_Tax_Query( array(
			array(
				'taxonomy' => 'category',
				'terms' => array( 'Foo' ),
				'field' => 'name',
			),
		) );
		$tq->transform_query( $tq->queries[0], 'term_taxonomy_id' );

		$this->assertSame( $tt_ids, $tq->queries[0]['terms'] );
		$this->assertSame( 'term_taxonomy_id', $tq->queries[0]['field'] );
	}

	public function test_transform_query_field_term_taxonomy_id() {
		$t1 = $this->factory->category->create( array( 'slug' => 'foo', 'name' => 'Foo', ) );
		$p = $this->factory->post->create();
		$tt_ids = wp_set_post_categories( $p, $t1 );

		$tq = new WP_Tax_Query( array(
			array(
				'taxonomy' => 'category',
				'terms' => $tt_ids,
				'field' => 'term_taxonomy_id',
			),
		) );
		$tq->transform_query( $tq->queries[0], 'term_id' );

		$this->assertEquals( array( $t1 ), $tq->queries[0]['terms'] );
		$this->assertSame( 'term_id', $tq->queries[0]['field'] );
	}

	public function test_transform_query_field_term_taxonomy_default() {
		$t1 = $this->factory->category->create( array( 'slug' => 'foo', 'name' => 'Foo', ) );
		$p = $this->factory->post->create();
		$tt_ids = wp_set_post_categories( $p, $t1 );

		$tq = new WP_Tax_Query( array(
			array(
				'taxonomy' => 'category',
				'terms' => array( $t1 ),
				'field' => 'foo', // Anything defaults to term_id
			),
		) );
		$tq->transform_query( $tq->queries[0], 'term_taxonomy_id' );

		$this->assertEquals( $tt_ids, $tq->queries[0]['terms'] );
		$this->assertSame( 'term_taxonomy_id', $tq->queries[0]['field'] );
	}

	public function test_transform_query_nonexistent_terms() {
		$tq = new WP_Tax_Query( array(
			array(
				'terms' => array( 'foo' ),
				'field' => 'slug',
				'operator' => 'AND',
			),
		) );
		$tq->transform_query( $tq->queries[0], 'term_taxonomy_id' );

		$this->assertTrue( is_wp_error( $tq->queries[0] ) );
	}

	/**
	 * @ticket 18105
	 */
	public function test_get_sql_relation_or_operator_in() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$tq = new WP_Tax_Query( array(
			'relation' => 'OR',
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t1,
			),
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t2,
			),
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t3,
			),
		) );

		global $wpdb;
		$sql = $tq->get_sql( $wpdb->posts, 'ID' );

		// Only one JOIN is required with OR + IN.
		$this->assertSame( 1, substr_count( $sql['join'], 'JOIN' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 18105
	 */
	public function test_get_sql_relation_and_operator_in() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$tq = new WP_Tax_Query( array(
			'relation' => 'AND',
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t1,
			),
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t2,
			),
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t3,
			),
		) );

		global $wpdb;
		$sql = $tq->get_sql( $wpdb->posts, 'ID' );

		$this->assertSame( 3, substr_count( $sql['join'], 'JOIN' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 18105
	 */
	public function test_get_sql_nested_relation_or_operator_in() {
		register_taxonomy( 'wptests_tax', 'post' );

		$t1 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t2 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );
		$t3 = $this->factory->term->create( array(
			'taxonomy' => 'wptests_tax',
		) );

		$tq = new WP_Tax_Query( array(
			'relation' => 'OR',
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'terms' => $t1,
			),
			array(
				'relation' => 'OR',
				array(
					'taxonomy' => 'wptests_tax',
					'field' => 'term_id',
					'terms' => $t2,
				),
				array(
					'taxonomy' => 'wptests_tax',
					'field' => 'term_id',
					'terms' => $t3,
				),
			),
		) );

		global $wpdb;
		$sql = $tq->get_sql( $wpdb->posts, 'ID' );

		$this->assertSame( 2, substr_count( $sql['join'], 'JOIN' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 29738
	 */
	public function test_get_sql_operator_not_in_empty_terms() {
		register_taxonomy( 'wptests_tax', 'post' );

		$tq = new WP_Tax_Query( array(
			'relation' => 'OR',
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'operator' => 'NOT IN',
				'terms' => array(),
			),
		) );

		global $wpdb;
		$expected = array(
			'join' => '',
			'where' => '',
		);

		$this->assertSame( $expected, $tq->get_sql( $wpdb->posts, 'ID' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}

	/**
	 * @ticket 29738
	 */
	public function test_get_sql_operator_and_empty_terms() {
		register_taxonomy( 'wptests_tax', 'post' );

		$tq = new WP_Tax_Query( array(
			'relation' => 'OR',
			array(
				'taxonomy' => 'wptests_tax',
				'field' => 'term_id',
				'operator' => 'AND',
				'terms' => array(),
			),
		) );

		global $wpdb;
		$expected = array(
			'join' => '',
			'where' => '',
		);

		$this->assertSame( $expected, $tq->get_sql( $wpdb->posts, 'ID' ) );

		_unregister_taxonomy( 'wptests_tax' );
	}
}
