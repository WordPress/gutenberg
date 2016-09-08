<?php

/**
 * Test do_action() and related functions
 *
 * @group hooks
 */
class Tests_Actions extends WP_UnitTestCase {

	function test_simple_action() {
		$a = new MockAction();
		$tag = 'test_action';

		add_action($tag, array(&$a, 'action'));
		do_action($tag);

		// only one event occurred for the hook, with empty args
		$this->assertEquals(1, $a->get_call_count());
		// only our hook was called
		$this->assertEquals(array($tag), $a->get_tags());

		$argsvar = $a->get_args();
		$args = array_pop( $argsvar );
		$this->assertEquals(array(''), $args);
	}

	function test_remove_action() {
		$a = new MockAction();
		$tag = rand_str();

		add_action($tag, array(&$a, 'action'));
		do_action($tag);

		// make sure our hook was called correctly
		$this->assertEquals(1, $a->get_call_count());
		$this->assertEquals(array($tag), $a->get_tags());

		// now remove the action, do it again, and make sure it's not called this time
		remove_action($tag, array(&$a, 'action'));
		do_action($tag);
		$this->assertEquals(1, $a->get_call_count());
		$this->assertEquals(array($tag), $a->get_tags());

	}

	function test_has_action() {
		$tag = rand_str();
		$func = rand_str();

		$this->assertFalse( has_action($tag, $func) );
		$this->assertFalse( has_action($tag) );
		add_action($tag, $func);
		$this->assertEquals( 10, has_action($tag, $func) );
		$this->assertTrue( has_action($tag) );
		remove_action($tag, $func);
		$this->assertFalse( has_action($tag, $func) );
		$this->assertFalse( has_action($tag) );
	}

	// one tag with multiple actions
	function test_multiple_actions() {
		$a1 = new MockAction();
		$a2 = new MockAction();
		$tag = rand_str();

		// add both actions to the hook
		add_action($tag, array(&$a1, 'action'));
		add_action($tag, array(&$a2, 'action'));

		do_action($tag);

		// both actions called once each
		$this->assertEquals(1, $a1->get_call_count());
		$this->assertEquals(1, $a2->get_call_count());
	}

	function test_action_args_1() {
		$a = new MockAction();
		$tag = rand_str();
		$val = rand_str();

		add_action($tag, array(&$a, 'action'));
		// call the action with a single argument
		do_action($tag, $val);

		$call_count = $a->get_call_count();
		$this->assertEquals(1, $call_count);
		$argsvar = $a->get_args();
		$this->assertEquals( array( $val ), array_pop( $argsvar ) );
	}

	function test_action_args_2() {
		$a1 = new MockAction();
		$a2 = new MockAction();
		$tag = rand_str();
		$val1 = rand_str();
		$val2 = rand_str();

		// a1 accepts two arguments, a2 doesn't
		add_action($tag, array(&$a1, 'action'), 10, 2);
		add_action($tag, array(&$a2, 'action'));
		// call the action with two arguments
		do_action($tag, $val1, $val2);

		$call_count = $a1->get_call_count();
		// a1 should be called with both args
		$this->assertEquals(1, $call_count);
		$argsvar1 = $a1->get_args();
		$this->assertEquals( array( $val1, $val2 ), array_pop( $argsvar1 ) );

		// a2 should be called with one only
		$this->assertEquals(1, $a2->get_call_count());
		$argsvar2 = $a2->get_args();
		$this->assertEquals( array( $val1 ), array_pop( $argsvar2 ) );
	}

	/**
	 * Test that multiple callbacks receive the correct number of args even when the number
	 * is less than, or greater than previous hooks.
	 *
	 * @see https://core.trac.wordpress.org/ticket/17817#comment:72
	 * @ticket 17817
	 */
	function test_action_args_3() {
		$a1 = new MockAction();
		$a2 = new MockAction();
		$a3 = new MockAction();
		$tag = rand_str();
		$val1 = rand_str();
		$val2 = rand_str();

		// a1 accepts two arguments, a2 doesn't, a3 accepts two arguments
		add_action( $tag, array( &$a1, 'action' ), 10, 2 );
		add_action( $tag, array( &$a2, 'action' ) );
		add_action( $tag, array( &$a3, 'action' ), 10, 2 );
		// call the action with two arguments
		do_action( $tag, $val1, $val2 );

		$call_count = $a1->get_call_count();
		// a1 should be called with both args
		$this->assertEquals( 1, $call_count );
		$argsvar1 = $a1->get_args();
		$this->assertEquals( array( $val1, $val2 ), array_pop( $argsvar1 ) );

		// a2 should be called with one only
		$this->assertEquals( 1, $a2->get_call_count() );
		$argsvar2 = $a2->get_args();
		$this->assertEquals( array( $val1 ), array_pop( $argsvar2 ) );

		// a3 should be called with both args
		$this->assertEquals( 1, $a3->get_call_count() );
		$argsvar3 = $a3->get_args();
		$this->assertEquals( array( $val1, $val2 ), array_pop( $argsvar3 ) );
	}

