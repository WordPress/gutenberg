<?php
/**
 * Test WP_Meta_Query, in wp-includes/meta.php
 *
 * @group meta
 */
class Tests_Meta_Query extends WP_UnitTestCase {

	function test_default_relation() {
		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ) ) );

		$this->assertEquals( 'AND', $query->relation );
	}

	function test_set_relation() {

		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ), 'relation' => 'AND' ) );

		$this->assertEquals( 'AND', $query->relation );

		$query = new WP_Meta_Query( array( array( 'key' => 'abc' ), 'relation' => 'OR' ) );

		$this->assertEquals( 'OR', $query->relation );
	}

	/**
	 * Test all key only meta queries use the same INNER JOIN when using relation=OR
	 *
	 * @ticket 19729
	 */
	function test_single_inner_join_for_keys_only() {

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

		$this->assertEquals( 2, substr_count( $sql['join'], 'INNER JOIN' ) );
	}

	/**
	 * Test the conversion between "WP_Query" style meta args (meta_value=x&meta_key=y)
	 * to a meta query array
	 */
	function test_parse_query_vars() {

		$query = new WP_Meta_Query();

		// just meta_value
		$query->parse_query_vars( array( 'meta_key' => 'abc' ) );

		$this->assertEquals( array( array( 'key' => 'abc' ) ), $query->queries );

		// meta_key & meta_value
		$query->parse_query_vars( array( 'meta_key' => 'abc', 'meta_value' => 'def' ) );

		$this->assertEquals( array( array( 'key' => 'abc', 'value' => 'def' ) ), $query->queries );

		// meta_compare
		$query->parse_query_vars( array( 'meta_key' => 'abc', 'meta_compare' => '=>' ) );

		$this->assertEquals( array( array( 'key' => 'abc', 'compare' => '=>' ) ), $query->queries );
	}

	/**
	 * @ticket 22096
	 */
	function test_empty_value_sql() {
		global $wpdb;

		$query = new WP_Meta_Query();

		$the_complex_query['meta_query'] = array(
			array( 'key' => 'my_first_key', 'value' => 'my_amazing_value' ),
			array( 'key' => 'my_second_key', 'compare' => 'NOT EXISTS' ),
			array( 'key' => 'my_third_key', 'value' => array( ), 'compare' => 'IN' ),
		);

		$query->parse_query_vars( $the_complex_query );

		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		// We should have 2 joins - one for my_first_key and one for my_second_key
		$this->assertEquals( 2, substr_count( $sql['join'], 'INNER JOIN' ) );

		// The WHERE should check my_third_key against an unaliased table
		$this->assertEquals( 1, substr_count( $sql['where'], "$wpdb->postmeta.meta_key = 'my_third_key'" ) );

	}

	/**
	 * @ticket 22967
	 */
	function test_null_value_sql() {
		global $wpdb;

		$query = new WP_Meta_Query( array(
			array( 'key' => 'abc', 'value' => null, 'compare' => '=' )
		) );
		$sql = $query->get_sql( 'post', $wpdb->posts, 'ID', $this );

		$this->assertEquals( 1, substr_count( $sql['where'], "CAST($wpdb->postmeta.meta_value AS CHAR) = '')" ) );
	}

	/**
	 * @ticket 23033
	 */
	function test_get_cast_for_type() {
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

		$this->assertEquals( 'CHAR', $query->get_cast_for_type( 'ANYTHING ELSE' ) );
	}

	function test_not_exists() {
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

	function test_empty_compare() {
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
		$this->assertContains( "{$wpdb->postmeta}.meta_key = 'exclude'\nOR", $sql['where'] );
		$this->assertNotContains( "{$wpdb->postmeta}.post_id IS NULL", $sql['where'] );
	}
}
