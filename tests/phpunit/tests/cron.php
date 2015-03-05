<?php

/**
 * Test the cron scheduling functions
 *
 * @group cron
 */
class Tests_Cron extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		// make sure the schedule is clear
		_set_cron_array(array());
	}

	function tearDown() {
		// make sure the schedule is clear
		_set_cron_array(array());
		parent::tearDown();
	}

	function test_wp_get_schedule_empty() {
		// nothing scheduled
		$hook = rand_str();
		$this->assertFalse(wp_get_schedule($hook));
	}

	function test_schedule_event_single() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = rand_str();
		$timestamp = strtotime('+1 hour');

		wp_schedule_single_event( $timestamp, $hook );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook) );

		// it's a non recurring event
		$this->assertEquals( '', wp_get_schedule($hook) );

	}

	function test_schedule_event_single_args() {
		// schedule an event with arguments and make sure it's returned by wp_next_scheduled
		$hook = rand_str();
		$timestamp = strtotime('+1 hour');
		$args = array(rand_str());

		wp_schedule_single_event( $timestamp, $hook, $args );
		// this returns the timestamp only if we provide matching args
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );
		// these don't match so return nothing
		$this->assertEquals( false, wp_next_scheduled($hook) );
		$this->assertEquals( false, wp_next_scheduled($hook, array(rand_str())) );

		// it's a non recurring event
		$this->assertEquals( '', wp_get_schedule($hook, $args) );
	}

	function test_schedule_event() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = rand_str();
		$recur = 'hourly';
		$timestamp = strtotime('+1 hour');

		wp_schedule_event( $timestamp, $recur, $hook );
		// it's scheduled for the right time
		$this->assertEquals( $timestamp, wp_next_scheduled($hook) );
		// it's a recurring event
		$this->assertEquals( $recur, wp_get_schedule($hook) );
	}

	function test_schedule_event_args() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = rand_str();
		$timestamp = strtotime('+1 hour');
		$recur = 'hourly';
		$args = array(rand_str());

		wp_schedule_event( $timestamp, 'hourly', $hook, $args );
		// this returns the timestamp only if we provide matching args
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );
		// these don't match so return nothing
		$this->assertEquals( false, wp_next_scheduled($hook) );
		$this->assertEquals( false, wp_next_scheduled($hook, array(rand_str())) );

		$this->assertEquals( $recur, wp_get_schedule($hook, $args) );

	}

	function test_unschedule_event() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = rand_str();
		$timestamp = strtotime('+1 hour');

		wp_schedule_single_event( $timestamp, $hook );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook) );

		// now unschedule it and make sure it's gone
		wp_unschedule_event( $timestamp, $hook );
		$this->assertEquals( false, wp_next_scheduled($hook) );
	}

	function test_clear_schedule() {
		$hook = rand_str();
		$args = array(rand_str());

		// schedule several events with and without arguments
		wp_schedule_single_event( strtotime('+1 hour'), $hook );
		wp_schedule_single_event( strtotime('+2 hour'), $hook );
		wp_schedule_single_event( strtotime('+3 hour'), $hook, $args );
		wp_schedule_single_event( strtotime('+4 hour'), $hook, $args );

		// make sure they're returned by wp_next_scheduled()
		$this->assertTrue( wp_next_scheduled($hook) > 0 );
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the no args events and make sure it's gone
		wp_clear_scheduled_hook($hook);
		$this->assertFalse( wp_next_scheduled($hook) );
		// the args events should still be there
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the args events and make sure they're gone too
		// note: wp_clear_scheduled_hook() expects args passed directly, rather than as an array
		wp_clear_scheduled_hook($hook, $args);
		$this->assertFalse( wp_next_scheduled($hook, $args) );
	}

	function test_clear_schedule_multiple_args() {
		$hook = rand_str();
		$args = array(rand_str(), rand_str());

		// schedule several events with and without arguments
		wp_schedule_single_event( strtotime('+1 hour'), $hook );
		wp_schedule_single_event( strtotime('+2 hour'), $hook );
		wp_schedule_single_event( strtotime('+3 hour'), $hook, $args );
		wp_schedule_single_event( strtotime('+4 hour'), $hook, $args );

		// make sure they're returned by wp_next_scheduled()
		$this->assertTrue( wp_next_scheduled($hook) > 0 );
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the no args events and make sure it's gone
		wp_clear_scheduled_hook($hook);
		$this->assertFalse( wp_next_scheduled($hook) );
		// the args events should still be there
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the args events and make sure they're gone too
		// note: wp_clear_scheduled_hook() used to expect args passed directly, rather than as an array pre WP 3.0
		wp_clear_scheduled_hook($hook, $args);
		$this->assertFalse( wp_next_scheduled($hook, $args) );
	}

	/**
	 * @ticket 10468
	 */
	function test_clear_schedule_new_args() {
		$hook = rand_str();
		$args = array(rand_str());
		$multi_hook = rand_str();
		$multi_args = array(rand_str(), rand_str());

		// schedule several events with and without arguments
		wp_schedule_single_event( strtotime('+1 hour'), $hook );
		wp_schedule_single_event( strtotime('+2 hour'), $hook );
		wp_schedule_single_event( strtotime('+3 hour'), $hook, $args );
		wp_schedule_single_event( strtotime('+4 hour'), $hook, $args );
		wp_schedule_single_event( strtotime('+5 hour'), $multi_hook, $multi_args );
		wp_schedule_single_event( strtotime('+6 hour'), $multi_hook, $multi_args );

		// make sure they're returned by wp_next_scheduled()
		$this->assertTrue( wp_next_scheduled($hook) > 0 );
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the no args events and make sure it's gone
		wp_clear_scheduled_hook($hook);
		$this->assertFalse( wp_next_scheduled($hook) );
		// the args events should still be there
		$this->assertTrue( wp_next_scheduled($hook, $args) > 0 );

		// clear the schedule for the args events and make sure they're gone too
		// wp_clear_scheduled_hook() should take args as an array like the other functions.
		wp_clear_scheduled_hook($hook, $args);
		$this->assertFalse( wp_next_scheduled($hook, $args) );

		// clear the schedule for the args events and make sure they're gone too
		// wp_clear_scheduled_hook() should take args as an array like the other functions and does from WP 3.0
		wp_clear_scheduled_hook($multi_hook, $multi_args);
		$this->assertFalse( wp_next_scheduled($multi_hook, $multi_args) );

	}

	/**
	 * @ticket 6966
	 */
	function test_duplicate_event() {
		// duplicate events close together should be skipped
		$hook = rand_str();
		$args = array(rand_str());
		$ts1 = strtotime('+5 minutes');
		$ts2 = strtotime('+3 minutes');

		// first one works
		wp_schedule_single_event( $ts1, $hook, $args );
		// second one is ignored
		wp_schedule_single_event( $ts2, $hook, $args );

		// the next event should be at +5 minutes, not +3
		$this->assertEquals( $ts1, wp_next_scheduled($hook, $args) );
	}

	/**
	 * @ticket 6966
	 */
	function test_not_duplicate_event() {
		// duplicate events far apart should work normally
		$hook = rand_str();
		$args = array( rand_str() );
		$ts1 = strtotime( '+30 minutes' );
		$ts2 = strtotime( '+3 minutes' );

		// first one works
		wp_schedule_single_event( $ts1, $hook, $args );
		// second works too
		wp_schedule_single_event( $ts2, $hook, $args );

		// the next event should be at +3 minutes, even though that one was scheduled second
		$this->assertEquals( $ts2, wp_next_scheduled( $hook, $args ) );
		wp_unschedule_event( $ts2, $hook, $args );
		// following event at +30 minutes should be there too
		$this->assertEquals( $ts1, wp_next_scheduled( $hook, $args ) );
	}

	function test_not_duplicate_event_reversed() {
		// duplicate events far apart should work normally regardless of order
		$hook = rand_str();
		$args = array( rand_str() );
		$ts1 = strtotime( '+3 minutes' );
		$ts2 = strtotime( '+30 minutes' );

		// first one works
		wp_schedule_single_event( $ts1, $hook, $args );
		// second works too
		wp_schedule_single_event( $ts2, $hook, $args );

		// the next event should be at +3 minutes
		$this->assertEquals( $ts1, wp_next_scheduled( $hook, $args ) );
		wp_unschedule_event( $ts1, $hook, $args );
		// following event should be there too
		$this->assertEquals( $ts2, wp_next_scheduled( $hook, $args ) );
	}
}