	function test_action_priority() {
		$a = new MockAction();
		$tag = rand_str();

		add_action($tag, array(&$a, 'action'), 10);
		add_action($tag, array(&$a, 'action2'), 9);
		do_action($tag);

		// two events, one per action
		$this->assertEquals(2, $a->get_call_count());

		$expected = array (
			// action2 is called first because it has priority 9
			array (
				'action' => 'action2',
				'tag' => $tag,
				'args' => array('')
			),
			// action 1 is called second
			array (
				'action' => 'action',
				'tag' => $tag,
				'args' => array('')
			),
		);

		$this->assertEquals($expected, $a->get_events());
	}

	function test_did_action() {
		$tag1 = 'action1';
		$tag2 = 'action2';

		// do action tag1 but not tag2
		do_action($tag1);
		$this->assertEquals(1, did_action($tag1));
		$this->assertEquals(0, did_action($tag2));

		// do action tag2 a random number of times
		$count = rand(0, 10);
		for ($i=0; $i<$count; $i++)
			do_action($tag2);

		// tag1's count hasn't changed, tag2 should be correct
		$this->assertEquals(1, did_action($tag1));
		$this->assertEquals($count, did_action($tag2));

	}

	function test_all_action() {
		$a = new MockAction();
		$tag1 = rand_str();
		$tag2 = rand_str();

		// add an 'all' action
		add_action('all', array(&$a, 'action'));
		$this->assertEquals(10, has_filter('all', array(&$a, 'action')));
		// do some actions
		do_action($tag1);
		do_action($tag2);
		do_action($tag1);
		do_action($tag1);

		// our action should have been called once for each tag
		$this->assertEquals(4, $a->get_call_count());
		// only our hook was called
		$this->assertEquals(array($tag1, $tag2, $tag1, $tag1), $a->get_tags());

		remove_action('all', array(&$a, 'action'));
		$this->assertFalse(has_filter('all', array(&$a, 'action')));

	}

	function test_remove_all_action() {
		$a = new MockAction();
		$tag = rand_str();

		add_action('all', array(&$a, 'action'));
		$this->assertEquals(10, has_filter('all', array(&$a, 'action')));
		do_action($tag);

		// make sure our hook was called correctly
		$this->assertEquals(1, $a->get_call_count());
		$this->assertEquals(array($tag), $a->get_tags());

		// now remove the action, do it again, and make sure it's not called this time
		remove_action('all', array(&$a, 'action'));
		$this->assertFalse(has_filter('all', array(&$a, 'action')));
		do_action($tag);
		$this->assertEquals(1, $a->get_call_count());
		$this->assertEquals(array($tag), $a->get_tags());
	}

	function test_action_ref_array() {
		$obj = new stdClass();
		$a = new MockAction();
		$tag = rand_str();

		add_action($tag, array(&$a, 'action'));

		do_action_ref_array($tag, array(&$obj));

		$args = $a->get_args();
		$this->assertSame($args[0][0], $obj);
		// just in case we don't trust assertSame
		$obj->foo = true;
		$this->assertFalse( empty($args[0][0]->foo) );
	}

	/**
	 * @ticket 11241
	 */
	function test_action_keyed_array() {
		$a = new MockAction();

		$tag = rand_str();

		add_action($tag, array(&$a, 'action'));

		$context = array( rand_str() => rand_str() );
		do_action($tag, $context);

		$args = $a->get_args();
		$this->assertSame($args[0][0], $context);

		$context2 = array( rand_str() => rand_str(), rand_str() => rand_str() );
		do_action($tag, $context2);

		$args = $a->get_args();
		$this->assertSame($args[1][0], $context2);

	}

	function test_action_self_removal() {
		add_action( 'test_action_self_removal', array( $this, 'action_self_removal' ) );
		do_action( 'test_action_self_removal' );
		$this->assertEquals( 1, did_action( 'test_action_self_removal' ) );
	}

	function action_self_removal() {
		remove_action( 'test_action_self_removal', array( $this, 'action_self_removal' ) );
	}

	/**
	 * @ticket 17817
	 */
	function test_action_recursion() {
		$tag = rand_str();
		$a = new MockAction();
		$b = new MockAction();

		add_action( $tag, array( $a, 'action' ), 11, 1 );
		add_action( $tag, array( $b, 'action' ), 13, 1 );
		add_action( $tag, array( $this, 'action_that_causes_recursion' ), 12, 1 );
		do_action( $tag, $tag );

		$this->assertEquals( 2, $a->get_call_count(), 'recursive actions should call all callbacks with earlier priority' );
		$this->assertEquals( 2, $b->get_call_count(), 'recursive actions should call callbacks with later priority' );
	}

