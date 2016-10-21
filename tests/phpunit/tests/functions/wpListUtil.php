<?php

/**
 * @group functions.php
 */
class Tests_WP_List_Util extends WP_UnitTestCase {
	public function data_test_wp_list_pluck() {
		return array(
			'arrays'                         => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz' ),
					array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum' ),
					array( 'foo' => 'baz' ),
				),
				'foo',
				null,
				array( 'bar', 'foo', 'baz' ),
			),
			'arrays with index key'          => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
				),
				'foo',
				'key',
				array( 'foo' => 'bar', 'bar' => 'foo', 'value' => 'baz' ),
			),
			'arrays with index key missing'  => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz' ),
					array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
				),
				'foo',
				'key',
				array( 'bar' => 'foo', 'value' => 'baz', 'bar' ),
			),
			'objects'                        => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum' ),
					(object) array( 'foo' => 'baz' ),
				),
				'foo',
				null,
				array( 'bar', 'foo', 'baz' ),
			),
			'objects with index key'         => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value' ),
				),
				'foo',
				'key',
				array( 'foo' => 'bar', 'bar' => 'foo', 'value' => 'baz' ),
			),
			'objects with index key missing' => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value' ),
				),
				'foo',
				'key',
				array( 'bar' => 'foo', 'value' => 'baz', 'bar' ),
			),
		);
	}

	/**
	 * @dataProvider data_test_wp_list_pluck
	 *
	 * @param array      $list      List of objects or arrays.
	 * @param int|string $field     Field from the object to place instead of the entire object
	 * @param int|string $index_key Field from the object to use as keys for the new array.
	 * @param array      $expected  Expected result.
	 */
	public function test_wp_list_pluck( $list, $field, $index_key, $expected ) {
		$this->assertEqualSetsWithIndex( $expected, wp_list_pluck( $list, $field, $index_key ) );
	}

	public function data_test_wp_list_filter() {
		return array(
			'string instead of array'  => array(
				'foo',
				array(),
				'AND',
				array(),
			),
			'object instead of array'  => array(
				(object) array( 'foo' ),
				array(),
				'AND',
				array(),
			),
			'empty args'               => array(
				array( 'foo', 'bar' ),
				array(),
				'AND',
				array( 'foo', 'bar' ),
			),
			'invalid operator'         => array(
				array(
					(object) array( 'foo' => 'bar' ),
					(object) array( 'foo' => 'baz' ),
				),
				array( 'foo' => 'bar' ),
				'XOR',
				array(),
			),
			'single argument to match' => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value' ),
					(object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'foo' => 'bar' ),
				'AND',
				array(
					0 => (object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					3 => (object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
			),
			'all must match'           => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value', 'bar' => 'baz' ),
					(object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'foo' => 'bar', 'bar' => 'baz' ),
				'AND',
				array(
					0 => (object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
				),
			),
			'any must match'           => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value', 'bar' => 'baz' ),
					(object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'key' => 'value', 'bar' => 'baz' ),
				'OR',
				array(
					0 => (object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					2 => (object) array( 'foo' => 'baz', 'key' => 'value', 'bar' => 'baz' ),
					3 => (object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
			),
			'none must match'          => array(
				array(
					(object) array( 'foo' => 'bar', 'bar' => 'baz', 'abc' => 'xyz', 'key' => 'foo' ),
					(object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
					(object) array( 'foo' => 'baz', 'key' => 'value' ),
					(object) array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'key' => 'value', 'bar' => 'baz' ),
				'NOT',
				array(
					1 => (object) array( 'foo' => 'foo', '123' => '456', 'lorem' => 'ipsum', 'key' => 'bar' ),
				),
			),
		);
	}

	/**
	 * @dataProvider data_test_wp_list_filter
	 *
	 * @param array  $list     An array of objects to filter.
	 * @param array  $args     An array of key => value arguments to match
	 *                         against each object.
	 * @param string $operator The logical operation to perform.
	 * @param array  $expected Expected result.
	 */
	public function test_wp_list_filter( $list, $args, $operator, $expected ) {
		$this->assertEqualSetsWithIndex( $expected, wp_list_filter( $list, $args, $operator ) );
	}

	public function data_test_wp_list_sort() {
		return array(
			'single orderby ascending'        => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				'foo',
				'ASC',
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
				),
			),
			'single orderby descending'       => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				'foo',
				'DESC',
				array(
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
			),
			'single orderby array ascending'  => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'foo' => 'ASC' ),
				'IGNORED',
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
				),
			),
			'single orderby array descending' => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'foo' => 'DESC' ),
				'IGNORED',
				array(
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'baz', 'key' => 'value' ),
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
			),
			'multiple orderby ascending'      => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'key' => 'ASC', 'foo' => 'ASC' ),
				'IGNORED',
				array(
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
			),
			'multiple orderby descending'     => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'key' => 'DESC', 'foo' => 'DESC' ),
				'IGNORED',
				array(
					array( 'foo' => 'bar', 'key' => 'value' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
				),
			),
			'multiple orderby mixed'          => array(
				array(
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'bar', 'key' => 'value' ),
				),
				array( 'key' => 'DESC', 'foo' => 'ASC' ),
				'IGNORED',
				array(
					array( 'foo' => 'bar', 'key' => 'value' ),
					array( 'foo' => 'baz', 'key' => 'key' ),
					array( 'foo' => 'foo', 'key' => 'key' ),
					array( 'foo' => 'bar', 'bar' => 'baz', 'key' => 'foo' ),
					array( 'foo' => 'foo', 'lorem' => 'ipsum', 'key' => 'bar' ),
				),
			),
		);
	}

	/**
	 * @dataProvider data_test_wp_list_sort
	 *
	 * @param string|array $orderby Either the field name to order by or an array
	 *                              of multiple orderby fields as $orderby => $order.
	 * @param string       $order   Either 'ASC' or 'DESC'.
	 */
	public function test_wp_list_sort( $list, $orderby, $order, $expected ) {
		$this->assertEquals( $expected, wp_list_sort( $list, $orderby, $order ) );
	}

	public function test_wp_list_util_get_input() {
		$input = array( 'foo', 'bar' );
		$util  = new WP_List_Util( $input );

		$this->assertEqualSets( $input, $util->get_input() );
	}

	public function test_wp_list_util_get_output_immediately() {
		$input = array( 'foo', 'bar' );
		$util  = new WP_List_Util( $input );

		$this->assertEqualSets( $input, $util->get_output() );
	}

	public function test_wp_list_util_get_output() {
		$expected = array( (object) array( 'foo' => 'bar', 'bar' => 'baz' ) );

		$util   = new WP_List_Util( array( (object) array( 'foo' => 'bar', 'bar' => 'baz' ), (object) array( 'bar' => 'baz' ) ) );
		$actual = $util->filter( array( 'foo' => 'bar' ) );

		$this->assertEqualSets( $expected, $actual );
		$this->assertEqualSets( $expected, $util->get_output() );
	}
}
