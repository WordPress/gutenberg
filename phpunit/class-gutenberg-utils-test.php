<?php
/**
 * Test Gutenberg Utils.
 *
 * @package Gutenberg
 */

/**
 * Test WP_Theme_JSON class.
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

	/**
	 * Test gutenberg_get_minified_styles().
	 */
	public function test_gutenberg_get_minified_styles() {
		$cases = array(
			array(
				'in'  => '
/**
 * Comment
 */
          .foo      {
			  bar:  		1;
		  }
			',
				'out' => '.foo{bar:1}',
			),
			array(
				'in'  => '/* Comment */#foo{content:" ";  bar:   0;
				  }',
				'out' => '#foo{content:" ";bar:0}',
			),
		);

		foreach ( $cases as $case ) {
			$this->assertSame(
				gutenberg_get_minified_styles( $case['in'] ),
				$case['out']
			);
		}
	}
}
