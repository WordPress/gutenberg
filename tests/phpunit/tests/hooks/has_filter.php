<?php

/**
 * Test the has_filter method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Has_Filter extends WP_UnitTestCase {

	public function test_has_filter_with_function() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertEquals( $priority, $hook->has_filter( $tag, $callback ) );
	}

	public function test_has_filter_with_object() {
		$a = new MockAction();
		$callback = array( $a, 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertEquals( $priority, $hook->has_filter( $tag, $callback ) );
	}

	public function test_has_filter_with_static_method() {
		$callback = array( 'MockAction', 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertEquals( $priority, $hook->has_filter( $tag, $callback ) );
	}

	public function test_has_filter_without_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertTrue( $hook->has_filter() );
	}

	public function test_not_has_filter_without_callback() {
		$hook = new WP_Hook();
		$this->assertFalse( $hook->has_filter() );
	}

	public function test_not_has_filter_with_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();

		$this->assertFalse( $hook->has_filter( $tag, $callback ) );
	}

	public function test_has_filter_with_wrong_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertFalse( $hook->has_filter( $tag, '__return_false' ) );
	}
}
