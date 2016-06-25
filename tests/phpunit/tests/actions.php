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
		$tag1 = rand_str();
		$tag2 = rand_str();

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

	/**
	 * @ticket 36819
	 */
	function test_backup_plugin_globals_returns_filters() {
		$backup = _backup_plugin_globals();
		$this->assertArrayHasKey( 'backup_wp_filter',         $backup );
		$this->assertArrayHasKey( 'backup_wp_actions',        $backup );
		$this->assertArrayHasKey( 'backup_wp_current_filter', $backup );
		$this->assertArrayHasKey( 'backup_merged_filters', $backup );
	}

	/**
	 * @ticket 36819
	 */
	function test_backup_plugin_globals_returns_filters_from_first_time_called() {
		$backup = _backup_plugin_globals();

		$a = new MockAction();
		$tag = rand_str();

		add_action($tag, array(&$a, 'action'));

		$new_backup = _backup_plugin_globals();
		$this->assertEquals( $backup, $new_backup );
	}

	/**
	 * @ticket 36819
	 */
	function test_restore_plugin_globals_from_stomp() {
		global $wp_actions;
		$original_actions = $wp_actions;

		_backup_plugin_globals();

		$wp_actions = array();
		
		$this->assertEmpty( $wp_actions );
		_restore_plugin_globals();

		$this->assertEquals( $GLOBALS['wp_actions'], $original_actions );
	}

	/**
	 * @ticket 36819
	 */
	function test_restore_plugin_globals_includes_additions() {
		global $wp_filter;
		$original_filter = $wp_filter;

		$backup = _backup_plugin_globals();

		$a = new MockAction();
		$tag = rand_str();
		add_action($tag, array(&$a, 'action'));
		
		$this->assertNotEquals( $GLOBALS['wp_filter'], $original_filter );

		_restore_plugin_globals();

		$this->assertNotEquals( $GLOBALS['wp_filter'], $original_filter );
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

	/**
	 * @ticket 10441
	 * @expectedDeprecated tests_apply_filters_deprecated
	 */
	public function test_apply_filters_deprecated() {
		$p = 'Foo';

		add_filter( 'tests_apply_filters_deprecated', array( __CLASS__, 'deprecated_filter_callback' ) );
		$p = apply_filters_deprecated( 'tests_apply_filters_deprecated', array( $p ), '4.6' );
		remove_filter( 'tests_apply_filters_deprecated', array( __CLASS__, 'deprecated_filter_callback' ) );

		$this->assertSame( 'Bar', $p );
	}

	public static function deprecated_filter_callback( $p ) {
		$p = 'Bar';
		return $p;
	}

	/**
	 * @ticket 10441
	 * @expectedDeprecated tests_apply_filters_deprecated
	 */
	public function test_apply_filters_deprecated_with_multiple_params() {
		$p1 = 'Foo1';
		$p2 = 'Foo2';

		add_filter( 'tests_apply_filters_deprecated', array( __CLASS__, 'deprecated_filter_callback_multiple_params' ), 10, 2 );
		$p1 = apply_filters_deprecated( 'tests_apply_filters_deprecated', array( $p1, $p2 ), '4.6' );
		remove_filter( 'tests_apply_filters_deprecated', array( __CLASS__, 'deprecated_filter_callback_multiple_params' ), 10, 2 );

		$this->assertSame( 'Bar1', $p1 );

		// Not passed by reference, so not modified.
		$this->assertSame( 'Foo2', $p2 );
	}

	public static function deprecated_filter_callback_multiple_params( $p1, $p2 ) {
		$p1 = 'Bar1';
		$p2 = 'Bar2';

		return $p1;
	}
}
