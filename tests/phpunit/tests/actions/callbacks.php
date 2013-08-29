<?php

/**
 * @group hooks
 */
class Tests_Actions_Callbacks extends WP_UnitTestCase {

	/**
	 * @ticket 23265
	 */
	function test_callback_representations() {
		$tag = __FUNCTION__;

		$this->assertFalse( has_action( $tag ) );

		add_action( $tag, array( 'Class', 'method' ) );

		$this->assertEquals( 10, has_action( $tag, array( 'Class', 'method' ) ) );

		$this->assertEquals( 10, has_action( $tag, 'Class::method' ) );
	}
}
