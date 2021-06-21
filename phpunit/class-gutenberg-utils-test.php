<?php
/**
 * Test Gutenberg Utils.
 *
 * @package Gutenberg
 */
class Gutenberg_Utils_Test extends WP_UnitTestCase {
	/**
	 * Test gutenberg_experimental_set() with simple non subtree path.
	 */
	public function test_simple_not_subtree_set() {
		$test_array = array();
		gutenberg_experimental_set( $test_array, array( 'a' ), 1 );
		$this->assertSame(
			$test_array,
			array( 'a' => 1 )
		);

		$test_array = array( 'a' => 2 );
		gutenberg_experimental_set( $test_array, array( 'a' ), 3 );
		$this->assertSame(
			$test_array,
			array( 'a' => 3 )
		);

		$test_array = array( 'b' => 1 );
		gutenberg_experimental_set( $test_array, array( 'a' ), 3 );
		$this->assertSame(
			$test_array,
			array(
				'b' => 1,
				'a' => 3,
			)
		);
	}

	/**
	 * Test gutenberg_experimental_set() with subtree paths.
	 */
	public function test_subtree_set() {
		$test_array = array();
		gutenberg_experimental_set( $test_array, array( 'a', 'b', 'c' ), 1 );
		$this->assertSame(
			$test_array,
			array( 'a' => array( 'b' => array( 'c' => 1 ) ) )
		);

		$test_array = array( 'b' => 3 );
		gutenberg_experimental_set( $test_array, array( 'a', 'b', 'c' ), 1 );
		$this->assertSame(
			$test_array,
			array(
				'b' => 3,
				'a' => array( 'b' => array( 'c' => 1 ) ),
			)
		);

		$test_array = array(
			'b' => 3,
			'a' => 1,
		);
		gutenberg_experimental_set( $test_array, array( 'a', 'b', 'c' ), 1 );
		$this->assertSame(
			$test_array,
			array(
				'b' => 3,
				'a' => array( 'b' => array( 'c' => 1 ) ),
			)
		);

		$test_array = array(
			'b' => 3,
			'a' => array(),
		);
		gutenberg_experimental_set( $test_array, array( 'a', 'b', 'c' ), 1 );
		$this->assertSame(
			$test_array,
			array(
				'b' => 3,
				'a' => array( 'b' => array( 'c' => 1 ) ),
			)
		);
	}

	/**
	 * Test gutenberg_experimental_set() with invalid parameters.
	 */
	public function test_invalid_parameters_set() {
		$test = 3;
		gutenberg_experimental_set( $test, array( 'a' ), 1 );
		$this->assertSame(
			$test,
			3
		);

		$test_array = array( 'a' => 2 );
		gutenberg_experimental_set( $test_array, 'a', 3 );
		$this->assertSame(
			$test_array,
			array( 'a' => 2 )
		);

		$test_array = array( 'a' => 2 );
		gutenberg_experimental_set( $test_array, null, 3 );
		$this->assertSame(
			$test_array,
			array( 'a' => 2 )
		);

		$test_array = array( 'a' => 2 );
		gutenberg_experimental_set( $test_array, array(), 3 );
		$this->assertSame(
			$test_array,
			array( 'a' => 2 )
		);

		$test_array = array( 'a' => 2 );
		gutenberg_experimental_set( $test_array, array( 'a', array() ), 3 );
		$this->assertSame(
			$test_array,
			array( 'a' => 2 )
		);
	}

	public function test_gutenberg_experimental_to_kebab_case() {
		$this->assertEquals( 'white', gutenberg_experimental_to_kebab_case( 'white' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white+black' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white:black' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white*black' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white.black' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white black' ) );
		$this->assertEquals( 'white-black', gutenberg_experimental_to_kebab_case( 'white	black' ) );
		$this->assertEquals( 'white-to-black', gutenberg_experimental_to_kebab_case( 'white-to-black' ) );
		$this->assertEquals( 'white-2-white', gutenberg_experimental_to_kebab_case( 'white2white' ) );
		$this->assertEquals( 'white-2nd', gutenberg_experimental_to_kebab_case( 'white2nd' ) );
		$this->assertEquals( 'white-2-ndcolor', gutenberg_experimental_to_kebab_case( 'white2ndcolor' ) );
		$this->assertEquals( 'white-2nd-color', gutenberg_experimental_to_kebab_case( 'white2ndColor' ) );
		$this->assertEquals( 'white-2nd-color', gutenberg_experimental_to_kebab_case( 'white2nd_color' ) );
		$this->assertEquals( 'white-23-color', gutenberg_experimental_to_kebab_case( 'white23color' ) );
		$this->assertEquals( 'white-23', gutenberg_experimental_to_kebab_case( 'white23' ) );
		$this->assertEquals( '23-color', gutenberg_experimental_to_kebab_case( '23color' ) );
		$this->assertEquals( 'white-4th', gutenberg_experimental_to_kebab_case( 'white4th' ) );
		$this->assertEquals( 'font-2-xl', gutenberg_experimental_to_kebab_case( 'font2xl' ) );
		$this->assertEquals( 'white-to-white', gutenberg_experimental_to_kebab_case( 'whiteToWhite' ) );
		$this->assertEquals( 'white-t-owhite', gutenberg_experimental_to_kebab_case( 'whiteTOwhite' ) );
		$this->assertEquals( 'whit-eto-white', gutenberg_experimental_to_kebab_case( 'WHITEtoWHITE' ) );
		$this->assertEquals( '42', gutenberg_experimental_to_kebab_case( 42 ) );
		$this->assertEquals( 'ive-done', gutenberg_experimental_to_kebab_case( "i've done" ) );
		$this->assertEquals( 'ffffff', gutenberg_experimental_to_kebab_case( '#ffffff' ) );
		$this->assertEquals( 'ffffff', gutenberg_experimental_to_kebab_case( '$ffffff' ) );
	}
}
