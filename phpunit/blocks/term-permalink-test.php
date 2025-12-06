<?php
/**
 * Tests for the Term Permalink block.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @since 6.9.0
 *
 * @group blocks
 */
class Tests_Blocks_TermPermalink extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	private static $category_id;

	/**
	 * Set up test fixtures.
	 *
	 * @param WP_UnitTest_Factory $factory Test factory.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$category_id = $factory->term->create(
			array(
				'taxonomy' => 'category',
				'name'     => 'Test Category',
				'slug'     => 'test-category',
			)
		);
	}

	/**
	 * Tear down test fixtures.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_term( self::$category_id, 'category' );
	}

	/**
	 * Test that the block renders correctly with term context.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_block_core_term_permalink_with_context() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(),
			),
			array(
				'termId'   => self::$category_id,
				'taxonomy' => 'category',
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array(),
			'',
			$block
		);

		$this->assertStringContainsString( 'wp-block-term-permalink', $result );
		$this->assertStringContainsString( get_term_link( self::$category_id ), $result );
		$this->assertStringContainsString( 'View term', $result );
	}

	/**
	 * Test that the block returns empty string without context.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_returns_empty_without_context() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(),
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array(),
			'',
			$block
		);

		$this->assertEmpty( $result );
	}

	/**
	 * Test that the block renders with custom content.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_with_custom_content() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(
					'content' => 'Custom Link Text',
				),
			),
			array(
				'termId'   => self::$category_id,
				'taxonomy' => 'category',
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array( 'content' => 'Custom Link Text' ),
			'',
			$block
		);

		$this->assertStringContainsString( 'Custom Link Text', $result );
	}

	/**
	 * Test that the block renders with target blank.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_with_link_target_blank() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(
					'linkTarget' => '_blank',
				),
			),
			array(
				'termId'   => self::$category_id,
				'taxonomy' => 'category',
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array( 'linkTarget' => '_blank' ),
			'',
			$block
		);

		$this->assertStringContainsString( 'target="_blank"', $result );
	}

	/**
	 * Test that the block includes screen reader text.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_includes_screen_reader_text() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(),
			),
			array(
				'termId'   => self::$category_id,
				'taxonomy' => 'category',
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array(),
			'',
			$block
		);

		$this->assertStringContainsString( 'screen-reader-text', $result );
		$this->assertStringContainsString( 'Test Category', $result );
	}

	/**
	 * Test that the block returns empty for invalid term.
	 *
	 * @ticket 73798
	 *
	 * @covers ::gutenberg_render_block_core_term_permalink
	 */
	public function test_render_returns_empty_for_invalid_term() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/term-permalink',
				'attrs'     => array(),
			),
			array(
				'termId'   => 999999,
				'taxonomy' => 'category',
			)
		);

		$result = gutenberg_render_block_core_term_permalink(
			array(),
			'',
			$block
		);

		$this->assertEmpty( $result );
	}
}
