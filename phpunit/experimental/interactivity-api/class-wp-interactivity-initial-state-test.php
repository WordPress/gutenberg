<?php
/**
 * `WP_Interactivity_Initial_State` class test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the `WP_Interactivity_Initial_State` class.
 *
 * @group  interactivity-api
 * @covers WP_Interactivity_Initial_State
 */
class WP_Interactivity_Initial_State_Test extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		WP_Interactivity_Initial_State::reset();
	}
	public function tear_down() {
		WP_Interactivity_Initial_State::reset();
		parent::tear_down();
	}

	public function test_initial_state_should_be_empty() {
		$this->assertEmpty( WP_Interactivity_Initial_State::get_data() );
	}

	public function test_initial_state_can_be_merged() {
		$state = array(
			'a'      => 1,
			'b'      => 2,
			'nested' => array(
				'c' => 3,
			),
		);
		WP_Interactivity_Initial_State::merge_state( 'core', $state );
		$this->assertSame( $state, WP_Interactivity_Initial_State::get_state( 'core' ) );
	}

	public function test_initial_state_can_be_extended() {
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => 1 ) );
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'b' => 2 ) );
		WP_Interactivity_Initial_State::merge_state( 'custom', array( 'c' => 3 ) );
		$this->assertSame(
			array(
				'core'   => array(
					'a' => 1,
					'b' => 2,
				),
				'custom' => array(
					'c' => 3,
				),
			),
			WP_Interactivity_Initial_State::get_data()
		);
	}

	public function test_initial_state_existing_props_should_be_overwritten() {
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => 1 ) );
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => 'overwritten' ) );
		$this->assertSame(
			array(
				'core' => array(
					'a' => 'overwritten',
				),
			),
			WP_Interactivity_Initial_State::get_data()
		);
	}

	public function test_initial_state_existing_indexed_arrays_should_be_replaced() {
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => array( 1, 2 ) ) );
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => array( 3, 4 ) ) );
		$this->assertSame(
			array(
				'core' => array(
					'a' => array( 3, 4 ),
				),
			),
			WP_Interactivity_Initial_State::get_data()
		);
	}

	public function test_initial_state_should_be_correctly_rendered() {
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'a' => 1 ) );
		WP_Interactivity_Initial_State::merge_state( 'core', array( 'b' => 2 ) );
		WP_Interactivity_Initial_State::merge_state( 'custom', array( 'c' => 3 ) );

		ob_start();
		WP_Interactivity_Initial_State::render();
		$rendered = ob_get_clean();
		$this->assertSame(
			'<script id="wp-interactivity-initial-state" type="application/json">{"core":{"a":1,"b":2},"custom":{"c":3}}</script>',
			$rendered
		);
	}

	public function test_initial_state_should_also_escape_tags_and_amps() {
		WP_Interactivity_Initial_State::merge_state(
			'test',
			array(
				'amps' => 'http://site.test/?foo=1&baz=2&bar=3',
				'tags' => 'Do not do this: <!-- <script>',
			)
		);
		ob_start();
		WP_Interactivity_Initial_State::render();
		$rendered = ob_get_clean();
		$this->assertSame(
			'<script id="wp-interactivity-initial-state" type="application/json">{"test":{"amps":"http:\/\/site.test\/?foo=1\u0026baz=2\u0026bar=3","tags":"Do not do this: \u003C!-- \u003Cscript\u003E"}}</script>',
			$rendered
		);
	}
}
