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

	/**
	 * Whether to use a shim/workaround for WordPress Core versions < 6.5.
	 * See https://github.com/WordPress/gutenberg/pull/58389 for details.
	 *
	 * @var bool
	 */
	private $pre_65_compat = false;

	public function set_up() {
		parent::set_up();

		$post_type         = register_post_type(
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
		$private_post_type = register_post_type(
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
		$taxonomy          = register_taxonomy(
			'book_type',
			'custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => true,
			)
		);
		$private_taxonomoy = register_taxonomy(
			'private_book_type',
			'private_custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => false,
			)
		);

		$this->pre_65_compat = ! method_exists( 'WP_Block_Type', 'get_variations' );

		/*
		 * In Core versions < 6.5, variations for post types/taxonomies registered after init#10 (= after the block type was registered)
		 * need to be manually registered.
		 * set_up runs after init#10, therefore register the variations here with the old deprecated functions.
		 *
		 * TODO: After two WP versions (6.7), we can remove this.
		 */
		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_post_type_variation_registration( $post_type );
			$this->handle_pre_65_post_type_variation_registration( $private_post_type );
			$this->handle_pre_65_taxonomy_variation_registration( $taxonomy );
			$this->handle_pre_65_taxonomy_variation_registration( $private_taxonomoy );
		}
	}

	public function tear_down() {
		unregister_post_type( 'custom_book' );
		unregister_post_type( 'private_custom_book' );
		unregister_taxonomy( 'book_type' );
		unregister_taxonomy( 'private_book_type' );
		unregister_post_type( 'temp_custom_book' );
		unregister_taxonomy( 'temp_book_type' );

		// See comment in set_up for explanation.
		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_post_type_variation_unregistration( 'custom_book' );
			$this->handle_pre_65_post_type_variation_unregistration( 'private_custom_book' );
			$this->handle_pre_65_post_type_variation_unregistration( 'temp_custom_book' );
			$this->handle_pre_65_taxonomy_variation_unregistration( 'book_type' );
			$this->handle_pre_65_taxonomy_variation_unregistration( 'private_book_type' );
			$this->handle_pre_65_taxonomy_variation_unregistration( 'temp_book_type' );
		}

		parent::tear_down();
	}

	/**
	 * @covers ::block_core_navigation_link_register_post_type_variation
	 */
	public function test_navigation_link_variations_custom_post_type() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'custom_book', $variations );
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
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'private_custom_book', $variations );
		$this->assertEmpty( $variation, 'Block variation for private post type exists.' );
	}

	/**
	 * @covers ::block_core_navigation_link_register_taxonomy_variation
	 */
	public function test_navigation_link_variations_custom_taxonomy() {
		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'book_type', $variations );
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
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'private_book_type', $variations );
		$this->assertEmpty( $variation, 'Block variation for private taxonomy exists.' );
	}

	/**
	 * @covers ::block_core_navigation_link_unregister_post_type_variation
	 */
	public function test_navigation_link_variations_unregister_post_type() {
		$post_type = register_post_type(
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

		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_post_type_variation_registration( $post_type );
		}

		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'temp_custom_book', $variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );

		unregister_post_type( $post_type->name );

		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_post_type_variation_unregistration( $post_type->name );
		}

		// Update array, since it's an dynamic built array
		$variations = $nav_link_block->variations;
		$variation  = $this->get_variation_by_name( 'temp_custom_book', $variations );
		$this->assertEmpty( $variation, 'Block variation still exists' );
	}

	/**
	 * @covers ::block_core_navigation_link_unregister_taxonomy_variation
	 */
	public function test_navigation_link_variations_unregister_taxonomy() {
		$taxonomy = register_taxonomy(
			'temp_book_type',
			'custom_book',
			array(
				'labels'            => array(
					'item_link' => 'Book Type',
				),
				'show_in_nav_menus' => true,
			)
		);

		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_taxonomy_variation_registration( $taxonomy );
		}

		$registry       = WP_Block_Type_Registry::get_instance();
		$nav_link_block = $registry->get_registered( 'core/navigation-link' );
		// Use property and let __get handle it, so it works for core versions before adding get_variations as well
		$variations = $nav_link_block->variations;
		$this->assertNotEmpty( $variations, 'Block has no variations' );
		$variation = $this->get_variation_by_name( 'temp_book_type', $variations );
		$this->assertIsArray( $variation, 'Block variation does not exist' );

		unregister_taxonomy( $taxonomy->name );

		if ( $this->pre_65_compat ) {
			$this->handle_pre_65_taxonomy_variation_unregistration( $taxonomy->name );
		}

		// Update array, since it's an dynamic built array
		$variations = $nav_link_block->variations;
		$variation  = $this->get_variation_by_name( 'temp_book_type', $variations );
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

	/**
	 * Registers a block variation for a post type with the deprecated methods for Core versions < 6.5.
	 * See comment in set_up for dexplanation.
	 *
	 * @param WP_Post_Type $post_type
	 */
	private function handle_pre_65_post_type_variation_registration( $post_type ) {
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_register_post_type_variation' );
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_register_variation' );
		gutenberg_block_core_navigation_link_register_post_type_variation( $post_type->name, $post_type );
	}

	/**
	 * Unregisters a block variation for a post type with the deprecated methods for Core versions < 6.5.
	 * See comment in set_up for dexplanation.
	 *
	 * @param string $post_type
	 */
	private function handle_pre_65_post_type_variation_unregistration( $post_type ) {
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_unregister_post_type_variation' );
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_unregister_variation' );
		gutenberg_block_core_navigation_link_unregister_post_type_variation( $post_type );
	}

	/**
	 * Registers a block variation for a taxonomy with the deprecated methods for Core versions < 6.5.
	 * See comment in set_up for dexplanation.
	 *
	 * @param WP_Taxonomy $post_type
	 */
	private function handle_pre_65_taxonomy_variation_registration( $taxonomy ) {
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_register_taxonomy_variation' );
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_register_variation' );
		gutenberg_block_core_navigation_link_register_taxonomy_variation( $taxonomy->name, $taxonomy->object_type, (array) $taxonomy );
	}

	/**
	 * Unregisters a block variation for a taxonomy with the deprecated methods for Core versions < 6.5.
	 * See comment in set_up for dexplanation.
	 *
	 * @param string $post_type
	 */
	private function handle_pre_65_taxonomy_variation_unregistration( $taxonomy ) {
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_unregister_taxonomy_variation' );
		$this->setExpectedDeprecated( 'gutenberg_block_core_navigation_link_unregister_variation' );
		gutenberg_block_core_navigation_link_unregister_taxonomy_variation( $taxonomy );
	}
}
