<?php
/**
 * Pattern block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Pattern block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Pattern extends WP_UnitTestCase {
	const TEST_PATTERN_NAME  = 'tests/render-pattern';
	const TEST_BLOCK_NAME    = 'tests/render-pattern-block';
	const TEST_EMBED_HANDLER = 'render_pattern_embed';

	public function tear_down() {
		wp_embed_unregister_handler( self::TEST_EMBED_HANDLER );

		if ( WP_Block_Patterns_Registry::get_instance()->is_registered( self::TEST_PATTERN_NAME ) ) {
			unregister_block_pattern( self::TEST_PATTERN_NAME );
		}

		if ( WP_Block_Type_Registry::get_instance()->is_registered( self::TEST_BLOCK_NAME ) ) {
			unregister_block_type( self::TEST_BLOCK_NAME );
		}

		parent::tear_down();
	}

	/**
	 * Renders the test embed handler.
	 *
	 * @return string Embed markup.
	 */
	public function render_test_embed() {
		return '<div class="render-pattern-embed">Embedded content</div>';
	}

	/**
	 * Registers the test embed handler.
	 */
	private function register_test_embed_handler() {
		wp_embed_register_handler(
			self::TEST_EMBED_HANDLER,
			'#https?://example\.com/render-pattern#i',
			array( $this, 'render_test_embed' )
		);
	}

	/**
	 * Tests that a URL in the pattern's own content is turned into an embed.
	 *
	 * @covers ::render_block_core_pattern
	 */
	public function test_autoembeds_url_in_pattern_content() {
		$this->register_test_embed_handler();

		register_block_pattern(
			self::TEST_PATTERN_NAME,
			array(
				'title'   => 'Render pattern test',
				'content' => "<!-- wp:paragraph -->\n<p>https://example.com/render-pattern</p>\n<!-- /wp:paragraph -->",
			)
		);

		$output = do_blocks( '<!-- wp:pattern {"slug":"tests/render-pattern"} /-->' );

		$this->assertStringContainsString(
			'<div class="render-pattern-embed">Embedded content</div>',
			$output,
			'WP_Embed::autoembed() should process URLs on their own line in the pattern content.'
		);
	}

	/**
	 * Tests that autoembed runs before do_blocks() so that URLs which only appear
	 * in a nested block's rendered output are not turned into embeds.
	 *
	 * @covers ::render_block_core_pattern
	 */
	public function test_autoembed_runs_before_do_blocks() {
		$this->register_test_embed_handler();

		register_block_type(
			self::TEST_BLOCK_NAME,
			array(
				'render_callback' => static function () {
					return "\n\nhttps://example.com/render-pattern\n\n";
				},
			)
		);

		register_block_pattern(
			self::TEST_PATTERN_NAME,
			array(
				'title'   => 'Render pattern test',
				'content' => '<!-- wp:tests/render-pattern-block /-->',
			)
		);

		$output = do_blocks( '<!-- wp:pattern {"slug":"tests/render-pattern"} /-->' );

		$this->assertStringNotContainsString(
			'<div class="render-pattern-embed">Embedded content</div>',
			$output,
			'WP_Embed::autoembed() should not process URLs that only appear in a nested block\'s rendered output.'
		);
		$this->assertStringContainsString(
			'https://example.com/render-pattern',
			$output,
			'A URL in a nested block\'s rendered output should be left as-is.'
		);
	}
}
