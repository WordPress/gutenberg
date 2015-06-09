<?php
/**
 * Test WP_Meta_Query, in wp-includes/meta.php
 *
 * See tests/post/query.php for tests that involve post queries.
 *
 * @group meta
 */
class Tests_Meta_Query extends WP_UnitTestCase {

	public function test_empty_meta_query_param() {
		$query = new WP_Meta_Query();
		$this->assertSame( null, $query->relation );
	}

	public function test_default_relation() {
		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ) ) );
		$this->assertEquals( 'AND', $query->relation );
	}

	public function test_set_relation() {

		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ), 'relation' => 'AND' ) );

		$this->assertEquals( 'AND', $query->relation );

		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ), 'relation' => 'OR' ) );

		$this->assertEquals( 'OR', $query->relation );
	}

	/**
	 * Non-arrays should not be added to the queries array.
	 */
	public function test_invalid_query_clauses() {
		$query = new WP_Meta_Query( array(
			'foo', // empty string
			5, // int
			false, // bool
			array(),
		) );

		$this->assertSame( array(), $query->queries );
	}

	/**
	 * Test all key only meta queries use the same INNER JOIN when using relation=OR
	 *
	 * @ticket 19729
	 */
	public function test_single_inner_join_for_keys_only() {

		global $wpdb;

		$query = new WP_Meta_Query( array(
			array( 'key' => 'abc' ),
			array( 'key' => 'def' ),
			'relation' => 'OR'
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID' );

		$this->assertEquals( 1, substr_count( $sql['join'], 'INNER JOIN' ) );

		// also check mixing key and key => value

		$query = new WP_Meta_Query( array(
			array( 'key' => 'abc' ),
			array( 'key' => 'def' ),
			array( 'key' => 'ghi', 'value' => 'abc' ),
			'relation' => 'OR'
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID' );

		$this->assertEquals( 1, substr_count( $sql['join'], 'INNER JOIN' ) );
	}

	/**
	 * WP_Query-style query must be at index 0 for order_by=meta_value to work.
	 */
	public function test_parse_query_vars_simple_query_index_0() {
		$qv = array(
			'meta_query' => array(
				array(
					'key' => 'foo1',
					'compare' => 'baz1',
					'value' => 'bar1',
				),
			),
			'meta_key' => 'foo',
			'meta_compare' => 'bar',
			'meta_value' => 'baz',
		);

		$query = new WP_Meta_Query();
		$query->parse_query_vars( $qv );

		$expected0 = array(
			'key' => 'foo',
			'compare' => 'bar',
			'value' => 'baz',
		);
		$this->assertEquals( $expected0, $query->queries[0] );

		$expected1 = array(
			'relation' => 'OR',
			array(
				'key' => 'foo1',
				'compare' => 'baz1',
				'value' => 'bar1',
			),
		);
		$this->assertEquals( $expected1, $query->queries[1] );
	}

	/**
	 * When no meta_value is provided, no 'value' should be set in the parsed queries.
	 */
	public function test_parse_query_vars_with_no_meta_value() {
		$qv = array(
			'meta_key' => 'foo',
			'meta_type' => 'bar',
			'meta_compare' => '=',
		);

		$query = new WP_Meta_Query();
		$query->parse_query_vars( $qv );

		$this->assertTrue( ! isset( $query->queries[0]['value'] ) );
	}

	/**
	 * WP_Query sets meta_value to '' by default. It should be removed by parse_query_vars().
	 */
	public function test_parse_query_vars_with_default_meta_compare() {
		$qv = array(
			'meta_key' => 'foo',
			'meta_type' => 'bar',
			'meta_compare' => '=',
			'meta_value' => '',
		);

		$query = new WP_Meta_Query();
		$query->parse_query_vars( $qv );

		$this->assertTrue( ! isset( $query->queries[0]['value'] ) );
	}

	/**
	 * Test the conversion between "WP_Query" style meta args (meta_value=x&meta_key=y)
	 * to a meta query array.
	 */
	public function test_parse_query_vars() {

		$query = new WP_Meta_Query();

		// just meta_value
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'abc',
			),
		);
		$query->parse_query_vars( array(
			'meta_key' => 'abc',
		) );
		$this->assertEquals( $expected, $query->queries );

		// meta_key & meta_value
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'abc',
				'value' => 'def',
			),
		);
		$query->parse_query_vars( array(
			'meta_key' => 'abc',
			'meta_value' => 'def',
		) );
		$this->assertEquals( $expected, $query->queries );

		// meta_compare
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'abc',
				'compare' => '=>',
			),
		);
		$query->parse_query_vars( array(
			'meta_key' => 'abc',
			'meta_compare' => '=>',
		) );
		$this->assertEquals( $expected, $query->queries );
	}

	/**
	 * @ticket 23033
	 */
	public function test_get_cast_for_type() {
		$query = new WP_Meta_Query();
		$this->assertEquals( 'BINARY', $query->get_cast_for_type( 'BINARY' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'CHAR' ) );
		$this->assertEquals( 'DATE', $query->get_cast_for_type( 'DATE' ) );
		$this->assertEquals( 'DATETIME', $query->get_cast_for_type( 'DATETIME' ) );
		$this->assertEquals( 'SIGNED', $query->get_cast_for_type( 'SIGNED' ) );
		$this->assertEquals( 'UNSIGNED', $query->get_cast_for_type( 'UNSIGNED' ) );
		$this->assertEquals( 'TIME', $query->get_cast_for_type( 'TIME' ) );
		$this->assertEquals( 'SIGNED', $query->get_cast_for_type( 'NUMERIC' ) );
		$this->assertEquals( 'NUMERIC(10)', $query->get_cast_for_type( 'NUMERIC(10)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'NUMERIC( 10)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'NUMERIC( 10 )' ) );
		$this->assertEquals( 'NUMERIC(10, 5)', $query->get_cast_for_type( 'NUMERIC(10, 5)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'NUMERIC(10,  5)' ) );
		$this->assertEquals( 'NUMERIC(10,5)', $query->get_cast_for_type( 'NUMERIC(10,5)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'NUMERIC( 10, 5 )' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'NUMERIC(10, 5 )' ) );
		$this->assertEquals( 'DECIMAL', $query->get_cast_for_type( 'DECIMAL' ) );
		$this->assertEquals( 'DECIMAL(10)', $query->get_cast_for_type( 'DECIMAL(10)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'DECIMAL( 10 )' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'DECIMAL( 10)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'DECIMAL(10 )' ) );
		$this->assertEquals( 'DECIMAL(10, 5)', $query->get_cast_for_type( 'DECIMAL(10, 5)' ) );
		$this->assertEquals( 'DECIMAL(10,5)', $query->get_cast_for_type( 'DECIMAL(10,5)' ) );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'DECIMAL(10,  5)' ) );

		$this->assertEquals( 'CHAR', $query->get_cast_for_type() );
		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'ANYTHING ELSE' ) );
	}

	public function test_sanitize_query_single_query() {
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_multiple_first_order_queries_relation_default() {
		$expected = array(
			'relation' => 'AND',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_multiple_first_order_queries_relation_or() {
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			'relation' => 'OR',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_multiple_first_order_queries_relation_or_lowercase() {
		$expected = array(
			'relation' => 'OR',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			'relation' => 'or',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_multiple_first_order_queries_invalid_relation() {
		$expected = array(
			'relation' => 'AND',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			'relation' => 'FOO',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'key' => 'foo2',
				'value' => 'bar2',
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_single_query_which_is_a_nested_query() {
		$expected = array(
			'relation' => 'OR',
			array(
				'relation' => 'AND',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar2',
				),
			)
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar2',
				),
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	public function test_sanitize_query_multiple_nested_queries() {
		$expected = array(
			'relation' => 'OR',
			array(
				'relation' => 'AND',
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar2',
				),
			),
			array(
				'relation' => 'AND',
				array(
					'key' => 'foo3',
					'value' => 'bar3',
				),
				array(
					'key' => 'foo4',
					'value' => 'bar4',
				),
			),
		);

		$q = new WP_Meta_Query();
		$found = $q->sanitize_query( array(
			'relation' => 'OR',
			array(
				array(
					'key' => 'foo',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar2',
				),
			),
			array(
				array(
					'key' => 'foo3',
					'value' => 'bar3',
				),
				array(
					'key' => 'foo4',
					'value' => 'bar4',
				),
			),
		) );

		$this->assertEquals( $expected, $found );
	}

	/**
	 * Invalid $type will fail to get a table from _get_meta_table()
	 */
	public function test_get_sql_invalid_type() {
		$query = new WP_Meta_Query();
		$this->assertFalse( $query->get_sql( 'foo', 'foo', 'foo' ) );
	}

	/**
	 * @ticket 22096
	 */
	public function test_empty_value_sql() {
		global $wpdb;

		$query = new WP_Meta_Query();

		$the_complex_query['meta_query'] = array(
			array( 'key' => 'my_first_key', 'value' => 'my_amazing_value' ),
			array( 'key' => 'my_second_key', 'compare' => 'NOT EXISTS' ),
			array( 'key' => 'my_third_key', 'value' => array( ), 'compare' => 'IN' ),
		);

		$query->parse_query_vars( $the_complex_query );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertEquals( 3, substr_count( $sql['join'], 'JOIN' ) );
	}

	/**
	 * @ticket 22967
	 */
	public function test_null_value_sql() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array( 'key' => 'abc', 'value' => null, 'compare' => '=' )
		) );
		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertEquals( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) = ''" ) );
	}

	/**
	 * "key only queries" are queries that don't need to match a value, so
	 * they can be grouped together into a single clause without JOINs
	 */
	public function test_get_sql_key_only_queries() {
		global $wpdb;

		$query1 = new WP_Meta_Query( array(
			'relation' => 'OR',

			// Empty 'compare'
			array(
				'key' => 'foo',
			),

			// Non-empty 'compare'
			array(
				'key' => 'bar',
				'compare' => '<',
			),

			// NOT EXISTS
			array(
				'key' => 'baz',
				'compare' => 'NOT EXISTS',
			),

			// Has a value
			array(
				'key' => 'barry',
				'value' => 'foo',
			),

			// Has no key
			array(
				'value' => 'bar',
			),
		) );

		$sql = $query1->get_sql( 'post', $wpdb->posts, 'ID', $this );

		// 'foo' and 'bar' should be queried against the non-aliased table
		$this->assertSame( 1, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'foo'" ) );
		$this->assertSame( 1, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'bar'" ) );

		// NOT EXISTS compare queries are not key-only so should not be non-aliased
		$this->assertSame( 0, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'baz'" ) );

		// 'AND' queries don't have key-only queries
		$query2 = new WP_Meta_Query( array(
			'relation' => 'AND',

			// Empty 'compare'
			array(
				'key' => 'foo',
			),

			// Non-empty 'compare'
			array(
				'key' => 'bar',
				'compare' => '<',
			),
		) );

		$sql = $query2->get_sql( 'post', $wpdb->posts, 'ID', $this );

		// Only 'foo' should be queried against the non-aliased table
		$this->assertSame( 1, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'foo'" ) );
		$this->assertSame( 0, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'bar'" ) );
	}

	/**
	 * Key-only and regular queries should have the key trimmed
	 */
	public function test_get_sql_trim_key() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => '  foo  ',
			),
			array(
				'key' => '  bar  ',
				'value' => 'value',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "meta_key = 'foo'" ) );
		$this->assertSame( 1, substr_count( $sql['where'], "meta_key = 'bar'" ) );
	}

	public function test_convert_null_value_to_empty_string() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => null,
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) = ''" ) );
	}

	public function test_get_sql_convert_lowercase_compare_to_uppercase() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
				'compare' => 'regExp',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "REGEXP" ) );
	}

	public function test_get_sql_empty_meta_compare_with_array_value() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => array( 'bar', 'baz' ),
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) IN" ) );
	}

	public function test_get_sql_empty_meta_compare_with_non_array_value() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) =" ) );
	}

	public function test_get_sql_invalid_meta_compare() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
				'compare' => 'INVALID COMPARE',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) =" ) );
	}

	/**
	 * This is the clause that ensures that empty arrays are not valid queries.
	 */
	public function test_get_sql_null_value_and_empty_key_should_not_have_table_join() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		// There should be no JOIN against an aliased table.
		$this->assertSame( 0, substr_count( $sql['join'], "AS mt" ) );
	}

	public function test_get_sql_compare_array_comma_separated_values() {
		global $wpdb;

		// Single value.
		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'compare' => 'IN',
				'value' => 'bar',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "('bar')" ) );

		// Multiple values, no spaces.
		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'compare' => 'IN',
				'value' => 'bar,baz',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "('bar','baz')" ) );

		// Multiple values, spaces.
		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'compare' => 'IN',
				'value' => 'bar,baz,   barry',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "('bar','baz','barry')" ) );
	}

	public function test_get_sql_compare_array() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'compare' => 'IN',
				'value' => array( 'bar', 'baz' ),
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "('bar','baz')" ) );
	}

	/**
	 * Non-array values are trimmed. @todo Why?
	 */
	public function test_get_sql_trim_string_value() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array(
				'key' => 'foo',
				'value' => '  bar  ',
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertSame( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) = 'bar'" ) );
	}

	public function test_not_exists() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			'relation' => 'OR',
			array(
				'key' => 'exclude',
				'compare' => 'NOT EXISTS'
			),
			array(
				'key' => 'exclude',
				'compare' => '!=',
				'value' => '1'
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );
		$this->assertNotContains( "{$wpdb->postmeta}.meta_key = 'exclude'\nOR", $sql['where'] );
		$this->assertContains( "{$wpdb->postmeta}.post_id IS NULL", $sql['where'] );
	}

	public function test_empty_compare() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			'relation' => 'OR',
			array(
				'key' => 'exclude',
				'compare' => ''
			),
			array(
				'key' => 'exclude',
				'compare' => '!=',
				'value' => '1'
			),
		) );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		// Use regex because we don't care about the whitespace before OR.
		$this->assertRegExp( "/{$wpdb->postmeta}\.meta_key = \'exclude\'\s+OR/", $sql['where'] );
		$this->assertNotContains( "{$wpdb->postmeta}.post_id IS NULL", $sql['where'] );
	}

	/**
	 * @group 32592
	 */
	public function test_has_or_relation_should_return_false() {
		$q = new WP_Meta_Query( array(
			'relation' => 'AND',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'relation' => 'AND',
				array(
					'key' => 'foo1',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar',
				),
			),
		) );

		$this->assertFalse( $q->has_or_relation() );
	}

	/**
	 * @group 32592
	 */
	public function test_has_or_relation_should_return_true_for_top_level_or() {
		$q = new WP_Meta_Query( array(
			'relation' => 'OR',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'relation' => 'AND',
				array(
					'key' => 'foo1',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar',
				),
			),
		) );

		$this->assertTrue( $q->has_or_relation() );
	}

	/**
	 * @group 32592
	 */
	public function test_has_or_relation_should_return_true_for_nested_or() {
		$q = new WP_Meta_Query( array(
			'relation' => 'AND',
			array(
				'key' => 'foo',
				'value' => 'bar',
			),
			array(
				'relation' => 'OR',
				array(
					'key' => 'foo1',
					'value' => 'bar',
				),
				array(
					'key' => 'foo2',
					'value' => 'bar',
				),
			),
		) );

		$this->assertTrue( $q->has_or_relation() );
	}
}
