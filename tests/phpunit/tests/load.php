<?php

/**
 * @group load
 */
class Tests_Load extends WP_UnitTestCase {

	public function setUp() {
		parent::setUp();
		ini_set( 'magic_quotes_sybase', 1 );
	}

	public function tearDown() {
		unset( $_GET['ticket_19455'] );
		unset( $_POST['ticket_19455'] );
		unset( $_COOKIE['ticket_19455'] );
		unset( $_SERVER['ticket_19455'] );
		ini_set( 'magic_quotes_sybase', 0 );
		parent::tearDown();
	}

	public function data_strings_and_expected_strings() {
		return array(
			array( 'A string with no quotes', 'A string with no quotes' ),
			array( "Charlie's Little Cat", "Charlie\\'s Little Cat" ),
			array( "A string with many quotes''''''", "A string with many quotes\\'\\'\\'\\'\\'\\'" ),
			array(
				"A string with quotes ' in '' different ''' places''''",
				"A string with quotes \\' in \\'\\' different \\'\\'\\' places\\'\\'\\'\\'"
			),
			array( "A string with 'quoted' words", "A string with \\'quoted\\' words" ),
		);
	}

	/**
	 * String in $_GET array is modified as expected
	 *
	 * @dataProvider data_strings_and_expected_strings
	 * @ticket 19455
	 */
	public function test_string_in_GET_array_is_modified_as_expected( $original, $expected ) {
		$_GET['ticket_19455'] = $original;

		wp_magic_quotes();

		$this->assertEquals( $expected, $_GET['ticket_19455'] );
	}

	/**
	 * String in $_POST array is modified as expected
	 *
	 * @dataProvider data_strings_and_expected_strings
	 * @ticket 19455
	 */
	public function test_string_in_POST_array_is_modified_as_expected( $original, $expected ) {
		$_POST['ticket_19455'] = $original;

		wp_magic_quotes();

		$this->assertEquals( $expected, $_POST['ticket_19455'] );
	}

	/**
	 * String in $_COOKIE array is modified as expected
	 *
	 * @dataProvider data_strings_and_expected_strings
	 * @ticket 19455
	 */
	public function test_string_in_COOKIE_array_is_modified_as_expected( $original, $expected ) {
		$_COOKIE['ticket_19455'] = $original;

		wp_magic_quotes();

		$this->assertEquals( $expected, $_COOKIE['ticket_19455'] );
	}

	/**
	 * String in $_SERVER array is modified as expected
	 *
	 * @dataProvider data_strings_and_expected_strings
	 * @ticket 19455
	 */
	public function test_string_in_SERVER_array_is_modified_as_expected( $original, $expected ) {
		$_SERVER['ticket_19455'] = $original;

		wp_magic_quotes();

		$this->assertEquals( $expected, $_SERVER['ticket_19455'] );
	}

}