	function action_that_causes_recursion( $tag ) {
		static $recursing = false;
		if ( ! $recursing ) {
			$recursing = true;
			do_action( $tag, $tag );
		}
		$recursing = false;
	}

	/**
	 * @ticket 9968
	 * @ticket 17817
	 */
	function test_action_callback_manipulation_while_running() {
		$tag = rand_str();
		$a = new MockAction();
		$b = new MockAction();
		$c = new MockAction();
		$d = new MockAction();
		$e = new MockAction();

		add_action( $tag, array( $a, 'action' ), 11, 2 );
		add_action( $tag, array( $this, 'action_that_manipulates_a_running_hook' ), 12, 2 );
		add_action( $tag, array( $b, 'action' ), 12, 2 );

		do_action( $tag, $tag, array( $a, $b, $c, $d, $e ) );
		do_action( $tag, $tag, array( $a, $b, $c, $d, $e ) );

		$this->assertEquals( 2, $a->get_call_count(), 'callbacks should run unless otherwise instructed' );
		$this->assertEquals( 1, $b->get_call_count(), 'callback removed by same priority callback should still get called' );
		$this->assertEquals( 1, $c->get_call_count(), 'callback added by same priority callback should not get called' );
		$this->assertEquals( 2, $d->get_call_count(), 'callback added by earlier priority callback should get called' );
		$this->assertEquals( 1, $e->get_call_count(), 'callback added by later priority callback should not get called' );
	}

	function action_that_manipulates_a_running_hook( $tag, $mocks ) {
		remove_action( $tag, array( $mocks[ 1 ], 'action' ), 12, 2 );
		add_action( $tag, array( $mocks[ 2 ], 'action' ), 12, 2 );
		add_action( $tag, array( $mocks[ 3 ], 'action' ), 13, 2 );
		add_action( $tag, array( $mocks[ 4 ], 'action' ), 10, 2 );
	}

	/**
	 * @ticket 17817
	 *
	 * This specificaly addresses the concern raised at
	 * https://core.trac.wordpress.org/ticket/17817#comment:52
	 */
	function test_remove_anonymous_callback() {
		$tag = rand_str();
		$a = new MockAction();
		add_action( $tag, array( $a, 'action' ), 12, 1 );
		$this->assertTrue( has_action( $tag ) );

		$hook = $GLOBALS['wp_filter'][ $tag ];

		// From http://wordpress.stackexchange.com/a/57088/6445
		foreach ( $hook as $priority => $filter ) {
			foreach ( $filter as $identifier => $function ) {
				if ( is_array( $function )
					&& is_a( $function['function'][ 0 ], 'MockAction' )
					&& 'action' === $function['function'][ 1 ]
				) {
					remove_filter(
						$tag,
						array( $function['function'][ 0 ], 'action' ),
						$priority
					);
				}
			}
		}

		$this->assertFalse( has_action( $tag ) );
	}


	/**
	 * Test the ArrayAccess methods of WP_Hook
	 *
	 * @ticket 17817
	 */
	function test_array_access_of_wp_filter_global() {
		global $wp_filter;
		$tag = rand_str();

		add_action( $tag, '__return_null', 11, 1 );

		$this->assertTrue( isset( $wp_filter[ $tag ][ 11 ] ) );
		$this->assertArrayHasKey( '__return_null', $wp_filter[ $tag ][ 11 ] );

		unset( $wp_filter[ $tag ][ 11 ] );
		$this->assertFalse( has_action( $tag, '__return_null' ) );

		$wp_filter[ $tag ][ 11 ] = array( '__return_null' => array( 'function' => '__return_null', 'accepted_args' => 1 ) );
		$this->assertEquals( 11, has_action( $tag, '__return_null' ) );
	}

	/**
	 * Make sure current_action() behaves as current_filter()
	 *
	 * @ticket 14994
	 */
	function test_current_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'first';
		$wp_current_filter[] = 'second'; // Let's say a second action was invoked.

