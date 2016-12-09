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
		$hook = __FUNCTION__;
		$this->assertFalse(wp_get_schedule($hook));
	}

	function test_schedule_event_single() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = __FUNCTION__;
		$timestamp = strtotime('+1 hour');

		wp_schedule_single_event( $timestamp, $hook );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook) );

		// it's a non recurring event
		$this->assertEquals( '', wp_get_schedule($hook) );

	}

	function test_schedule_event_single_args() {
		// schedule an event with arguments and make sure it's returned by wp_next_scheduled
		$hook = 'event';
		$timestamp = strtotime('+1 hour');
		$args = array('foo');

		wp_schedule_single_event( $timestamp, $hook, $args );
		// this returns the timestamp only if we provide matching args
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );
		// these don't match so return nothing
		$this->assertEquals( false, wp_next_scheduled($hook) );
		$this->assertEquals( false, wp_next_scheduled($hook, array('bar')) );

		// it's a non recurring event
		$this->assertEquals( '', wp_get_schedule($hook, $args) );
	}

	function test_schedule_event() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = __FUNCTION__;
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
		$hook = 'event';
		$timestamp = strtotime('+1 hour');
		$recur = 'hourly';
		$args = array('foo');

		wp_schedule_event( $timestamp, 'hourly', $hook, $args );
		// this returns the timestamp only if we provide matching args
		$this->assertEquals( $timestamp, wp_next_scheduled($hook, $args) );
		// these don't match so return nothing
		$this->assertEquals( false, wp_next_scheduled($hook) );
		$this->assertEquals( false, wp_next_scheduled($hook, array('bar')) );

		$this->assertEquals( $recur, wp_get_schedule($hook, $args) );

	}

	function test_unschedule_event() {
		// schedule an event and make sure it's returned by wp_next_scheduled
		$hook = __FUNCTION__;
		$timestamp = strtotime('+1 hour');

		wp_schedule_single_event( $timestamp, $hook );
		$this->assertEquals( $timestamp, wp_next_scheduled($hook) );

		// now unschedule it and make sure it's gone
		wp_unschedule_event( $timestamp, $hook );
		$this->assertEquals( false, wp_next_scheduled($hook) );
	}

	function test_clear_schedule() {
		$hook = __FUNCTION__;
		$args = array( 'arg1' );

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
		$hook = __FUNCTION__;
		$args = array( 'arg1', 'arg2' );

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
		$hook = __FUNCTION__;
		$args = array( 'arg1' );
		$multi_hook = __FUNCTION__ . '_multi';
		$multi_args = array( 'arg2', 'arg3' );

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
		$hook = __FUNCTION__;
		$args = array( 'arg1' );
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
		$hook = __FUNCTION__;
		$args = array( 'arg1' );
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
		$hook = __FUNCTION__;
		$args = array( 'arg1' );
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
