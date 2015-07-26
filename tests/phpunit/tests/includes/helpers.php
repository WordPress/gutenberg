<?php

/**
 * @group phpunit
 */
class Tests_TestHelpers extends WP_UnitTestCase {
	/**
	 * @ticket 30522
	 */
	function data_assertEqualSets() {
		return array(
			array(
				array( 1, 2, 3 ), // test expected
				array( 1, 2, 3 ), // test actual
				false             // exception expected
			),
			array(
				array( 1, 2, 3 ),
				array( 2, 3, 1 ),
				false
			),
			array(
				array( 1, 2, 3 ),
				array( 1, 2, 3, 4 ),
				true
			),
			array(
				array( 1, 2, 3, 4 ),
				array( 1, 2, 3 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 3, 4, 2, 1 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 1, 2, 3, 3 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 2, 3, 1, 3 ),
				true
			),
		);
	}

	/**
	 * @dataProvider data_assertEqualSets
	 * @ticket 30522
	 */
	function test_assertEqualSets( $expected, $actual, $exception ) {
		if ( $exception ) {
			try {
				$this->assertEqualSets( $expected, $actual );
			} catch ( PHPUnit_Framework_ExpectationFailedException $ex ) {
				return;
			}

			$this->fail();
		} else {
			$this->assertEqualSets( $expected, $actual );
		}
	}

	/**
	 * @ticket 30522
	 */
	function data_assertEqualSetsWithIndex() {
		return array(
			array(
				array( 1, 2, 3 ), // test expected
				array( 1, 2, 3 ), // test actual
				false             // exception expected
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				false
			),
			array(
				array( 1, 2, 3 ),
				array( 2, 3, 1 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'b' => 2, 'c' => 3, 'a' => 1 ),
				false
			),
			array(
				array( 1, 2, 3 ),
				array( 1, 2, 3, 4 ),
				true
			),
			array(
				array( 1, 2, 3, 4 ),
				array( 1, 2, 3 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'a' => 1, 'b' => 2, 'c' => 3, 'd' => 4 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3, 'd' => 4 ),
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 3, 4, 2, 1 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'c' => 3, 'b' => 2, 'd' => 4, 'a' => 1 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 1, 2, 3, 3 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'a' => 1, 'b' => 2, 'c' => 3, 'd' => 3 ),
				true
			),
			array(
				array( 1, 2, 3 ),
				array( 2, 3, 1, 3 ),
				true
			),
			array(
				array( 'a' => 1, 'b' => 2, 'c' => 3 ),
				array( 'c' => 3, 'b' => 2, 'd' => 3, 'a' => 1 ),
				true
			),
		);
	}
	/**
	 * @dataProvider data_assertEqualSetsWithIndex
	 * @ticket 30522
	 */
	function test_assertEqualSetsWithIndex( $expected, $actual, $exception ) {
		if ( $exception ) {
			try {
				$this->assertEqualSetsWithIndex( $expected, $actual );
			} catch ( PHPUnit_Framework_ExpectationFailedException $ex ) {
				return;
			}

			$this->fail();
		} else {
			$this->assertEqualSetsWithIndex( $expected, $actual );
		}
	}

	public function test__unregister_post_status() {
		register_post_status( 'foo' );
		_unregister_post_status( 'foo' );

		$stati = get_post_stati();

		$this->assertFalse( isset( $stati['foo'] ) );
	}

	/**
	 * @ticket 28486
	 */
	public function test_setExpectedDeprecated() {
		$this->setExpectedDeprecated( 'Tests_TestHelpers::mock_deprecated' );
		$this->mock_deprecated();
	}

	/**
	 * @ticket 28486
	 */
	public function test_setExpectedIncorrectUsage() {
		$this->setExpectedIncorrectUsage( 'Tests_TestHelpers::mock_incorrect_usage' );
		$this->mock_incorrect_usage();
	}

	/**
	 * @ticket 31417
	 */
	public function test_go_to_should_go_to_home_page_when_passing_the_untrailingslashed_home_url() {
		$this->assertFalse( is_home() );
		$home = untrailingslashit( get_option( 'home' ) );
		$this->go_to( $home );
		$this->assertTrue( is_home() );
	}

	protected function mock_deprecated() {
		_deprecated_function( __METHOD__, '2.5' );
	}

	protected function mock_incorrect_usage() {
		_doing_it_wrong( __METHOD__, __( 'Incorrect usage test' ), '2.5' );
	}
}
