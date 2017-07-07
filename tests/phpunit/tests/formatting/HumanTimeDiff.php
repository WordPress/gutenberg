<?php

/**
 * @group formatting
 * @ticket 38773
 */
class Tests_Formatting_HumanTimeDiff extends WP_UnitTestCase {

	/**
	 * @group formatting
	 * @ticket 38773
	 * @dataProvider data_test_human_time_diff
	 */
	function test_human_time_diff( $expected, $stopdate, $message ) {
		$startdate = new DateTime( '2016-01-01 12:00:00' );
		$this->assertEquals( $expected, human_time_diff( $startdate->format( 'U' ), $stopdate->format( 'U' ) ), $message );
	}

	// Data for test_human_time_diff.
	function data_test_human_time_diff() {
		return array(
			array(
				'5 mins',
				new DateTime( '2016-01-01 12:05:00' ),
				'Test a difference of 5 minutes.',
			),
			array(
				'1 hour',
				new DateTime( '2016-01-01 13:00:00' ),
				'Test a difference of 1 hour.',
			),
			array(
				'2 days',
				new DateTime( '2016-01-03 12:00:00' ),
				'Test a difference of 2 days.',
			),
			array(
				'2 hours',
				new DateTime( '2016-01-01 14:29:59' ),
				'Test a difference of 2 hours, 29 minutes and 59 seconds  - should round down to 2 hours.',
			),
			array(
				'3 hours',
				new DateTime( '2016-01-01 14:30:00' ),
				'Test a difference of 2 hours and 30 minutes - should round up to 3 hours.',
			),
			array(
				'2 months',
				new DateTime( '2016-02-15 12:00:00' ),
				'Test a difference of 1 month and 15 days - should round up to 2 months.',
			),
			array(
				'1 month',
				new DateTime( '2016-02-14 12:00:00' ),
				'Test a difference of 1 month and 14 days - should round down to 1 month.',
			),
			array(
				'3 years',
				new DateTime( '2018-07-02 12:00:00' ),
				'Test a difference of 2 years 6 months and 1 day, should round up to 3 years.',
			),
			array(
				'2 years',
				new DateTime( '2018-07-01 12:00:00' ),
				'Test a difference of 2 years 6 months, should round down to 2 years.',
			),
		);
	}
}
