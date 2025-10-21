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

		// Verify it returns an array
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
	 * Test that the function works with a taxonomy.
	 */
	public function test_function_works_with_taxonomy() {
		// Test with a real built-in taxonomy
		$taxonomy = get_taxonomy( 'category' );
		$this->assertNotNull( $taxonomy, 'Taxonomy object should exist' );

		$variation = gutenberg_build_variation_for_navigation_link( $taxonomy, 'taxonomy' );

		// Verify it returns an array
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
}