<?php

/**
 * @group formatting
 * @ticket 22300
 */
class Tests_Formatting_UrlencodeDeep extends WP_UnitTestCase {

	/**
	 * Data Provider
	 */
	public function data_test_values() {
		return array(
			array( 'qwerty123456', 'qwerty123456' ),
			array( '|!"£$%&/()=?', '%7C%21%22%C2%A3%24%25%26%2F%28%29%3D%3F' ),
			array( '^é*ç°§;:_-.,', '%5E%C3%A9%2A%C3%A7%C2%B0%C2%A7%3B%3A_-.%2C' ),
			array( 'abc123 @#[]€', 'abc123+%40%23%5B%5D%E2%82%AC' ),
			array( 'abc123 @#[]€', urlencode( 'abc123 @#[]€' ) ),
		);
	}

	/**
	 * Validate the urlencode_deep function pair by pair
	 *
	 * @dataProvider data_test_values
	 *
	 * @param string $actual
	 * @param string $expected
	 */
	public function test_urlencode_deep_should_encode_individual_value( $actual, $expected ) {
		$this->assertEquals( $expected, urlencode_deep( $actual ) );
	}

	/**
	 * Test the whole array as input
	 */
	public function test_urlencode_deep_should_encode_all_values_in_array() {
		$data = $this->data_test_values();

		$actual   = wp_list_pluck( $data, 0 );
		$expected = wp_list_pluck( $data, 1 );

		$this->assertEquals( $expected, urlencode_deep( $actual ) );
	}

}