		$this->assertEquals( 'second', current_action() );
	}

	/**
	 * @ticket 14994
	 */
	function test_doing_filter() {
		global $wp_current_filter;
		$wp_current_filter = array(); // Set to an empty array first

		$this->assertFalse( doing_filter() ); // No filter is passed in, and no filter is being processed
		$this->assertFalse( doing_filter( 'testing' ) ); // Filter is passed in but not being processed

		$wp_current_filter[] = 'testing';

		$this->assertTrue( doing_filter() ); // No action is passed in, and a filter is being processed
		$this->assertTrue( doing_filter( 'testing') ); // Filter is passed in and is being processed
		$this->assertFalse( doing_filter( 'something_else' ) ); // Filter is passed in but not being processed

		$wp_current_filter = array();
	}

	/**
	 * @ticket 14994
	 */
	function test_doing_action() {
		global $wp_current_filter;
		$wp_current_filter = array(); // Set to an empty array first

		$this->assertFalse( doing_action() ); // No action is passed in, and no filter is being processed
		$this->assertFalse( doing_action( 'testing' ) ); // Action is passed in but not being processed

		$wp_current_filter[] = 'testing';

		$this->assertTrue( doing_action() ); // No action is passed in, and a filter is being processed
		$this->assertTrue( doing_action( 'testing') ); // Action is passed in and is being processed
		$this->assertFalse( doing_action( 'something_else' ) ); // Action is passed in but not being processed

		$wp_current_filter = array();
	}

	/**
	 * @ticket 14994
	 */
	function test_doing_filter_real() {
		$this->assertFalse( doing_filter() ); // No filter is passed in, and no filter is being processed
		$this->assertFalse( doing_filter( 'testing' ) ); // Filter is passed in but not being processed

		add_filter( 'testing', array( $this, 'apply_testing_filter' ) );
		$this->assertTrue( has_action( 'testing' ) );
		$this->assertEquals( 10, has_action( 'testing', array( $this, 'apply_testing_filter' ) ) );

		apply_filters( 'testing', '' );

		// Make sure it ran.
		$this->assertTrue( $this->apply_testing_filter );

		$this->assertFalse( doing_filter() ); // No longer doing any filters
		$this->assertFalse( doing_filter( 'testing' ) ); // No longer doing this filter
	}

	function apply_testing_filter() {
		$this->apply_testing_filter = true;

		$this->assertTrue( doing_filter() );
		$this->assertTrue( doing_filter( 'testing' ) );
		$this->assertFalse( doing_filter( 'something_else' ) );
		$this->assertFalse( doing_filter( 'testing_nested' ) );

		add_filter( 'testing_nested', array( $this, 'apply_testing_nested_filter' ) );
		$this->assertTrue( has_action( 'testing_nested' ) );
		$this->assertEquals( 10, has_action( 'testing_nested', array( $this, 'apply_testing_nested_filter' ) ) );

		apply_filters( 'testing_nested', '' );

		// Make sure it ran.
		$this->assertTrue( $this->apply_testing_nested_filter );

		$this->assertFalse( doing_filter( 'testing_nested' ) );
		$this->assertFalse( doing_filter( 'testing_nested' ) );
	}

	function apply_testing_nested_filter() {
		$this->apply_testing_nested_filter = true;
		$this->assertTrue( doing_filter() );
		$this->assertTrue( doing_filter( 'testing' ) );
		$this->assertTrue( doing_filter( 'testing_nested' ) );
		$this->assertFalse( doing_filter( 'something_else' ) );
	}

	/**
	 * @ticket 10441
	 * @expectedDeprecated tests_do_action_deprecated
	 */
	public function test_do_action_deprecated() {
		$p = new WP_Post( (object) array( 'post_title' => 'Foo' ) );

		add_action( 'tests_do_action_deprecated', array( __CLASS__, 'deprecated_action_callback' ) );
		do_action_deprecated( 'tests_do_action_deprecated', array( $p ), '4.6' );
		remove_action( 'tests_do_action_deprecated', array( __CLASS__, 'deprecated_action_callback' ) );

		$this->assertSame( 'Bar', $p->post_title );
	}

	public static function deprecated_action_callback( $p ) {
		$p->post_title = 'Bar';
	}

	/**
	 * @ticket 10441
	 * @expectedDeprecated tests_do_action_deprecated
	 */
	public function test_do_action_deprecated_with_multiple_params() {
		$p1 = new WP_Post( (object) array( 'post_title' => 'Foo1' ) );
		$p2 = new WP_Post( (object) array( 'post_title' => 'Foo2' ) );

		add_action( 'tests_do_action_deprecated', array( __CLASS__, 'deprecated_action_callback_multiple_params' ), 10, 2 );
		do_action_deprecated( 'tests_do_action_deprecated', array( $p1, $p2 ), '4.6' );
		remove_action( 'tests_do_action_deprecated', array( __CLASS__, 'deprecated_action_callback_multiple_params' ), 10, 2 );

		$this->assertSame( 'Bar1', $p1->post_title );
		$this->assertSame( 'Bar2', $p2->post_title );
	}

	public static function deprecated_action_callback_multiple_params( $p1, $p2 ) {
		$p1->post_title = 'Bar1';
		$p2->post_title = 'Bar2';
	}
}
