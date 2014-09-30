<?php

/**
 * Tests for public methods of WP_Date_Query.
 *
 * See query/dateQuery.php for tests that require WP_Query.
 *
 * @group datequery
 * @group date
 */
class Tests_WP_Date_Query extends WP_UnitTestCase {
	public function test_construct_date_query_empty() {
		$q = new WP_Date_Query( array() );
		$this->assertSame( 'AND', $q->relation );
		$this->assertSame( 'post_date', $q->column );
		$this->assertSame( '=', $q->compare );
		$this->assertSame( array(), $q->queries );
	}

	public function test_construct_date_query_non_array() {
		$q = new WP_Date_Query( 'foo' );
		$this->assertSame( 'AND', $q->relation );
		$this->assertSame( 'post_date', $q->column );
		$this->assertSame( '=', $q->compare );
		$this->assertSame( array(), $q->queries );
	}

	public function test_construct_relation_or_lowercase() {
		$q = new WP_Date_Query( array(
			'relation' => 'or',
		) );

		$this->assertSame( 'OR', $q->relation );
	}

	public function test_construct_relation_invalid() {
		$q = new WP_Date_Query( array(
			'relation' => 'foo',
		) );

		$this->assertSame( 'AND', $q->relation );
	}

	public function test_construct_query_not_an_array_of_arrays() {
		$q = new WP_Date_Query( array(
			'before' => array(
				'year' => 2008,
				'month' => 6,
			),
		) );

		$expected = array(
			0 => array(
				'before' => array(
					'year' => 2008,
					'month' => 6,
				),
			),
		);

		$this->assertSame( $expected, $q->queries );
	}

	public function test_construct_query_contains_non_arrays() {
		$q = new WP_Date_Query( array(
			'foo',
			'bar',
			array(
				'before' => array(
					'year' => 2008,
					'month' => 6,
				),
			),
		) );

		// Note: WP_Date_Query does not reset indexes
		$expected = array(
			2 => array(
				'before' => array(
					'year' => 2008,
					'month' => 6,
				),
			),
		);

		$this->assertSame( $expected, $q->queries );
	}

	public function test_get_compare_empty() {
		$q = new WP_Date_Query( array() );
		$this->assertSame( '=', $q->get_compare( array() ) );
	}

