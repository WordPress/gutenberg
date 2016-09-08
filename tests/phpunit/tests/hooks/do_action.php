<?php

/**
 * Test the do_action method of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Do_Action extends WP_UnitTestCase {
	private $events = array();
	private $action_output = '';
	private $hook;

	public function setUp() {
		parent::setUp();
		$this->events = array();
	}

	public function test_do_action_with_callback() {
		$a = new MockAction();
		$callback = array( $a, 'action' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertEquals( 1, $a->get_call_count() );
	}

	public function test_do_action_with_multiple_calls() {
		$a = new MockAction();
		$callback = array( $a, 'filter' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );
		$hook->do_action( array( $arg ) );

		$this->assertEquals( 2, $a->get_call_count() );
	}

	public function test_do_action_with_multiple_callbacks_on_same_priority() {
		$a = new MockAction();
		$b = new MockAction();
		$callback_one = array( $a, 'filter' );
		$callback_two = array( $b, 'filter' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$hook->add_filter( $tag, $callback_two, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertEquals( 1, $a->get_call_count() );
		$this->assertEquals( 1, $a->get_call_count() );
	}

	public function test_do_action_with_multiple_callbacks_on_different_priorities() {
		$a = new MockAction();
		$b = new MockAction();
		$callback_one = array( $a, 'filter' );
		$callback_two = array( $b, 'filter' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = rand( 1, 100 );
		$arg = rand_str();

		$hook->add_filter( $tag, $callback_one, $priority, $accepted_args );
		$hook->add_filter( $tag, $callback_two, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertEquals( 1, $a->get_call_count() );
		$this->assertEquals( 1, $a->get_call_count() );
	}

	public function test_do_action_with_no_accepted_args() {
		$callback = array( $this, '_action_callback' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = 0;
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertEmpty( $this->events[0]['args'] );
	}

	public function test_do_action_with_one_accepted_arg() {
		$callback = array( $this, '_action_callback' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = 1;
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertCount( 1, $this->events[0]['args'] );
	}

	public function test_do_action_with_more_accepted_args() {
		$callback = array( $this, '_action_callback' );
		$hook = new WP_Hook();
		$tag = rand_str();
		$priority = rand( 1, 100 );
		$accepted_args = 1000;
		$arg = rand_str();

		$hook->add_filter( $tag, $callback, $priority, $accepted_args );
		$hook->do_action( array( $arg ) );

		$this->assertCount( 1, $this->events[0]['args'] );
	}

	public function test_do_action_doesnt_change_value() {
		$this->hook = new WP_Hook();
		$this->action_output = '';

		$this->hook->add_filter( 'do_action_doesnt_change_value', array( $this, '_filter_do_action_doesnt_change_value1' ), 10, 1 );
		$this->hook->add_filter( 'do_action_doesnt_change_value', array( $this, '_filter_do_action_doesnt_change_value2' ), 10, 1 );
		$this->hook->add_filter( 'do_action_doesnt_change_value', array( $this, '_filter_do_action_doesnt_change_value3' ), 11, 1 );

		$this->hook->do_action( array( 'a' ) );

		$this->assertSame( 'a1-b1b3-a2a3', $this->action_output );
	}

	public function _filter_do_action_doesnt_change_value1( $value ) {
		$this->action_output .= $value . 1;
		return 'x1';
	}
	public function _filter_do_action_doesnt_change_value2( $value ) {
		$this->hook->remove_filter( 'do_action_doesnt_change_value', array( $this, '_filter_do_action_doesnt_change_value2' ), 10 );

		$this->action_output .= '-';
		$this->hook->do_action( array( 'b' ) );
		$this->action_output .= '-';

		$this->hook->add_filter( 'do_action_doesnt_change_value', array( $this, '_filter_do_action_doesnt_change_value2' ), 10, 1 );

		$this->action_output .= $value . 2;

		return 'x2';
	}

	public function _filter_do_action_doesnt_change_value3( $value ) {
		$this->action_output .= $value . 3;
		return 'x3';
	}

	/**
	 * Use this rather than MockAction so we can test callbacks with no args
	 */
	public function _action_callback() {
		$args = func_get_args();
		$this->events[] = array('action' => __FUNCTION__, 'args'=>$args);
	}
}
