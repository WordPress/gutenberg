<?php
/**
 * Table of Contents block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Table of Contents block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Table_Of_Contents extends WP_UnitTestCase {
	/** @var WP_Post */
	protected static $page;

	/** @var array|null */
	protected $original_block_supports;

	public static function wpSetUpBeforeClass() {
		self::$page = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
			)
		);

		add_post_meta(
			self::$page->ID,
			'_core_table_of_contents',
			'[{"content":"Heading text","level":2,"link":"#heading-text","page":null},{"content":"A sub-heading","level":3,"link":"#a-sub-heading","page":null},{"content":"Missing anchor","level":2,"link":null,"page":null}]',
			true
		);
	}

	public function set_up() {
		parent::set_up();
		$this->original_block_supports      = WP_Block_Supports::$block_to_render;
		WP_Block_Supports::$block_to_render = array(
			'attrs'     => array(),
			'blockName' => 'core/table-of-contents',
		);
	}

	public function tear_down() {
		WP_Block_Supports::$block_to_render = $this->original_block_supports;
		parent::tear_down();
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$page->ID, true );
	}

	/**
	 * @covers ::render_block_core_table_of_contents
	 */
	public function test_render_deprecated_content() {
		$content = '<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#heading-text">Heading text</a><ol><li><a class="wp-block-table-of-contents__entry" href="#a-sub-heading">A sub-heading</a></li></ol></li></ol></nav>';

		$parsed_blocks = parse_blocks(
			'<!-- wp:table-of-contents {"headings":[{"content":"Heading text","level":2,"link":"#heading-text"},{"content":"A sub-heading","level":3,"link":"#a-sub-heading"}]} -->
			<nav class="wp-block-table-of-contents"><ol><li><a class="wp-block-table-of-contents__entry" href="#heading-text">Heading text</a><ol><li><a class="wp-block-table-of-contents__entry" href="#a-sub-heading">A sub-heading</a></li></ol></li></ol></nav>
			<!-- /wp:table-of-contents -->'
		);
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId'   => self::$page->ID,
				'postType' => self::$page->post_type,
			)
		);

		$new_content = gutenberg_render_block_core_table_of_contents( array(), $content, $block );
		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="#heading-text">Heading text</a>',
			$new_content,
			'Failed to render a heading element'
		);
		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="#a-sub-heading">A sub-heading</a>',
			$new_content,
			'Failed to render a sub-heading element'
		);
	}

	/**
	 * @covers ::render_block_core_table_of_contents
	 */
	public function test_render_table_of_contents_from_meta() {
		$GLOBALS['post'] = self::$page;

		$permalink     = get_permalink( self::$page->ID );
		$parsed_blocks = parse_blocks( '<!-- wp:table-of-contents /-->' );
		$block         = new WP_Block(
			$parsed_blocks[0],
			array(
				'postId'   => self::$page->ID,
				'postType' => self::$page->post_type,
			)
		);

		$new_content = gutenberg_render_block_core_table_of_contents( array(), '', $block );
		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="' . $permalink . '#heading-text">Heading text</a>',
			$new_content,
			'Failed to render a heading element from meta'
		);
		$this->assertStringContainsString(
			'<a class="wp-block-table-of-contents__entry" href="' . $permalink . '#a-sub-heading">A sub-heading</a>',
			$new_content,
			'Failed to render a sub-heading element from meta'
		);
		$this->assertStringContainsString(
			'<span class="wp-block-table-of-contents__entry">Missing anchor</span>',
			$new_content,
			'Failed to render a heading element with a missing anchor'
		);
	}
}
