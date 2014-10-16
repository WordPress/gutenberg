<?php

/**
 * @group query
 */
class Tests_Query_ParseQuery extends WP_UnitTestCase {
	/**
	 * @ticket 29736
	 */
	public function test_parse_query_s_array() {
		$q = new WP_Query();
		$q->parse_query( array(
			's' => array( 'foo' ),
		) );

		$this->assertSame( '', $q->query_vars['s'] );
	}

	public function test_parse_query_s_string() {
		$q = new WP_Query();
		$q->parse_query( array(
			's' => 'foo',
		) );

		$this->assertSame( 'foo', $q->query_vars['s'] );
	}

	public function test_parse_query_s_float() {
		$q = new WP_Query();
		$q->parse_query( array(
			's' => 3.5,
		) );

		$this->assertSame( 3.5, $q->query_vars['s'] );
	}

	public function test_parse_query_s_int() {
		$q = new WP_Query();
		$q->parse_query( array(
			's' => 3,
		) );

		$this->assertSame( 3, $q->query_vars['s'] );
	}

	public function test_parse_query_s_bool() {
		$q = new WP_Query();
		$q->parse_query( array(
			's' => true,
		) );

		$this->assertSame( true, $q->query_vars['s'] );
	}
}
