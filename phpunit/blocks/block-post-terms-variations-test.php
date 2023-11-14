<?php
/**
 * Post Terms block variations tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Post Terms block variations for taxonomies.
 *
 * @group blocks
 */
class Block_Post_Terms_Variations_Test extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		register_taxonomy(
			'book_type',
			array( 'post' ),
			array(
				'labels' => array(
					'name' => 'Book Type',
				),
			)
		);

		register_taxonomy(
			'private_book_type',
			array( 'post' ),
			array(
				'labels'             => array(
					'name' => 'Book Type',
				),
				'publicly_queryable' => false,
			)
		);
	}

	public function tear_down() {
		unregister_taxonomy( 'book_type' );
		unregister_taxonomy( 'private_book_type' );
		unregister_taxonomy( 'temp_book_type' );
		parent::tear_down();
	}

	/**
	 * @covers ::block_core_post_terms_register_taxonomy_variation
	 */
	public function test_post_terms_variations_custom_taxonomy() {
		$registry         = WP_Block_Type_Registry::get_instance();
		$post_terms_block = $registry->get_registered( 'core/post-terms' );
		$this->assertNotEmpty( $post_terms_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'book_type', $post_terms_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );
		$this->assertArrayHasKey( 'title', $variation, 'Block variation has no title' );
		$this->assertEquals( 'Book Type', $variation['title'], 'Variation title is different than the taxonomy label' );
	}

	/**
	 * @covers ::block_core_post_terms_register_taxonomy_variation
	 */
	public function test_post_terms_variations_custom_private_taxonomy() {
		$registry         = WP_Block_Type_Registry::get_instance();
		$post_terms_block = $registry->get_registered( 'core/post-terms' );
		$this->assertNotEmpty( $post_terms_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'private_book_type', $post_terms_block->variations );
		$this->assertEmpty( $variation, 'Block variation for private taxonomy exists.' );
	}

	/**
	 * @covers ::block_core_post_terms_unregister_taxonomy_variation
	 */
	public function test_post_terms_variations_unregister_taxonomy() {
		register_taxonomy(
			'temp_book_type',
			'custom_book',
			array(
				'labels' => array(
					'name' => 'Book Type',
				),
			)
		);

		$registry         = WP_Block_Type_Registry::get_instance();
		$post_terms_block = $registry->get_registered( 'core/post-terms' );
		$this->assertNotEmpty( $post_terms_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'temp_book_type', $post_terms_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );

		unregister_taxonomy( 'temp_book_type' );

		$variation = $this->get_variation_by_name( 'temp_book_type', $post_terms_block->variations );
		$this->assertEmpty( $variation, 'Block variation still exists' );
	}

	/**
	 * Get a variation by its name from an array of variations.
	 *
	 * @param string $variation_name The name (= slug) of the variation.
	 * @param array  $variations An array of variations.
	 * @return array|null The found variation or null.
	 */
	private function get_variation_by_name( $variation_name, $variations ) {
		$found_variation = null;
		foreach ( $variations as $variation ) {
			if ( $variation['name'] === $variation_name ) {
				$found_variation = $variation;
			}
		}

		return $found_variation;
	}
}
