<?php


/**
 * Test the add_filter method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Add_Filter extends WP_UnitTestCase {

	public $hook;

	public function test_add_filter_with_function() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$function_index = _wp_filter_build_unique_id( $tag, $callback, $priority );
		$this->assertEquals( $callback, $hook->callbacks[ $priority ][ $function_index ]['function'] );
		$this->assertEquals( $accepted_args, $hook->callbacks[ $priority ][ $function_index ]['accepted_args'] );
	}

	public function test_add_filter_with_object() {
		$a = new MockAction();
		$callback = array( $a, 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$function_index = _wp_filter_build_unique_id( $tag, $callback, $priority );
		$this->assertEquals( $callback, $hook->callbacks[ $priority ][ $function_index ]['function'] );
		$this->assertEquals( $accepted_args, $hook->callbacks[ $priority ][ $function_index ]['accepted_args'] );
	}

	public function test_add_filter_with_static_method() {
		$callback = array( 'MockAction', 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );

		$function_index = _wp_filter_build_unique_id( $tag, $callback, $priority );
		$this->assertEquals( $callback, $hook->callbacks[ $priority ][ $function_index ]['function'] );
		$this->assertEquals( $accepted_args, $hook->callbacks[ $priority ][ $function_index ]['accepted_args'] );
	}

	public function test_add_two_filters_with_same_priority() {
		$callback_one = '__return_null';
		$callback_two = '__return_false';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );

		$hook->add_filter( $tag, $callback_two, $priority, $accepted_args );
		$this->assertCount( 2, $hook->callbacks[ $priority ] );
	}

	public function test_add_two_filters_with_different_priority() {
		$callback_one = '__return_null';
		$callback_two = '__return_false';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );

		$hook->add_filter( $tag, $callback_two, $priority + 1, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );
		$this->assertCount( 1, $hook->callbacks[ $priority + 1 ] );
	}

	public function test_readd_filter() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );
	}

	public function test_readd_filter_with_different_priority() {
		$callback = '__return_null';
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );

		$hook->add_filter( $tag, $callback, $priority + 1, $accepted_args );
		$this->assertCount( 1, $hook->callbacks[ $priority ] );
		$this->assertCount( 1, $hook->callbacks[ $priority + 1 ] );
	}

	public function test_sort_after_add_filter() {
		$a = new MockAction();
		$b = new MockAction();
		$c = new MockAction();
		$hook = new WP_Hook();
		$tag = rand_str();

		$hook->add_filter( $tag, array( $a, 'action' ), 10, 1 );
		$hook->add_filter( $tag, array( $b, 'action' ), 5, 1 );
		$hook->add_filter( $tag, array( $c, 'action' ), 8, 1 );

		$this->assertEquals( array( 5, 8, 10 ), array_keys( $hook->callbacks ) );
	}

	public function test_remove_and_add() {
		$this->hook = new Wp_Hook();

		$this->hook->add_filter( 'remove_and_add', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add2' ), 11, 1 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add4' ), 12, 1 );

		$value = $this->hook->apply_filters( '', array() );

		$this->assertSame( '24', $value );
	}

	public function test_remove_and_add_last_filter() {
		$this->hook = new Wp_Hook();

		$this->hook->add_filter( 'remove_and_add', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add1' ), 11, 1 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add2' ), 12, 1 );

		$value = $this->hook->apply_filters( '', array() );

		$this->assertSame( '12', $value );
	}

	public function test_remove_and_recurse_and_add() {
		$this->hook = new Wp_Hook();

		$this->hook->add_filter( 'remove_and_add', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add1' ), 11, 1 );
		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_recurse_and_add2' ), 11, 1 );
		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add3' ), 11, 1 );

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add4' ), 12, 1 );

		$value = $this->hook->apply_filters( '', array() );

		$this->assertSame( '1-134-234', $value );
	}

	public function _filter_remove_and_add1( $string ) {
		return $string . '1';
	}

	public function _filter_remove_and_add2( $string ) {
		$this->hook->remove_filter( 'remove_and_add', array( $this, '_filter_remove_and_add2' ), 11 );
		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_add2' ), 11, 1 );

		return $string . '2';
	}

	public function _filter_remove_and_recurse_and_add2( $string ) {
		$this->hook->remove_filter( 'remove_and_add', array( $this, '_filter_remove_and_recurse_and_add2' ), 11 );

		$string .= '-' . $this->hook->apply_filters( '', array() ) . '-';

		$this->hook->add_filter( 'remove_and_add', array( $this, '_filter_remove_and_recurse_and_add2' ), 11, 1 );

		return $string . '2';
	}

	public function _filter_remove_and_add3( $string ) {
		return $string . '3';
	}

	public function _filter_remove_and_add4( $string ) {
		return $string . '4';
	}

	public function test_remove_and_add_action() {
		$this->hook = new Wp_Hook();
		$this->action_output = '';

		$this->hook->add_filter( 'remove_and_add_action', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add2' ), 11, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add4' ), 12, 0 );

		$this->hook->do_action( array() );

		$this->assertSame( '24', $this->action_output );
	}

	public function test_remove_and_add_last_action() {
		$this->hook = new Wp_Hook();
		$this->action_output = '';

		$this->hook->add_filter( 'remove_and_add_action', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add1' ), 11, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add2' ), 12, 0 );

		$this->hook->do_action( array() );

		$this->assertSame( '12', $this->action_output );
	}

	public function test_remove_and_recurse_and_add_action() {
		$this->hook = new Wp_Hook();
		$this->action_output = '';

		$this->hook->add_filter( 'remove_and_add_action', '__return_empty_string', 10, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add1' ), 11, 0 );
		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_recurse_and_add2' ), 11, 0 );
		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add3' ), 11, 0 );

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add4' ), 12, 0 );

		$this->hook->do_action( array() );

		$this->assertSame( '1-134-234', $this->action_output );
	}

	public function _action_remove_and_add1() {
		$this->action_output .= 1;
	}

	public function _action_remove_and_add2() {
		$this->hook->remove_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add2' ), 11 );
		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_add2' ), 11, 0 );

		$this->action_output .= '2';
	}

	public function _action_remove_and_recurse_and_add2() {
		$this->hook->remove_filter( 'remove_and_add_action', array( $this, '_action_remove_and_recurse_and_add2' ), 11 );

		$this->action_output .= '-';
		$this->hook->do_action( array() );
		$this->action_output .= '-';

		$this->hook->add_filter( 'remove_and_add_action', array( $this, '_action_remove_and_recurse_and_add2' ), 11, 0 );

		$this->action_output .= '2';
	}

	public function _action_remove_and_add3() {
		$this->action_output .= '3';
	}

	public function _action_remove_and_add4() {
		$this->action_output .= '4';
	}
}
