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
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_list_applies_widget_categories_args_filter() {
		$this->create_category_with_post( 'Kept category' );
		$excluded_id = $this->create_category_with_post( 'Excluded category' );

		add_filter(
			'widget_categories_args',
			static function ( $args ) use ( $excluded_id ) {
				$args['exclude'] = array( $excluded_id );
				return $args;
			}
		);

		$output = $this->render_categories_block( array( 'taxonomy' => 'category' ) );

		$this->assertStringContainsString( 'Kept category', $output );
		$this->assertStringNotContainsString( 'Excluded category', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_dropdown_applies_widget_categories_dropdown_args_filter() {
		$this->create_category_with_post( 'Dropdown category' );

		add_filter(
			'widget_categories_dropdown_args',
			static function ( $args ) {
				$args['show_option_none'] = 'Pick a filtered category';
				return $args;
			}
		);

		$output = $this->render_categories_block(
			array(
				'taxonomy'          => 'category',
				'displayAsDropdown' => true,
			)
		);

		$this->assertStringContainsString( 'Pick a filtered category', $output );
		$this->assertStringContainsString( 'Dropdown category', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_widget_filters_cannot_make_the_block_echo() {
		$this->create_category_with_post( 'Returned category' );

		$force_echo = static function ( $args ) {
			$args['echo'] = true;
			return $args;
		};
		add_filter( 'widget_categories_args', $force_echo );
		add_filter( 'widget_categories_dropdown_args', $force_echo );

		$this->expectOutputString( '' );

		$list     = $this->render_categories_block( array( 'taxonomy' => 'category' ) );
		$dropdown = $this->render_categories_block(
			array(
				'taxonomy'          => 'category',
				'displayAsDropdown' => true,
			)
		);

		$this->assertStringContainsString( 'Returned category', $list );
		$this->assertStringContainsString( 'Returned category', $dropdown );
	}

	/**
	 * @covers ::gutenberg_render_block_core_categories
	 */
	public function test_widget_filters_are_not_applied_to_other_taxonomies() {
		$tag_id = self::factory()->tag->create( array( 'name' => 'Tag term' ) );
		self::factory()->post->create(
			array(
				'post_status' => 'publish',
				'tags_input'  => array( $tag_id ),
			)
		);

		$list_filter     = new MockAction();
		$dropdown_filter = new MockAction();
		add_filter( 'widget_categories_args', array( $list_filter, 'filter' ) );
		add_filter( 'widget_categories_dropdown_args', array( $dropdown_filter, 'filter' ) );

		$list     = $this->render_categories_block( array( 'taxonomy' => 'post_tag' ) );
		$dropdown = $this->render_categories_block(
			array(
				'taxonomy'          => 'post_tag',
				'displayAsDropdown' => true,
			)
		);

		$this->assertStringContainsString( 'Tag term', $list );
		$this->assertStringContainsString( 'Tag term', $dropdown );
		$this->assertSame( 0, $list_filter->get_call_count() );
		$this->assertSame( 0, $dropdown_filter->get_call_count() );
	}

	/**
	 * Creates a category with a published post, so that it is not hidden as empty.
	 *
	 * @param string $name Category name.
	 * @return int Category ID.
	 */
	private function create_category_with_post( $name ) {
		$category_id = self::factory()->category->create( array( 'name' => $name ) );

		self::factory()->post->create(
			array(
				'post_status'   => 'publish',
				'post_category' => array( $category_id ),
			)
		);

		return $category_id;
	}

	/**
	 * Renders a Categories block with the given attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string Rendered block markup.
	 */
	private function render_categories_block( $attributes ) {
		$block = new WP_Block(
			array(
				'blockName' => 'core/categories',
				'attrs'     => $attributes,
			)
		);

		return $block->render();
	}
}
