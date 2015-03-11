<?php

/**
 * @group formatting
 */
class Tests_Formatting_UrlEncodedToEntities extends WP_UnitTestCase {
	/**
	 * @dataProvider data
	 */
	function test_convert_urlencoded_to_entities( $u_urlencoded, $entity ) {
		$this->assertEquals( $entity, preg_replace_callback('/\%u([0-9A-F]{4,5})/', '_convert_urlencoded_to_entities', $u_urlencoded ), $entity );
	}

	function data() {
		$input  = file( DIR_TESTDATA . '/formatting/utf-8/u-urlencoded.txt' );
		$output = file( DIR_TESTDATA . '/formatting/utf-8/entitized.txt' );
		$data_provided = array();
		foreach ( $input as $key => $value ) {
			$data_provided[] = array( trim( $value ), trim( $output[ $key ] ) );
		}
		return $data_provided;
	}
}

