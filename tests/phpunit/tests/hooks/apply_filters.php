<?php

/**
 * Test the apply_filters method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Apply_Filters extends WP_UnitTestCase {

	public function test_apply_filters_with_callback() {
		$a = new MockAction();
		$callback = array( $a, 'filter' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$returned = $hook->apply_filters( $arg, array( $arg ) );

		$this->assertEquals( $returned, $arg );
		$this->assertEquals( 1, $a->get_call_count() );
	}

	public function test_apply_filters_with_multiple_calls() {
		$a = new MockAction();
		$callback = array( $a, 'filter' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$returned_one = $hook->apply_filters( $arg, array( $arg ) );
		$returned_two = $hook->apply_filters( $returned_one, array( $returned_one ) );

		$this->assertEquals( $returned_two, $arg );
		$this->assertEquals( 2, $a->get_call_count() );
	}

}
