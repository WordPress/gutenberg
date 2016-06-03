<?php

/**
 * @group functions.php
 */
class Tests_Functions_RemoveQueryArg extends WP_UnitTestCase {
	/**
	 * @dataProvider remove_query_arg_provider
	 */
	public function test_remove_query_arg( $keys_to_remove, $url, $expected ) {
		$actual = remove_query_arg( $keys_to_remove, $url );

		$this->assertNotEmpty( $actual );
		$this->assertEquals( $expected, $actual );
	}

	public function remove_query_arg_provider() {
		return array(
			array( 'foo', 'edit.php?foo=test1&baz=test1', 'edit.php?baz=test1' ),
			array( array( 'foo' ), 'edit.php?foo=test2&baz=test2', 'edit.php?baz=test2' ),
			array( array( 'foo', 'baz' ), 'edit.php?foo=test3&baz=test3', 'edit.php' ),
			array( array( 'fakefoo', 'fakebaz' ), 'edit.php?foo=test4&baz=test4', 'edit.php?foo=test4&baz=test4' ),
			array( array( 'fakefoo', 'baz' ), 'edit.php?foo=test4&baz=test4', 'edit.php?foo=test4' ),
		);
	}

	public function test_should_fall_back_on_current_url() {
		$old_request_uri = $_SERVER['REQUEST_URI'];
		$_SERVER['REQUEST_URI'] = 'edit.php?foo=bar&baz=quz';

		$actual = remove_query_arg( 'foo' );

		$_SERVER['REQUEST_URI'] = $old_request_uri;

		$this->assertSame( 'edit.php?baz=quz', $actual );
	}
}
