<?php
/**
 * Navigation block post type/taxonomies variations tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation block variations for post types.
 *
 * @group blocks
 */
class Block_Navigation_Link_Variations_Test extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();
		register_post_type(
			'custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Custom Book',
				),
				'public'            => true,
				'show_in_rest'      => true,
				'show_in_nav_menus' => true,
			)
		);
		register_post_type(
			'private_custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Custom Book',
				),
				'public'            => false,
				'show_in_rest'      => true,
				'show_in_nav_menus' => false,
			)
		);
		register_taxonomy(
			'book_type',
			'custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => true,
			)
		);
		register_taxonomy(
			'private_book_type',
			'private_custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => false,
			)
		);
	}

	public function tear_down() {
		unregister_post_type( 'custom_book' );
		unregister_post_type( 'private_custom_book' );
		unregister_taxonomy( 'book_type' );
		unregister_taxonomy( 'private_book_type' );
		unregister_post_type( 'temp_custom_book' );
		unregister_taxonomy( 'temp_book_type' );
		parent::tear_down();
	}

	/**
	 * @covers ::block_core_navigation_link_register_post_type_variation
	 */
	public function test_navigation_link_variations_custom_post_type() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'custom_book', $nav_link_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );
		$this->assertArrayHasKey( 'title', $variation, 'Block variation has no title' );
		$this->assertEquals( 'Custom Book', $variation['title'], 'Variation title is different than the post type label' );
	}

	/**
	 * @covers ::block_core_navigation_link_register_post_type_variation
	 */
	public function test_navigation_link_variations_private_custom_post_type() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'private_custom_book', $nav_link_block->variations );
		$this->assertEmpty( $variation, 'Block variation for private post type exists.' );
	}

	/**
	 * @covers ::block_core_navigation_link_register_taxonomy_variation
	 */
	public function test_navigation_link_variations_custom_taxonomy() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'book_type', $nav_link_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );
		$this->assertArrayHasKey( 'title', $variation, 'Block variation has no title' );
		$this->assertEquals( 'Book Type', $variation['title'], 'Variation title is different than the post type label' );
	}

	/**
	 * @covers ::block_core_navigation_link_register_taxonomy_variation
	 */
	public function test_navigation_link_variations_private_custom_taxonomy() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'private_book_type', $nav_link_block->variations );
		$this->assertEmpty( $variation, 'Block variation for private taxonomy exists.' );
	}

	/**
	 * @covers ::block_core_navigation_link_unregister_post_type_variation
	 */
	public function test_navigation_link_variations_unregister_post_type() {
		register_post_type(
			'temp_custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Custom Book',
				),
				'public'            => true,
				'show_in_rest'      => true,
				'show_in_nav_menus' => true,
			)
		);

		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'temp_custom_book', $nav_link_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );

		unregister_post_type( 'temp_custom_book' );

		$variation = $this->get_variation_by_name( 'temp_custom_book', $nav_link_block->variations );
		$this->assertEmpty( $variation, 'Block variation still exists' );
	}

	/**
	 * @covers ::block_core_navigation_link_unregister_taxonomy_variation
	 */
	public function test_navigation_link_variations_unregister_taxonomy() {
		register_taxonomy(
			'temp_book_type',
			'custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => true,
			)
		);

		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		$this->assertNotEmpty( $nav_link_block->variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'temp_book_type', $nav_link_block->variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );

		unregister_taxonomy( 'temp_book_type' );

		$variation = $this->get_variation_by_name( 'temp_book_type', $nav_link_block->variations );
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
