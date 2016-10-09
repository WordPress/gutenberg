<?php

/**
 * Test the Iterator implementation of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Iterator extends WP_UnitTestCase {

	public function test_foreach() {
		$callback_one = '__return_null';
		$callback_two = '__return_false';
		$hook = new WP_Hook();
		$tag = __FUNCTION__;
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$hook->add_filter( $tag, $callback_two, $priority + 1, $accepted_args );

		$functions = array();
		$priorities = array();
		foreach ( $hook as $key => $callbacks ) {
			$priorities[] = $key;
			foreach ( $callbacks as $function_index => $the_ ) {
				$functions[] = $the_['function'];
			}
		}
		$this->assertEqualSets( array( $priority, $priority + 1 ), $priorities );
		$this->assertEqualSets( array( $callback_one, $callback_two ), $functions );
	}
}
