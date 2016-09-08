<?php

/**
 * Test the remove_filter method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Remove_Filter extends WP_UnitTestCase {

	public function test_remove_filter_with_function() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->remove_filter( $tag, $callback, $priority );

		$this->assertFalse( isset( $hook->callbacks[ $priority ] ) );
	}

	public function test_remove_filter_with_object() {
		$a = new MockAction();
		$callback = array( $a, 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->remove_filter( $tag, $callback, $priority );

		$this->assertFalse( isset( $hook->callbacks[ $priority ] ) );
	}

	public function test_remove_filter_with_static_method() {
		$callback = array( 'MockAction', 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->remove_filter( $tag, $callback, $priority );

		$this->assertFalse( isset( $hook->callbacks[ $priority ] ) );
	}

	public function test_remove_filters_with_another_at_same_priority() {
		$callback_one = '__return_null';
		$callback_two = '__return_false';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$hook->add_filter( $tag, $callback_two, $priority, $accepted_args );

		$hook->remove_filter( $tag, $callback_one, $priority );

		$this->assertCount( 1, $hook->callbacks[ $priority ] );
	}

	public function test_remove_filter_with_another_at_different_priority() {
		$callback_one = '__return_null';
		$callback_two = '__return_false';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$hook->add_filter( $tag, $callback_two, $priority + 1, $accepted_args );

		$hook->remove_filter( $tag, $callback_one, $priority );
		$this->assertFalse( isset( $hook->callbacks[ $priority ] ) );
		$this->assertCount( 1, $hook->callbacks[ $priority + 1 ] );
	}
}
