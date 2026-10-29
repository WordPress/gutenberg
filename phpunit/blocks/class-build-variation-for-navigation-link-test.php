<?php
/**
 * Tests for the `build_variation_for_navigation_link()` function.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation Link block variation generation function.
 *
 * @group blocks
 */
class Class_Build_Variation_For_Navigation_Link_Test extends WP_UnitTestCase {

	/**
	 * Test that the function exists.
	 */
	public function test_function_exists() {
		$this->assertTrue( function_exists( 'gutenberg_build_variation_for_navigation_link' ), 'Function gutenberg_build_variation_for_navigation_link should exist' );
	}

	/**
	 * Test that the function returns an array with expected structure.
	 */
	public function test_function_returns_array() {
		// Test with a real built-in post type
		$post_type = get_post_type_object( 'post' );
		$this->assertNotNull( $post_type, 'Post type object should exist' );

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify it returns an array.
		$this->assertIsArray( $variation, 'Function should return an array' );

		// Verify it has the expected keys.
		$this->assertArrayHasKey( 'name', $variation, 'Variation should have name key' );
		$this->assertArrayHasKey( 'title', $variation, 'Variation should have title key' );
		$this->assertArrayHasKey( 'description', $variation, 'Variation should have description key' );
		$this->assertArrayHasKey( 'attributes', $variation, 'Variation should have attributes key' );

		// Verify attributes is an array with expected keys.
		$this->assertIsArray( $variation['attributes'], 'Attributes should be an array' );
		$this->assertArrayHasKey( 'type', $variation['attributes'], 'Attributes should have type key' );
		$this->assertArrayHasKey( 'kind', $variation['attributes'], 'Attributes should have kind key' );
	}

	// ============================================================================
	// UNIT TESTS - Mock objects for controlled testing
	// ============================================================================

	/**
	 * Test that a custom post type variation has correct title and empty description.
	 */
	public function test_custom_post_type_variation_format() {
		// Create a mock custom post type object
		$post_type                        = new stdClass();
		$post_type->name                  = 'product';
		$post_type->labels                = new stdClass();
		$post_type->labels->singular_name = 'Product';

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify the title format.
		$this->assertEquals( 'Product link', $variation['title'], 'Custom post type should have appropriately named title' );

		// Verify the description format.
		$this->assertEquals( ' ', $variation['description'], 'Custom post type should have empty description' );
	}

	/**
	 * Test custom post type with both custom labels are preserved together.
	 */
	public function test_custom_post_type_with_both_custom_labels() {
		// Create a mock custom post type object with both custom labels
		$post_type                                = new stdClass();
		$post_type->name                          = 'product';
		$post_type->labels                        = new stdClass();
		$post_type->labels->singular_name         = 'Product';
		$post_type->labels->item_link             = 'Custom Product Link';
		$post_type->labels->item_link_description = 'Custom product description';

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify both custom labels are preserved
		$this->assertEquals( 'Custom Product Link', $variation['title'], 'Custom item_link should be preserved as title' );
		$this->assertEquals( 'Custom product description', $variation['description'], 'Custom item_link_description should be preserved as description' );
	}

	/**
	 * Test missing item_link generates from singular_name.
	 */
	public function test_missing_item_link_generates_from_singular_name() {
		// Create a mock custom post type object without item_link
		$post_type                        = new stdClass();
		$post_type->name                  = 'product';
		$post_type->labels                = new stdClass();
		$post_type->labels->singular_name = 'Product';
		// No item_link property

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify title is generated from singular_name
		$this->assertEquals( 'Product link', $variation['title'], 'Title should be generated from singular_name when item_link is missing' );
	}

	/**
	 * Test missing item_link_description is set to empty.
	 */
	public function test_missing_item_link_description_is_set_to_empty() {
		// Create a mock custom post type object without item_link_description
		$post_type                        = new stdClass();
		$post_type->name                  = 'product';
		$post_type->labels                = new stdClass();
		$post_type->labels->singular_name = 'Product';
		// No item_link_description property

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify description is set to empty when missing
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty when item_link_description is missing' );
	}

