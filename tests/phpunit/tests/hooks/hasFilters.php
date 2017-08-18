<?php

/**
 * Test the has_filters method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Has_Filters extends WP_UnitTestCase {

	public function test_has_filters_with_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = __FUNCTION__;
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$this->assertTrue( $hook->has_filters() );
	}

	public function test_has_filters_without_callback() {
		$hook = new WP_Hook();
		$this->assertFalse( $hook->has_filters() );
	}

	public function test_not_has_filters_with_removed_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = __FUNCTION__;
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->remove_filter( $tag, $callback, $priority );
		$this->assertFalse( $hook->has_filters() );
	}

	public function test_not_has_filter_with_directly_removed_callback() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = __FUNCTION__;
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$function_key = _wp_filter_build_unique_id( $tag, $callback, $priority );
		unset( $hook->callbacks[ $priority ][ $function_key ] );

		$this->assertFalse( $hook->has_filters() );
	}
}
