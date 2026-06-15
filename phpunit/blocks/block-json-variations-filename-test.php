<?php
/**
 * Test for the block.json's variations field being a PHP file.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Test that block variations can be registered from a PHP file.
 *
 * @group blocks
 */
class Block_Json_Variations_Filename_Test extends WP_UnitTestCase {
	/**
	 * Tear down each test method.
	 */
	public function tear_down() {
		$registry = WP_Block_Type_Registry::get_instance();

		if ( $registry->is_registered( 'my-plugin/notice' ) ) {
			$registry->unregister( 'my-plugin/notice' );
		}

		parent::tear_down();
	}

	/**
	 * Tests registering a block with variations from a PHP file.
	 *
	 * @covers ::register_block_type_from_metadata
	 */
	public function test_register_block_type_from_metadata_with_variations_php_file() {
		$filter_metadata_registration = static function ( $metadata ) {
			$metadata['variations'] = 'file:./variations.php';
			return $metadata;
		};

		add_filter( 'block_type_metadata', $filter_metadata_registration, 10, 2 );
		$result = register_block_type_from_metadata( GUTENBERG_DIR_TESTFIXTURES );
		remove_filter( 'block_type_metadata', $filter_metadata_registration );

		$this->assertInstanceOf( 'WP_Block_Type', $result, 'The block was not registered' );

		$expected_variations = require GUTENBERG_DIR_TESTFIXTURES . '/variations.php';
		$this->assertSame( $expected_variations, $result->variations, "Block variations haven't been set correctly." );
	}
}
