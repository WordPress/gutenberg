<?php

/**
 * @group l10n
 * @group i18n
 */
class Tests_Locale extends WP_UnitTestCase {
	/**
	 * @var WP_Locale
	 */
	protected $locale;

	public function setUp() {
		$this->locale = new WP_Locale();
	}

	public function test_rtl_src_admin_notice() {
		$this->expectOutputRegex( '#<div class="error"><p>.*</p></div>#' );
		$this->locale->rtl_src_admin_notice();
	}

	public function test_get_weekday() {
		$this->assertEquals( __( 'Sunday' ),    $this->locale->get_weekday( 0 ) );
		$this->assertEquals( __( 'Monday' ),    $this->locale->get_weekday( 1 ) );
		$this->assertEquals( __( 'Tuesday' ),   $this->locale->get_weekday( 2 ) );
		$this->assertEquals( __( 'Wednesday' ), $this->locale->get_weekday( 3 ) );
		$this->assertEquals( __( 'Thursday' ),  $this->locale->get_weekday( 4 ) );
		$this->assertEquals( __( 'Friday' ),    $this->locale->get_weekday( 5 ) );
		$this->assertEquals( __( 'Saturday' ),  $this->locale->get_weekday( 6 ) );
	}

	/**
	 * @expectedException PHPUnit_Framework_Error_Notice
	 */
	public function test_get_weekday_undefined_index() {
		$this->locale->get_weekday( 7 );
	}

	public function test_get_weekday_initial() {
		$this->assertEquals( __( 'S' ), $this->locale->get_weekday_initial( __( 'Sunday' ) ) );
		$this->assertEquals( __( 'M' ), $this->locale->get_weekday_initial( __( 'Monday' ) ) );
		$this->assertEquals( __( 'T' ), $this->locale->get_weekday_initial( __( 'Tuesday' ) ) );
		$this->assertEquals( __( 'W' ), $this->locale->get_weekday_initial( __( 'Wednesday' ) ) );
		$this->assertEquals( __( 'T' ), $this->locale->get_weekday_initial( __( 'Thursday' ) ) );
		$this->assertEquals( __( 'F' ), $this->locale->get_weekday_initial( __( 'Friday' ) ) );
		$this->assertEquals( __( 'S' ), $this->locale->get_weekday_initial( __( 'Saturday' ) ) );
	}

	public function test_get_weekday_abbrev() {
		$this->assertEquals( __( 'Sun' ), $this->locale->get_weekday_abbrev( __( 'Sunday' ) ) );
		$this->assertEquals( __( 'Mon' ), $this->locale->get_weekday_abbrev( __( 'Monday' ) ) );
		$this->assertEquals( __( 'Tue' ), $this->locale->get_weekday_abbrev( __( 'Tuesday' ) ) );
		$this->assertEquals( __( 'Wed' ), $this->locale->get_weekday_abbrev( __( 'Wednesday' ) ) );
		$this->assertEquals( __( 'Thu' ), $this->locale->get_weekday_abbrev( __( 'Thursday' ) ) );
		$this->assertEquals( __( 'Fri' ), $this->locale->get_weekday_abbrev( __( 'Friday' ) ) );
		$this->assertEquals( __( 'Sat' ), $this->locale->get_weekday_abbrev( __( 'Saturday' ) ) );
	}

	public function test_get_month() {
		$this->assertEquals( __( 'January' ),   $this->locale->get_month( 1 ) );
		$this->assertEquals( __( 'February' ),  $this->locale->get_month( 2 ) );
		$this->assertEquals( __( 'March' ),     $this->locale->get_month( 3 ) );
		$this->assertEquals( __( 'April' ),     $this->locale->get_month( 4 ) );
		$this->assertEquals( __( 'May' ),       $this->locale->get_month( 5 ) );
		$this->assertEquals( __( 'June' ),      $this->locale->get_month( 6 ) );
		$this->assertEquals( __( 'July' ),      $this->locale->get_month( 7 ) );
		$this->assertEquals( __( 'August' ),    $this->locale->get_month( 8 ) );
		$this->assertEquals( __( 'September' ), $this->locale->get_month( 9 ) );
		$this->assertEquals( __( 'October' ),   $this->locale->get_month( 10 ) );
		$this->assertEquals( __( 'November' ),  $this->locale->get_month( 11 ) );
		$this->assertEquals( __( 'December' ),  $this->locale->get_month( 12 ) );
	}

	public function test_get_month_leading_zero() {
		$this->assertEquals( __( 'January' ),   $this->locale->get_month( '01' ) );
		$this->assertEquals( __( 'February' ),  $this->locale->get_month( '02' ) );
		$this->assertEquals( __( 'March' ),     $this->locale->get_month( '03' ) );
		$this->assertEquals( __( 'April' ),     $this->locale->get_month( '04' ) );
		$this->assertEquals( __( 'May' ),       $this->locale->get_month( '05' ) );
		$this->assertEquals( __( 'June' ),      $this->locale->get_month( '06' ) );
		$this->assertEquals( __( 'July' ),      $this->locale->get_month( '07' ) );
		$this->assertEquals( __( 'August' ),    $this->locale->get_month( '08' ) );
		$this->assertEquals( __( 'September' ), $this->locale->get_month( '09' ) );
	}

	public function test_get_month_abbrev() {
		$this->assertEquals( __( 'Jan' ), $this->locale->get_month_abbrev( __( 'January' ) ) );
		$this->assertEquals( __( 'Feb' ), $this->locale->get_month_abbrev( __( 'February' ) ) );
		$this->assertEquals( __( 'Mar' ), $this->locale->get_month_abbrev( __( 'March' ) ) );
		$this->assertEquals( __( 'Apr' ), $this->locale->get_month_abbrev( __( 'April' ) ) );
		$this->assertEquals( __( 'May' ), $this->locale->get_month_abbrev( __( 'May' ) ) );
		$this->assertEquals( __( 'Jun' ), $this->locale->get_month_abbrev( __( 'June' ) ) );
		$this->assertEquals( __( 'Jul' ), $this->locale->get_month_abbrev( __( 'July' ) ) );
		$this->assertEquals( __( 'Aug' ), $this->locale->get_month_abbrev( __( 'August' ) ) );
		$this->assertEquals( __( 'Sep' ), $this->locale->get_month_abbrev( __( 'September' ) ) );
		$this->assertEquals( __( 'Oct' ), $this->locale->get_month_abbrev( __( 'October' ) ) );
		$this->assertEquals( __( 'Nov' ), $this->locale->get_month_abbrev( __( 'November' ) ) );
		$this->assertEquals( __( 'Dec' ), $this->locale->get_month_abbrev( __( 'December' ) ) );
	}

	public function test_get_meridiem() {
		$this->assertEquals( __( 'am' ), $this->locale->get_meridiem( 'am' ) );
		$this->assertEquals( __( 'AM' ), $this->locale->get_meridiem( 'AM' ) );
		$this->assertEquals( __( 'pm' ), $this->locale->get_meridiem( 'pm' ) );
		$this->assertEquals( __( 'PM' ), $this->locale->get_meridiem( 'PM' ) );
	}

	public function test_is_rtl() {
		$this->assertFalse( $this->locale->is_rtl() );
		$this->locale->text_direction = 'foo';
		$this->assertFalse( $this->locale->is_rtl() );
		$this->locale->text_direction = 'rtl';
		$this->assertTrue( $this->locale->is_rtl() );
		$this->locale->text_direction = 'ltr';
		$this->assertFalse( $this->locale->is_rtl() );
	}
}
