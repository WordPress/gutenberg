<?php

/**
 * Test WP_Export_*_Writer classes
 *
 * @group export
 * @ticket 22435
 */
class Test_WP_Export_Writers extends WP_UnitTestCase {
	function test_export_returner_returns_all_the_return_values() {
		$returner = new WP_Export_Returner( $this->get_x_formatter() );
		$this->assertEquals( 'xxx' , $returner->export() );
	}

	private function get_x_formatter() {
		$methods = array( 'before_posts', 'posts', 'after_posts' );
		$formatter = $this->getMock( 'WP_Export_WXR_Formatter', $methods, array( null ) );
		foreach( $methods as $method ) {
			$return = 'posts' == $method? array( 'x' ) : 'x';
			$formatter->expects( $this->once() )->method( $method )->with()->will( $this->returnValue( $return ) );
		}
		return $formatter;
	}
}

