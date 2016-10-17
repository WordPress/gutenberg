<?php

/**
 * @group date
 * @group datetime
 */
class Tests_Date_I18n extends WP_UnitTestCase {
	public function test_should_format_date() {
		$expected = date( 'Y-m-d H:i:s' );
		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s' ) );
	}

	public function test_should_use_custom_timestamp() {
		$expected = '2012-12-01 00:00:00';

		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', strtotime( '2012-12-01 00:00:00' ) ) );
	}

	public function test_date_should_be_in_gmt() {
		$expected = date( 'Y-m-d H:i:s' );

		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', false, true ) );
	}

	public function test_custom_timestamp_ignores_gmt_setting() {
		$expected = '2012-12-01 00:00:00';

		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', strtotime( '2012-12-01 00:00:00' ), false ) );
	}

	public function test_custom_timezone_setting() {
		update_option( 'timezone_string', 'Europe/London' );
		$expected = date( 'Y-m-d H:i:s', strtotime( date( 'Y-m-d H:i:s' ) ) + HOUR_IN_SECONDS );

		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s' ) );
	}

	public function test_date_should_be_in_gmt_with_custom_timezone_setting() {
		update_option( 'timezone_string', 'Europe/London' );
		$expected = date( 'Y-m-d H:i:s' );

		$this->assertNotEquals( date_i18n( 'Y-m-d H:i:s', false, false ), date_i18n( 'Y-m-d H:i:s', false, true ) );
		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', false, true ) );
	}

	public function test_date_should_be_in_gmt_with_custom_timezone_setting_and_timestamp() {
		update_option( 'timezone_string', 'Europe/London' );

		$expected = '2012-12-01 00:00:00';

		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', strtotime( '2012-12-01 00:00:00' ), false ) );
		$this->assertEquals( $expected, date_i18n( 'Y-m-d H:i:s', strtotime( '2012-12-01 00:00:00' ), true ) );
	}

	public function test_adjusts_format_based_on_locale() {
		$original_locale = $GLOBALS['wp_locale'];
		/* @var WP_Locale $locale */
		$locale = clone $GLOBALS['wp_locale'];

		$locale->weekday[6] = 'Saturday_Translated';
		$locale->weekday_abbrev[ 'Saturday_Translated' ] = 'Sat_Translated';
		$locale->month[12] = 'December_Translated';
		$locale->month_abbrev[ 'December_Translated' ] = 'Dec_Translated';
		$locale->meridiem['am'] = 'am_Translated';
		$locale->meridiem['AM'] = 'AM_Translated';

		$GLOBALS['wp_locale'] = $locale;

		$expected = 'Saturday_Translated (Sat_Translated) 01 December_Translated (Dec_Translated) 00:00:00 am_Translated AM_Translated';
		$actual = date_i18n( 'l (D) d F (M) H:i:s a A', strtotime( '2012-12-01 00:00:00' ), false );

		// Restore original locale.
		$GLOBALS['wp_locale'] = $original_locale;

		$this->assertEquals( $expected, $actual );
	}

	public function test_adjusts_format_based_on_timezone_string() {
		update_option( 'timezone_string', 'Europe/Zurich' );

		$this->assertEquals( '2012-12-01 00:00:00 CEST +02:00 Europe/Zurich', date_i18n( 'Y-m-d H:i:s T P e', strtotime( '2012-12-01 00:00:00' ), false ) );
	}
}