	/**
	 * Test missing singular_name falls back to ucfirst(name).
	 */
	public function test_missing_singular_name_falls_back_to_ucfirst_name() {
		// Create a mock custom post type object without singular_name
		$post_type         = new stdClass();
		$post_type->name   = 'product';
		$post_type->labels = new stdClass();
		// No singular_name property

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify title and description use ucfirst(name)
		$this->assertEquals( 'Product link', $variation['title'], 'Title should use ucfirst(name) when singular_name is missing' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty when singular_name is missing' );
	}

	/**
	 * Test taxonomy with custom labels.
	 */
	public function test_taxonomy_with_custom_labels() {
		// Create a mock taxonomy object with custom labels
		$taxonomy                                = new stdClass();
		$taxonomy->name                          = 'product_category';
		$taxonomy->labels                        = new stdClass();
		$taxonomy->labels->singular_name         = 'Product Category';
		$taxonomy->labels->item_link             = 'Custom Category Link';
		$taxonomy->labels->item_link_description = 'Custom category description';

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify custom labels are preserved for taxonomy
		$this->assertEquals( 'Custom Category Link', $variation['title'], 'Custom item_link should be preserved for taxonomy' );
		$this->assertEquals( 'Custom category description', $variation['description'], 'Custom item_link_description should be preserved for taxonomy' );
	}

	/**
	 * Test taxonomy with generated title and empty description.
	 */
	public function test_taxonomy_with_generated_labels() {
		// Create a mock taxonomy object without custom labels
		$taxonomy                        = new stdClass();
		$taxonomy->name                  = 'product_category';
		$taxonomy->labels                = new stdClass();
		$taxonomy->labels->singular_name = 'Product Category';
		// No custom item_link or item_link_description

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify labels are generated for taxonomy
		$this->assertEquals( 'Product Category link', $variation['title'], 'Title should be generated for taxonomy' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty for taxonomy' );
	}

	/**
	 * Test post_tag override.
	 */
	public function test_post_tag_override() {
		// Create a mock post_tag taxonomy object
		$taxonomy                        = new stdClass();
		$taxonomy->name                  = 'post_tag';
		$taxonomy->labels                = new stdClass();
		$taxonomy->labels->singular_name = 'Tag';

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify post_tag override is applied
		$this->assertEquals( 'tag', $variation['name'], 'post_tag should have name overridden to "tag"' );
		$this->assertEquals( 'tag', $variation['attributes']['type'], 'post_tag should have type overridden to "tag"' );
		$this->assertEquals( 'taxonomy', $variation['attributes']['kind'], 'post_tag should preserve kind as "taxonomy"' );
	}

	/**
	 * Test post_format override.
	 */
	public function test_post_format_override() {
		// Create a mock post_format taxonomy object
		$taxonomy                        = new stdClass();
		$taxonomy->name                  = 'post_format';
		$taxonomy->labels                = new stdClass();
		$taxonomy->labels->singular_name = 'Post Format';

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify post_format override is applied
		$this->assertEquals( 'Post Format Link', $variation['title'], 'post_format should have hardcoded title' );
		$this->assertEquals( 'A link to a post format', $variation['description'], 'post_format should have hardcoded description' );
		$this->assertEquals( 'post_format', $variation['attributes']['type'], 'post_format should preserve type as "post_format"' );
		$this->assertEquals( 'taxonomy', $variation['attributes']['kind'], 'post_format should preserve kind as "taxonomy"' );
	}

	/**
	 * Test attributes with post-type kind.
	 */
	public function test_attributes_with_post_type_kind() {
		// Create a mock post type object
		$post_type                        = new stdClass();
		$post_type->name                  = 'product';
		$post_type->labels                = new stdClass();
		$post_type->labels->singular_name = 'Product';

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify attributes structure for post-type
		$this->assertEquals( 'product', $variation['name'], 'Name should match entity name' );
		$this->assertEquals( 'product', $variation['attributes']['type'], 'Type should match entity name' );
		$this->assertEquals( 'post-type', $variation['attributes']['kind'], 'Kind should be "post-type"' );
	}

	/**
	 * Test attributes with taxonomy kind.
	 */
	public function test_attributes_with_taxonomy_kind() {
		// Create a mock taxonomy object
		$taxonomy                        = new stdClass();
		$taxonomy->name                  = 'product_category';
		$taxonomy->labels                = new stdClass();
		$taxonomy->labels->singular_name = 'Product Category';

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify attributes structure for taxonomy
		$this->assertEquals( 'product_category', $variation['name'], 'Name should match entity name' );
		$this->assertEquals( 'product_category', $variation['attributes']['type'], 'Type should match entity name' );
		$this->assertEquals( 'taxonomy', $variation['attributes']['kind'], 'Kind should be "taxonomy"' );
	}

	/**
	 * Test empty string labels trigger generation.
	 */
	public function test_empty_string_labels_trigger_generation() {
		// Create a mock post type object with empty string labels
		$post_type                                = new stdClass();
		$post_type->name                          = 'product';
		$post_type->labels                        = new stdClass();
		$post_type->labels->singular_name         = 'Product';
		$post_type->labels->item_link             = ''; // Empty string
		$post_type->labels->item_link_description = ''; // Empty string

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify empty strings trigger generation
		$this->assertEquals( 'Product link', $variation['title'], 'Empty item_link should trigger title generation' );
		$this->assertEquals( ' ', $variation['description'], 'Empty item_link_description should result in empty description' );
	}

	/**
	 * Test case sensitivity.
	 */
	public function test_case_sensitivity() {
		// Create a mock post type object with mixed case singular_name
		$post_type                        = new stdClass();
		$post_type->name                  = 'product';
		$post_type->labels                = new stdClass();
		$post_type->labels->singular_name = 'Product'; // Mixed case

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify case handling
		$this->assertEquals( 'Product link', $variation['title'], 'Title should preserve case from singular_name' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty' );
	}

	/**
	 * Test entity with minimal properties.
	 */
	public function test_entity_with_minimal_properties() {
		// Create a mock entity with only name property and empty labels
		$entity         = new stdClass();
		$entity->name   = 'product';
		$entity->labels = new stdClass();
		// No singular_name property

		$variation = gutenberg_build_variation_for_navigation_link( $entity, 'post-type' );

		// Verify function handles minimal entity gracefully
		$this->assertEquals( 'Product link', $variation['title'], 'Title should be generated from ucfirst(name) when no singular_name' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty when no singular_name' );
		$this->assertEquals( 'product', $variation['name'], 'Name should match entity name' );
		$this->assertEquals( 'product', $variation['attributes']['type'], 'Type should match entity name' );
		$this->assertEquals( 'post-type', $variation['attributes']['kind'], 'Kind should be preserved' );
	}

	// ============================================================================
	// INTEGRATION TESTS - Real WordPress objects with registration
	// ============================================================================

	/**
	 * Integration test: Custom post type with custom labels.
	 */
	public function test_integration_custom_post_type_with_custom_labels() {
		// Register a custom post type with custom labels
		$post_type = register_post_type(
			'test_product',
			array(
				'labels'            => array(
					'singular_name'         => 'Product',
					'item_link'             => 'Custom Product Link',
					'item_link_description' => 'Custom product description',
				),
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		$this->assertNotNull( $post_type, 'Custom post type should be registered' );

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify custom post type works correctly with custom labels
		$this->assertEquals( 'test_product', $variation['name'], 'Name should match registered post type name' );
		$this->assertEquals( 'test_product', $variation['attributes']['type'], 'Type should match registered post type name' );
		$this->assertEquals( 'post-type', $variation['attributes']['kind'], 'Kind should be "post-type"' );
		$this->assertEquals( 'Custom Product Link', $variation['title'], 'Title should use custom item_link label' );
		$this->assertEquals( 'Custom product description', $variation['description'], 'Description should use custom item_link_description' );

		// Clean up
		unregister_post_type( 'test_product' );
	}

	/**
	 * Integration test: Custom post type without custom labels (smoke test).
	 */
	public function test_integration_custom_post_type_without_custom_labels() {
		// Register a custom post type WITHOUT custom item_link labels
		$post_type = register_post_type(
			'test_product',
			array(
				'labels'            => array(
					'singular_name' => 'Product',
					// No item_link or item_link_description
				),
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		$this->assertNotNull( $post_type, 'Custom post type should be registered' );

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify custom post type works correctly with generated labels
		$this->assertEquals( 'test_product', $variation['name'], 'Name should match registered post type name' );
		$this->assertEquals( 'test_product', $variation['attributes']['type'], 'Type should match registered post type name' );
		$this->assertEquals( 'post-type', $variation['attributes']['kind'], 'Kind should be "post-type"' );
		$this->assertEquals( 'Product link', $variation['title'], 'Title should be generated from singular_name' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty' );

		// Clean up
		unregister_post_type( 'test_product' );
	}

	/**
	 * Integration test: Custom taxonomy with custom labels.
	 */
	public function test_integration_custom_taxonomy_with_custom_labels() {
		// First register a post type for the taxonomy
		register_post_type(
			'test_product',
			array(
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		// Register a custom taxonomy with custom labels
		$taxonomy = register_taxonomy(
			'test_product_category',
			'test_product',
			array(
				'labels'            => array(
					'singular_name'         => 'Product Category',
					'item_link'             => 'Custom Category Link',
					'item_link_description' => 'Custom category description',
				),
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		$this->assertNotNull( $taxonomy, 'Custom taxonomy should be registered' );

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify custom taxonomy works correctly with custom labels
		$this->assertEquals( 'test_product_category', $variation['name'], 'Name should match registered taxonomy name' );
		$this->assertEquals( 'test_product_category', $variation['attributes']['type'], 'Type should match registered taxonomy name' );
		$this->assertEquals( 'taxonomy', $variation['attributes']['kind'], 'Kind should be "taxonomy"' );
		$this->assertEquals( 'Custom Category Link', $variation['title'], 'Title should use custom item_link label' );
		$this->assertEquals( 'Custom category description', $variation['description'], 'Description should use custom item_link_description' );

		// Clean up
		unregister_taxonomy( 'test_product_category' );
		unregister_post_type( 'test_product' );
	}

	/**
	 * Integration test: Custom taxonomy without custom labels (smoke test).
	 */
	public function test_integration_custom_taxonomy_without_custom_labels() {
		// First register a post type for the taxonomy
		register_post_type(
			'test_product',
			array(
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		// Register a custom taxonomy WITHOUT custom item_link labels
		$taxonomy = register_taxonomy(
			'test_product_category',
			'test_product',
			array(
				'labels'            => array(
					'singular_name' => 'Product Category',
					// No item_link or item_link_description
				),
				'public'            => true,
				'show_in_nav_menus' => true,
			)
		);

		$this->assertNotNull( $taxonomy, 'Custom taxonomy should be registered' );

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify custom taxonomy works correctly with generated labels
		$this->assertEquals( 'test_product_category', $variation['name'], 'Name should match registered taxonomy name' );
		$this->assertEquals( 'test_product_category', $variation['attributes']['type'], 'Type should match registered taxonomy name' );
		$this->assertEquals( 'taxonomy', $variation['attributes']['kind'], 'Kind should be "taxonomy"' );
		$this->assertEquals( 'Product Category link', $variation['title'], 'Title should be generated from singular_name' );
		$this->assertEquals( ' ', $variation['description'], 'Description should be empty' );

		// Clean up
		unregister_taxonomy( 'test_product_category' );
		unregister_post_type( 'test_product' );
	}
}
