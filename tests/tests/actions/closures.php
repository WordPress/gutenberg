<?php

/**
 * Test do_action() and related functions
 *
 * @group hooks
 */
class Tests_Actions_Closures extends WP_UnitTestCase {

	/**
	 * @ticket 10493
	 */
	function test_action_closure() {
		$tag = 'test_action_closure';
		$closure = function($a, $b) { $GLOBALS[$a] = $b;};
		add_action($tag, $closure, 10, 2);

		$this->assertSame( 10, has_action($tag, $closure) );

		$context = array( rand_str(), rand_str() );
		do_action($tag, $context[0], $context[1]);

		$this->assertSame($GLOBALS[$context[0]], $context[1]);

		$tag2 = 'test_action_closure_2';
		$closure2 = function() { $GLOBALS['closure_no_args'] = true;};
		add_action($tag2, $closure2);

		$this->assertSame( 10, has_action($tag2, $closure2) );

		do_action($tag2);

		$this->assertTrue($GLOBALS['closure_no_args']);

		remove_action( $tag, $closure );
		remove_action( $tag2, $closure2 );
	}
}
