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

	/**
	 * Creates a category with a published post so it is not hidden as empty.
	 *
	 * @param string $name Category name.
	 * @param string $slug Category slug.
	 * @return int Category ID.
	 */
	private function create_category_with_post( $name, $slug ) {
		$category_id = self::factory()->category->create(
			array(
				'name' => $name,
				'slug' => $slug,
			)
		);

		self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_category' => array( $category_id ),
			)
		);

		return $category_id;
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_inline_layout_renders_terms_with_default_delimiter() {
		$this->create_category_with_post( 'First inline term', 'first-inline-term' );
		$this->create_category_with_post( 'Second inline term', 'second-inline-term' );

		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => array(
					'taxonomy'      => 'category',
					'displayLayout' => 'inline',
				),
			)
		);

		$output = $block->render();

		$this->assertStringContainsString( 'wp-block-categories-inline', $output );
		$this->assertStringContainsString( 'wp-block-categories__inline-item', $output );
		$this->assertStringContainsString( 'First inline term', $output );
		$this->assertStringContainsString( 'Second inline term', $output );
		$this->assertStringContainsString( 'aria-hidden="true">,</span>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_inline_layout_renders_custom_delimiter() {
		$this->create_category_with_post( 'First custom term', 'first-custom-term' );
		$this->create_category_with_post( 'Second custom term', 'second-custom-term' );

		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => array(
					'taxonomy'        => 'category',
					'displayLayout'   => 'inline',
					'delimiter'       => 'custom',
					'customDelimiter' => ' • ',
				),
			)
		);

		$output = $block->render();

		$this->assertStringContainsString( 'aria-hidden="true">•</span>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_dropdown_layout_renders_dropdown_markup() {
		$this->create_category_with_post( 'Dropdown term', 'dropdown-term' );

		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => array(
					'taxonomy'      => 'category',
					'displayLayout' => 'dropdown',
				),
			)
		);

		$output = $block->render();

		$this->assertStringContainsString( 'wp-block-categories-dropdown', $output );
		$this->assertStringContainsString( '<select', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_legacy_display_as_dropdown_attribute_renders_dropdown_markup() {
		$this->create_category_with_post( 'Legacy dropdown term', 'legacy-dropdown-term' );

		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => array(
					'taxonomy'          => 'category',
					'displayAsDropdown' => true,
				),
			)
		);

		$output = $block->render();

		$this->assertStringContainsString( 'wp-block-categories-dropdown', $output );
		$this->assertStringContainsString( '<select', $output );
	}
}