/*
 * Disable the WP Cron running test for the moment as it kills the whole test suite.
 * TODO - Fix it to work with the new cron implementation in trunk
 *
class WPTestCronRunning extends _WPEmptyBlog {
	function setUp() {
		parent::setUp();
		// make sure the schedule is clear
		_set_cron_array(array());
	}

	function tearDown() {
		parent::tearDown();
		// make sure the schedule is clear
		_set_cron_array(array());
	}
	function _do_cron() {
		// FIXME: wp-cron.php is difficult to test, could be wrapped in a function
		$_GET['check'] = wp_hash('187425');
		require(ABSPATH.'/wp-cron.php');
	}

	function test_run_schedule_single() {
		// schedule an event, run it, and make sure the hook is called
		$hook = rand_str();
		$args = array(rand_str());
		$timestamp = strtotime('-1 second');

		// register a test action
		$a = new MockAction();
		add_action($hook, array(&$a, 'action'));

		// schedule an event for 1 second ago
		wp_schedule_single_event( $timestamp, $hook, $args );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );

		// run cron jobs
		$this->_do_cron();

		// our action should have been called once with the correct args
		$this->assertEquals( 1, $a->get_call_count() );
		$this->assertEquals( array($args), $a->get_args() );

		// it shouldn't appear in the schedule anymore
		$this->assertFalse( wp_next_scheduled($hook, $args) );

	}

	function test_run_schedule_recurring() {
		// schedule a recurring event, run it, and make sure the hook is called
		$hook = rand_str();
		$args = array(rand_str());
		$timestamp = strtotime('-1 second');
		$recur = 'hourly';

		// register a test action
		$a = new MockAction();
		add_action($hook, array(&$a, 'action'));

		// schedule an event for 1 second ago
		wp_schedule_event( $timestamp, $recur, $hook, $args );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );
		$this->assertEquals( $recur, wp_get_schedule($hook, $args) );

		// run cron jobs
		$this->_do_cron();

		// our action should have been called once with the correct args
		$this->assertEquals( 1, $a->get_call_count() );
		$this->assertEquals( array($args), $a->get_args() );

		// it should appear in the schedule to run again in an hour's time
		$this->assertEquals( $timestamp + 3600, wp_next_scheduled($hook, $args) );

	}
}
*/
