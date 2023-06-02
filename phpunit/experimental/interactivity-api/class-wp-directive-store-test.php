<?php
/**
 * `WP_Directive_Store` class test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the `WP_Directive_Store` class.
 *
 * @group  directives
 * @covers WP_Directive_Store
 */
class Tests_Directives_WPDirectiveStore extends WP_UnitTestCase {
	public function set_up() {
		// Clear the state before each test.
		WP_Directive_Store::reset();
	}

	public function test_store_should_be_empty() {
		$this->assertEmpty( WP_Directive_Store::get_data() );
	}

	public function test_store_can_be_merged() {
		$data = array(
			'state' => array(
				'core' => array(
					'a'      => 1,
					'b'      => 2,
					'nested' => array(
						'c' => 3,
					),
				),
			),
		);
		WP_Directive_Store::merge_data( $data );
		$this->assertSame( $data, WP_Directive_Store::get_data() );
	}

	public function test_store_can_be_extended() {
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core'   => array(
						'b' => 2,
					),
					'custom' => array(
						'c' => 3,
					),
				),
			)
		);
		$this->assertSame(
			array(
				'state' => array(
					'core'   => array(
						'a' => 1,
						'b' => 2,
					),
					'custom' => array(
						'c' => 3,
					),
				),
			),
			WP_Directive_Store::get_data()
		);
	}

	public function test_store_existing_props_should_be_overwritten() {
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 'overwritten',
					),
				),
			)
		);
		$this->assertSame(
			array(
				'state' => array(
					'core' => array(
						'a' => 'overwritten',
					),
				),
			),
			WP_Directive_Store::get_data()
		);
	}

	public function test_store_existing_indexed_arrays_should_be_replaced() {
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => array( 1, 2 ),
					),
				),
			)
		);
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => array( 3, 4 ),
					),
				),
			)
		);
		$this->assertSame(
			array(
				'state' => array(
					'core' => array(
						'a' => array( 3, 4 ),
					),
				),
			),
			WP_Directive_Store::get_data()
		);
	}

	public function test_store_should_be_correctly_rendered() {
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Directive_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'b' => 2,
					),
				),
			)
		);
		ob_start();
		WP_Directive_Store::render();
		$rendered = ob_get_clean();
		$this->assertSame(
			'<script id="wp-interactivity-store" type="application/json">{"state":{"core":{"a":1,"b":2}}}</script>',
			$rendered
		);
	}
}