	public function test_get_compare_equals() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '=',
		) );
		$this->assertSame( '=', $found );
	}

	public function test_get_compare_not_equals() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '!=',
		) );
		$this->assertSame( '!=', $found );
	}

	public function test_get_compare_greater_than() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '>',
		) );
		$this->assertSame( '>', $found );
	}

	public function test_get_compare_greater_than_or_equal_to() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '>=',
		) );
		$this->assertSame( '>=', $found );
	}

	public function test_get_compare_less_than() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '<',
		) );
		$this->assertSame( '<', $found );
	}

	public function test_get_compare_less_than_or_equal_to() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => '<=',
		) );
		$this->assertSame( '<=', $found );
	}

	public function test_get_compare_in() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => 'IN',
		) );
		$this->assertSame( 'IN', $found );
	}

	public function test_get_compare_not_in() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => 'NOT IN',
		) );
		$this->assertSame( 'NOT IN', $found );
	}

	public function test_get_compare_between() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => 'BETWEEN',
		) );
		$this->assertSame( 'BETWEEN', $found );
	}

	public function test_get_compare_not_between() {
		$q = new WP_Date_Query( array() );

		$found = $q->get_compare( array(
			'compare' => 'BETWEEN',
		) );
		$this->assertSame( 'BETWEEN', $found );
	}

	public function test_validate_column_post_date() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'post_date', $q->validate_column( 'post_date' ) );
	}

	public function test_validate_column_post_date_gmt() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'post_date_gmt', $q->validate_column( 'post_date_gmt' ) );
	}

	public function test_validate_column_post_modified() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'post_modified', $q->validate_column( 'post_modified' ) );
	}

	public function test_validate_column_post_modified_gmt() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'post_modified_gmt', $q->validate_column( 'post_modified_gmt' ) );
	}

	public function test_validate_column_comment_date() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'comment_date', $q->validate_column( 'comment_date' ) );
	}

	public function test_validate_column_comment_date_gmt() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'comment_date_gmt', $q->validate_column( 'comment_date_gmt' ) );
	}

	public function test_validate_column_invalid() {
		$q = new WP_Date_Query( array() );

		$this->assertSame( 'post_date', $q->validate_column( 'foo' ) );
	}

	public function test_build_value_value_null() {
		$q = new WP_Date_Query( array() );

		$this->assertFalse( $q->build_value( 'foo', null ) );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_in() {
		$q = new WP_Date_Query( array() );

		// Single integer
		$found = $q->build_value( 'IN', 4 );
		$this->assertSame( '(4)', $found );

		// Single non-integer
		$found = $q->build_value( 'IN', 'foo' );
		$this->assertFalse( $found );

		// Array of integers
		$found = $q->build_value( 'IN', array( 1, 4, 7 ) );
		$this->assertSame( '(1,4,7)', $found );

		// Array containing non-integers
		$found = $q->build_value( 'IN', array( 1, 'foo', 7 ) );
		$this->assertSame( '(1,7)', $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_not_in() {
		$q = new WP_Date_Query( array() );

		// Single integer
		$found = $q->build_value( 'NOT IN', 4 );
		$this->assertSame( '(4)', $found );

		// Single non-integer
		$found = $q->build_value( 'NOT IN', 'foo' );
		$this->assertFalse( $found );

		// Array of integers
		$found = $q->build_value( 'NOT IN', array( 1, 4, 7 ) );
		$this->assertSame( '(1,4,7)', $found );

		// Array containing non-integers
		$found = $q->build_value( 'NOT IN', array( 1, 'foo', 7 ) );
		$this->assertSame( '(1,7)', $found );
	}

	public function test_build_value_compare_between_single_integer() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', 4 );
		$this->assertSame( '4 AND 4', $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_between_single_non_numeric() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', 'foo' );
		$this->assertFalse( $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_between_array_with_other_than_two_items() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', array( 2, 3, 4 ) );
		$this->assertFalse( $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_between_incorrect_array_key() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', array(
			2 => 4,
			3 => 5,
		) );

		$this->assertSame( '4 AND 5', $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_between_array_contains_non_numeric() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', array( 2, 'foo' ) );
		$this->assertFalse( $found );
	}

	public function test_build_value_compare_between() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'BETWEEN', array( 2, 3 ) );
		$this->assertSame( '2 AND 3', $found );
	}

	public function test_build_value_compare_not_between_single_integer() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', 4 );
		$this->assertSame( '4 AND 4', $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_not_between_single_non_numeric() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', 'foo' );
		$this->assertFalse( $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_not_between_array_with_other_than_two_items() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', array( 2, 3, 4 ) );
		$this->assertFalse( $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_not_between_incorrect_array_key() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', array(
			2 => 4,
			3 => 5,
		) );

		$this->assertSame( '4 AND 5', $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_not_between_array_contains_non_numeric() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', array( 2, 'foo' ) );
		$this->assertFalse( $found );
	}

	public function test_build_value_compare_not_between() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'NOT BETWEEN', array( 2, 3 ) );
		$this->assertSame( '2 AND 3', $found );
	}

	public function test_build_value_compare_default_value_integer() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'foo', 5 );
		$this->assertSame( 5, $found );
	}

	/**
	 * @ticket 29801
	 */
	public function test_build_value_compare_default_value_non_numeric() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_value( 'foo', 'foo' );
		$this->assertFalse( $found );
	}

	public function test_build_mysql_datetime_datetime_non_array() {
		$q = new WP_Date_Query( array() );

		// This might be a fragile test if it takes longer than 1 second to run
		$found = $q->build_mysql_datetime( 'foo' );
		$expected = gmdate( 'Y-m-d H:i:s', strtotime( current_time( 'timestamp' ) ) );
		$this->assertSame( $found, $expected );
	}

	public function test_build_mysql_datetime_default_to_max_true() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_mysql_datetime( array(
			'year' => 2011,
		), true );
		$this->assertSame( '2011-12-31 23:59:59', $found );
	}

	public function test_build_mysql_datetime_default_to_max_false() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_mysql_datetime( array(
			'year' => 2011,
		), false );
		$this->assertSame( '2011-01-01 00:00:00', $found );
	}

	public function test_build_mysql_datetime_default_to_max_default_to_false() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_mysql_datetime( array(
			'year' => 2011,
		), false );
		$this->assertSame( '2011-01-01 00:00:00', $found );
	}

	public function test_build_time_query_insufficient_time_values() {
		$q = new WP_Date_Query( array() );

		$this->assertFalse( $q->build_time_query( 'post_date', '=' ) );
	}

	public function test_build_time_query_compare_in() {
		$q = new WP_Date_Query( array() );

		// Just hour
		$found = $q->build_time_query( 'post_date', 'IN', array( 1, 2 ) );
		$this->assertSame( 'HOUR( post_date ) IN (1,2)', $found );

		// Skip minute
		$found = $q->build_time_query( 'post_date', 'IN', array( 1, 2 ), null, 6 );
		$this->assertSame( 'HOUR( post_date ) IN (1,2) AND SECOND( post_date ) IN (6)', $found );

		// All three
		$found = $q->build_time_query( 'post_date', 'IN', array( 1, 2 ), array( 3, 4, 5 ), 6 );
		$this->assertSame( 'HOUR( post_date ) IN (1,2) AND MINUTE( post_date ) IN (3,4,5) AND SECOND( post_date ) IN (6)', $found );
	}

	public function test_build_time_query_compare_not_in() {
		$q = new WP_Date_Query( array() );

		// Just hour
		$found = $q->build_time_query( 'post_date', 'NOT IN', array( 1, 2 ) );
		$this->assertSame( 'HOUR( post_date ) NOT IN (1,2)', $found );

		// Skip minute
		$found = $q->build_time_query( 'post_date', 'NOT IN', array( 1, 2 ), null, 6 );
		$this->assertSame( 'HOUR( post_date ) NOT IN (1,2) AND SECOND( post_date ) NOT IN (6)', $found );

		// All three
		$found = $q->build_time_query( 'post_date', 'NOT IN', array( 1, 2 ), array( 3, 4, 5 ), 6 );
		$this->assertSame( 'HOUR( post_date ) NOT IN (1,2) AND MINUTE( post_date ) NOT IN (3,4,5) AND SECOND( post_date ) NOT IN (6)', $found );
	}

	public function test_build_time_query_compare_between() {
		$q = new WP_Date_Query( array() );

		// Just hour
		$found = $q->build_time_query( 'post_date', 'BETWEEN', array( 1, 2 ) );
		$this->assertSame( 'HOUR( post_date ) BETWEEN 1 AND 2', $found );

		// Skip minute
		$found = $q->build_time_query( 'post_date', 'BETWEEN', array( 1, 2 ), null, array( 6, 7 ) );
		$this->assertSame( 'HOUR( post_date ) BETWEEN 1 AND 2 AND SECOND( post_date ) BETWEEN 6 AND 7', $found );

		// All three
		$found = $q->build_time_query( 'post_date', 'BETWEEN', array( 1, 2 ), array( 3, 4 ), array( 6, 7 ) );
		$this->assertSame( 'HOUR( post_date ) BETWEEN 1 AND 2 AND MINUTE( post_date ) BETWEEN 3 AND 4 AND SECOND( post_date ) BETWEEN 6 AND 7', $found );
	}

	public function test_build_time_query_compare_not_between() {
		$q = new WP_Date_Query( array() );

		// Just hour
		$found = $q->build_time_query( 'post_date', 'NOT BETWEEN', array( 1, 2 ) );
		$this->assertSame( 'HOUR( post_date ) NOT BETWEEN 1 AND 2', $found );

		// Skip minute
		$found = $q->build_time_query( 'post_date', 'NOT BETWEEN', array( 1, 2 ), null, array( 6, 7 ) );
		$this->assertSame( 'HOUR( post_date ) NOT BETWEEN 1 AND 2 AND SECOND( post_date ) NOT BETWEEN 6 AND 7', $found );

		// All three
		$found = $q->build_time_query( 'post_date', 'NOT BETWEEN', array( 1, 2 ), array( 3, 4 ), array( 6, 7 ) );
		$this->assertSame( 'HOUR( post_date ) NOT BETWEEN 1 AND 2 AND MINUTE( post_date ) NOT BETWEEN 3 AND 4 AND SECOND( post_date ) NOT BETWEEN 6 AND 7', $found );
	}

	public function test_build_time_query_hour_only() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', 5 );
		$this->assertSame( 'HOUR( post_date ) = 5', $found );
	}

	public function test_build_time_query_minute_only() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', null, 5 );
		$this->assertSame( 'MINUTE( post_date ) = 5', $found );
	}

	public function test_build_time_query_second_only() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', null, null, 5 );
		$this->assertSame( 'SECOND( post_date ) = 5', $found );
	}

	public function test_build_time_query_hour_and_second() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', 5, null, 5 );
		$this->assertFalse( $found );
	}

	public function test_build_time_query_hour_minute() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', 5, 15 );

		// $compare value is floating point - use regex to account for
		// varying precision on different PHP installations
		$this->assertRegExp( "/DATE_FORMAT\( post_date, '%H\.%i' \) = 5\.150*/", $found );
	}

	public function test_build_time_query_hour_minute_second() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', 5, 15, 35 );

		// $compare value is floating point - use regex to account for
		// varying precision on different PHP installations
		$this->assertRegExp( "/DATE_FORMAT\( post_date, '%H\.%i%s' \) = 5\.15350*/", $found );
	}

	public function test_build_time_query_minute_second() {
		$q = new WP_Date_Query( array() );

		$found = $q->build_time_query( 'post_date', '=', null, 15, 35 );

		// $compare value is floating point - use regex to account for
		// varying precision on different PHP installations
		$this->assertRegExp( "/DATE_FORMAT\( post_date, '0\.%i%s' \) = 0\.15350*/", $found );
	}
}
