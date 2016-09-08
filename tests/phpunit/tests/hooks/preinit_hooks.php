<?php

/**
 * Test the IteratorAggregate implementation of WP_Hook
 *
 * @group hooks
 */
class Tests_WP_Hook_Preinit_Hooks extends WP_UnitTestCase {

	public function test_array_to_hooks() {
		$tag1 = rand_str();
		$priority1 = rand( 1, 100 );
		$tag2 = rand_str();
		$priority2 = rand( 1, 100 );
		$filters = array(
			$tag1 => array(
				$priority1 => array(
					'test1' => array(
						'function' => '__return_false',
						'accepted_args' => 2,
					),
				),
			),
			$tag2 => array(
				$priority2 => array(
					'test1' => array(
						'function' => '__return_null',
						'accepted_args' => 1,
					),
				),
			),
		);

		$hooks = WP_Hook::build_preinitialized_hooks( $filters );

		$this->assertEquals( $priority1, $hooks[ $tag1 ]->has_filter( $tag1, '__return_false' ) );
		$this->assertEquals( $priority2, $hooks[ $tag2 ]->has_filter( $tag2, '__return_null' ) );
	}
}
