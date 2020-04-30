<?php
/**
 * Test WP_Block_List class.
 *
 * @package Gutenberg
 */

class WP_Block_List_Test extends WP_UnitTestCase {

	/**
	 * Fake block type registry.
	 *
	 * @var WP_Block_Type_Registry
	 */
	private $registry = null;

	/**
	 * Set up each test method.
	 */
	public function setUp() {
		parent::setUp();

		$this->registry = new WP_Block_Type_Registry();
		$this->registry->register( 'core/example', array() );
	}

	/**
	 * Tear down each test method.
	 */
	public function tearDown() {
		parent::tearDown();

		$this->registry = null;
	}

	function test_countable() {
		$parsed_blocks = parse_blocks( '<!-- wp:example /-->' );
		$context       = array();
		$blocks        = new WP_Block_List( $parsed_blocks, $context, $this->registry );

		$this->assertEquals( 1, count( $blocks ) );
	}

}
