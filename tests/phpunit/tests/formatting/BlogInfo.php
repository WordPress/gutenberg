<?php

/**
 * @group formatting
 */
class Tests_Formatting_BlogInfo extends WP_UnitTestCase {

	/**
	 * @dataProvider locales
	 * @ticket 28303
	 */
	function test_get_bloginfo_language( $test_locale, $expected ) {
		global $locale;

		$old_locale = $locale;

		$locale = $test_locale;
		$this->assertEquals( $expected, get_bloginfo( 'language' ) );

		$locale = $old_locale;
	}

	function locales() {
		return array(
			//     Locale          Language code
			array( 'en_US',        'en-US' ),
			array( 'ar',           'ar' ),
			array( 'de_DE',        'de-DE' ),
			array( 'de_DE_formal', 'de-DE-formal' ),
			array( 'oci',          'oci' ),
			array( 'pt_PT_ao1990', 'pt-PT-ao1990' ),
		);
	}
}
