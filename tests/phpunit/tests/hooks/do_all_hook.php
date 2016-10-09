<?php

/**
 * Test the do_all_hook method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Do_All_Hook extends WP_UnitTestCase {

	public function test_do_all_hook_with_multiple_calls() {
		$a = new MockAction();
		$callback = array( $a, 'action' );
		$hook = new WP_Hook();
		$tag = 'all';
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = 'all_arg';

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$args = array( $arg );
		$hook->do_all_hook( $args );
		$hook->do_all_hook( $args );

		$this->assertEquals( 2, $a->get_call_count() );
	}
}
