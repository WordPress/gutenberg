<?php

/**
 * @group formatting
 * @group datetime
 */
class Tests_Formatting_Date extends WP_UnitTestCase {

	/**
	 * Unpatched, this test passes only when Europe/London is not observing DST.
	 *
	 * @ticket 20328
	 */
	function test_get_date_from_gmt_outside_of_dst() {
		update_option( 'timezone_string', 'Europe/London' );
		$gmt = $local = '2012-01-01 12:34:56';
		$this->assertEquals( $local, get_date_from_gmt( $gmt ) );
	}

	/**
	 * Unpatched, this test passes only when Europe/London is observing DST.
	 *
	 * @ticket 20328
	 */
	function test_get_date_from_gmt_during_dst() {
		update_option( 'timezone_string', 'Europe/London' );
		$gmt   = '2012-06-01 12:34:56';
		$local = '2012-06-01 13:34:56';
		$this->assertEquals( $local, get_date_from_gmt( $gmt ) );
	}

	/**
	 * @ticket 20328
	 */
	function test_get_gmt_from_date_outside_of_dst() {
		update_option( 'timezone_string', 'Europe/London' );
		$local = $gmt = '2012-01-01 12:34:56';
		$this->assertEquals( $gmt, get_gmt_from_date( $local ) );
	}

	/**
	 * @ticket 20328
	 */
	function test_get_gmt_from_date_during_dst() {
		update_option( 'timezone_string', 'Europe/London' );
		$local = '2012-06-01 12:34:56';
		$gmt = '2012-06-01 11:34:56';
		$this->assertEquals( $gmt, get_gmt_from_date( $local ) );
	}
}
