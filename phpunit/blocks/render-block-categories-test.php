<?php
/**
 * Categories block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Categories block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Categories extends WP_UnitTestCase {

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_invalid_taxonomy_returns_empty_string() {
		$attributes = array(
			'taxonomy' => 'nonexistent-taxonomy',
		);
		$block      = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => $attributes,
			)
		);

		$output = $block->render();

		$this->assertSame( '', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_valid_taxonomy_renders_list_markup() {
		$category_id = self::factory()->category->create(
			array(
				'name' => 'Categories block test term',
				'slug' => 'categories-block-test-term',
			)
		);

		self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_category' => array( $category_id ),
			)
		);

		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => array(
					'taxonomy'          => 'category',
					'displayAsDropdown' => false,
				),
			)
		);

		$output = $block->render();

		$this->assertStringContainsString( 'wp-block-categories-list', $output );
		$this->assertStringContainsString( 'Categories block test term', $output );
	}
}
