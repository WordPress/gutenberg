<?php

/* // @todo These tests need to be rewritten for sanitize_sql_orderby
class Tests_Formatting_SanitizeOrderby extends WP_UnitTestCase {
	function test_empty() {
		$cols = array('a' => 'a');
		$this->assertEquals( '', sanitize_sql_orderby('', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('  ', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby("\t", $cols) );
		$this->assertEquals( '', sanitize_sql_orderby(null, $cols) );
		$this->assertEquals( '', sanitize_sql_orderby(0, $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('+', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('-', $cols) );
	}

	function test_unknown_column() {
		$cols = array('name' => 'post_name', 'date' => 'post_date');
		$this->assertEquals( '', sanitize_sql_orderby('unknown_column', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('+unknown_column', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('-unknown_column', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('-unknown1,+unknown2,unknown3', $cols) );
		$this->assertEquals( 'post_name ASC', sanitize_sql_orderby('name,unknown_column', $cols) );
		$this->assertEquals( '', sanitize_sql_orderby('!@#$%^&*()_=~`\'",./', $cols) );
	}

	function test_valid() {
		$cols = array('name' => 'post_name', 'date' => 'post_date', 'random' => 'rand()');
		$this->assertEquals( 'post_name ASC', sanitize_sql_orderby('name', $cols) );
		$this->assertEquals( 'post_name ASC', sanitize_sql_orderby('+name', $cols) );
		$this->assertEquals( 'post_name DESC', sanitize_sql_orderby('-name', $cols) );
		$this->assertEquals( 'post_date ASC, post_name ASC', sanitize_sql_orderby('date,name', $cols) );
		$this->assertEquals( 'post_date ASC, post_name ASC', sanitize_sql_orderby(' date , name ', $cols) );
		$this->assertEquals( 'post_name DESC, post_date ASC', sanitize_sql_orderby('-name,date', $cols) );
		$this->assertEquals( 'post_name ASC, post_date ASC', sanitize_sql_orderby('name ,+ date', $cols) );
		$this->assertEquals( 'rand() ASC', sanitize_sql_orderby('random', $cols) );
	}
}
*/
