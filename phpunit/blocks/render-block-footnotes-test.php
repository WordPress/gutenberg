<?php
/**
 * Tests for the core/footnotes block rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Class for testing the core/footnotes block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Footnotes extends WP_UnitTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Creates an administrator, who can save footnotes meta without it being
	 * sanitized.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that creates fake data.
	 */
	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	/**
	 * @dataProvider data_items_that_are_not_footnotes
	 * @covers ::gutenberg_render_block_core_footnotes
	 *
	 * @link https://github.com/WordPress/gutenberg/issues/86713
	 *
	 * @param string $footnotes The footnotes meta, as JSON.
	 */
	public function test_skips_items_that_are_not_footnotes( $footnotes ) {
		$post_id = $this->create_post_with_footnotes_meta( $footnotes );

		$this->assertSame( '', $this->render_footnotes_block( $post_id ) );
	}

	/**
	 * Data provider for test_skips_items_that_are_not_footnotes().
	 *
	 * @return array[]
	 */
	public function data_items_that_are_not_footnotes() {
		return array(
			'a string'                 => array( '["text"]' ),
			'null'                     => array( '[null]' ),
			'a number'                 => array( '[1]' ),
			'a footnote without an id' => array( '[{"content":"No id"}]' ),
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_footnotes
	 *
	 * @link https://github.com/WordPress/gutenberg/issues/86713
	 */
	public function test_numbers_footnotes_without_the_items_that_are_skipped() {
		$post_id = $this->create_post_with_footnotes_meta( '[null,{"id":"fn-a","content":"A note."}]' );

		$output = $this->render_footnotes_block( $post_id );

		$this->assertSame( 1, substr_count( $output, '<li' ) );
		$this->assertStringContainsString(
			'<li id="fn-a">A note. <a href="#fn-a-link" aria-label="Jump to footnote reference 1">',
			$output
		);
	}

	/**
	 * @covers ::gutenberg_render_block_core_footnotes
	 *
	 * @link https://github.com/WordPress/gutenberg/issues/86713
	 */
	public function test_renders_a_footnote_without_content() {
		$post_id = $this->create_post_with_footnotes_meta( '[{"id":"fn-a"}]' );

		$this->assertStringContainsString(
			'<li id="fn-a"> <a href="#fn-a-link"',
			$this->render_footnotes_block( $post_id )
		);
	}

	/**
	 * Creates a post and saves the footnotes meta as given.
	 *
	 * @param string $footnotes The footnotes meta, as JSON.
	 * @return int The post ID.
	 */
	private function create_post_with_footnotes_meta( $footnotes ) {
		$post_id = self::factory()->post->create();

		// Without `unfiltered_html`, saving drops the items that aren't
		// footnotes, and the tests would pass for the wrong reason.
		wp_set_current_user( self::$admin_id );
		update_post_meta( $post_id, 'footnotes', wp_slash( $footnotes ) );
		wp_set_current_user( 0 );

		$this->assertSame(
			$footnotes,
			get_post_meta( $post_id, 'footnotes', true ),
			'The footnotes meta should be saved without changes.'
		);

		return $post_id;
	}

	/**
	 * Renders a Footnotes block for a post.
	 *
	 * @param int $post_id The post ID.
	 * @return string The rendered block.
	 */
	private function render_footnotes_block( $post_id ) {
		$block = new WP_Block(
			parse_blocks( '<!-- wp:footnotes /-->' )[0],
			array(
				'postId'   => $post_id,
				'postType' => 'post',
			)
		);

		return $block->render();
	}
}
