<?php

/**
 * Test export functions
 *
 * @group export
 * @ticket 22435
 */
class Test_WP_Export_Functions extends WP_UnitTestCase {
	function test_wp_export_returns_wp_error_if_the_writer_throws_Export_exception() {
		$this->assertTrue( is_wp_error( wp_export( array( 'writer' => 'Test_WP_Export_Stub_Writer_Throws_Export_Exception' ) ) ) );
	}

	function test_wp_export_passes_the_exception_if_the_writer_throws_other_exception() {
		$this->setExpectedException( 'Exception' );
		wp_export( array( 'writer' => 'Test_WP_Export_Stub_Writer_Throws_Other_Exception' ) );
	}

}

class Test_WP_Export_Stub_Writer_Throws_Export_Exception {
	function __construct( $formatter ) {
	}
	function export() {
		throw new WP_Export_Exception( 'baba' );
	}
}

class Test_WP_Export_Stub_Writer_Throws_Other_Exception {
	function __construct( $formatter ) {
	}
	function export() {
		throw new Exception( 'baba' );
	}
}
