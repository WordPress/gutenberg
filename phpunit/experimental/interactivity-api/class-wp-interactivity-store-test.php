<?php
/**
 * `WP_Interactivity_Store` class test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the `WP_Interactivity_Store` class.
 *
 * @group  interactivity-api
 * @covers WP_Interactivity_Store
 */
class WP_Interactivity_Store_Test extends WP_UnitTestCase {
	public function set_up() {
		// Clear the state before each test.
		WP_Interactivity_Store::reset();
	}

	public function test_store_should_be_empty() {
		$this->assertEmpty( WP_Interactivity_Store::get_data() );
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
		WP_Interactivity_Store::merge_data( $data );
		$this->assertSame( $data, WP_Interactivity_Store::get_data() );
	}

	public function test_store_can_be_extended() {
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Interactivity_Store::merge_data(
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
			WP_Interactivity_Store::get_data()
		);
	}

	public function test_store_existing_props_should_be_overwritten() {
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Interactivity_Store::merge_data(
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
			WP_Interactivity_Store::get_data()
		);
	}

	public function test_store_existing_indexed_arrays_should_be_replaced() {
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => array( 1, 2 ),
					),
				),
			)
		);
		WP_Interactivity_Store::merge_data(
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
			WP_Interactivity_Store::get_data()
		);
	}

	public function test_store_should_be_correctly_rendered() {
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'a' => 1,
					),
				),
			)
		);
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'core' => array(
						'b' => 2,
					),
				),
			)
		);
		ob_start();
		WP_Interactivity_Store::render();
		$rendered = ob_get_clean();
		$this->assertSame(
			'<script id="wp-interactivity-store-data" type="application/json">{"state":{"core":{"a":1,"b":2}}}</script>',
			$rendered
		);
	}

	public function test_store_should_also_escape_tags_and_amps() {
		WP_Interactivity_Store::merge_data(
			array(
				'state' => array(
					'amps' => 'http://site.test/?foo=1&baz=2&bar=3',
					'tags' => 'Do not do this: <!-- <script>',
				),
			)
		);
		ob_start();
		WP_Interactivity_Store::render();
		$rendered = ob_get_clean();
		$this->assertSame(
			'<script id="wp-interactivity-store-data" type="application/json">{"state":{"amps":"http:\/\/site.test\/?foo=1\u0026baz=2\u0026bar=3","tags":"Do not do this: \u003C!-- \u003Cscript\u003E"}}</script>',
			$rendered
		);
	}
}
