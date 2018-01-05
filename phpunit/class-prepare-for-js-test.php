<?php
/**
 * Block types registration Tests
 *
 * @package Gutenberg
 */

/**
 * Test gutenberg_prepare_blocks_for_js()
 */
class Prepare_For_JS_Test extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();

		$this->reset();
	}

	function tearDown() {
		parent::tearDown();

		$this->reset();
	}

	function reset() {
		foreach ( WP_Block_Type_Registry::get_instance()->get_all_registered() as $name => $block_type ) {
			WP_Block_Type_Registry::get_instance()->unregister( $name );
		}
	}

	function test_gutenberg_prepare_blocks_for_js() {
		$name     = 'core/paragraph';
		$settings = array(
			'icon'            => 'text',
			'render_callback' => 'foo',
		);

		register_block_type( $name, $settings );

		$blocks = gutenberg_prepare_blocks_for_js();

		$this->assertEquals( array(
			'core/paragraph' => array(
				'icon' => 'text',
			),
		), $blocks );
	}
}
