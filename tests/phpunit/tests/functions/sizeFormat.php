<?php

/**
 * Tests for size_format()
 *
 * @group functions.php
 * @ticket 36635
 */
class Tests_Functions_Size_Format extends WP_UnitTestCase {
	public function _data_size_format() {
		return array(
			array( array(), 0, false ),
			array( 'baba', 0, false ),
			array( '', 0, false ),
			array( '-1', 0, false ),
			array( -1, 0, false ),
			array( 0, 0, '0 B' ),
			array( 1, 0, '1 B' ),
			array( 1023, 0, '1,023 B' ),
			array( KB_IN_BYTES, 0, '1 KB' ),
			array( KB_IN_BYTES, 2, '1.00 KB' ),
			array( 2.5 * KB_IN_BYTES, 0, '3 KB' ),
			array( 2.5 * KB_IN_BYTES, 2, '2.50 KB' ),
			array( 10 * KB_IN_BYTES, 0, '10 KB' ),
			array( (string) 1024 * KB_IN_BYTES, 2, '1.00 MB' ),
			array( MB_IN_BYTES, 0, '1 MB' ),
			array( 2.5 * MB_IN_BYTES, 0, '3 MB' ),
			array( 2.5 * MB_IN_BYTES, 2, '2.50 MB' ),
			array( (string) 1024 * MB_IN_BYTES, 2, '1.00 GB' ),
			array( GB_IN_BYTES, 0, '1 GB' ),
			array( 2.5 * GB_IN_BYTES, 0, '3 GB' ),
			array( 2.5 * GB_IN_BYTES, 2, '2.50 GB' ),
			array( (string) 1024 * GB_IN_BYTES, 2, '1.00 TB' ),
			array( TB_IN_BYTES, 0, '1 TB' ),
			array( 2.5 * TB_IN_BYTES, 0, '3 TB' ),
			array( 2.5 * TB_IN_BYTES, 2, '2.50 TB' ),
			array( TB_IN_BYTES + (TB_IN_BYTES/2) + MB_IN_BYTES, 1, '1.5 TB' ),
			array( TB_IN_BYTES - MB_IN_BYTES - KB_IN_BYTES, 3, '1,023.999 GB' ),
		);
	}

	/**
	 * @dataProvider _data_size_format
	 *
	 * @param $bytes
	 * @param $decimals
	 * @param $expected
	 */
	public function test_size_format( $bytes, $decimals, $expected ) {
		$this->assertSame( $expected, size_format( $bytes, $decimals ) );
	}
}
