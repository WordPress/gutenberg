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

		// Verify it returns an arraygs
		$this->assertIsArray( $variation, 'Function should return an array' );

		// Verify it has the expected keys
		$this->assertArrayHasKey( 'name', $variation, 'Variation should have name key' );
		$this->assertArrayHasKey( 'title', $variation, 'Variation should have title key' );
		$this->assertArrayHasKey( 'description', $variation, 'Variation should have description key' );
		$this->assertArrayHasKey( 'attributes', $variation, 'Variation should have attributes key' );

		// Verify attributes is an array with expected keys
		$this->assertIsArray( $variation['attributes'], 'Attributes should be an array' );
		$this->assertArrayHasKey( 'type', $variation['attributes'], 'Attributes should have type key' );
		$this->assertArrayHasKey( 'kind', $variation['attributes'], 'Attributes should have kind key' );
	}

	/**
	 * Test that a custom post type variation has correct title and description format.
	 */
	public function test_custom_post_type_variation_format() {
		// Create a mock custom post type object
		$post_type = new stdClass();
		$post_type->name = 'product';
		$post_type->labels = new stdClass();
		$post_type->labels->singular_name = 'Product';

		$variation = gutenberg_build_variation_for_navigation_link( $post_type, 'post-type' );

		// Verify the title format
		$this->assertEquals( 'Product Link', $variation['title'], 'Custom post type should have appropriately named title' );

		// Verify the description format
		$this->assertEquals( 'A link to a product', $variation['description'], 'Custom post type should have clear, unambiguous description' );
	}
}