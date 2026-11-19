<?php
/**
 * Shortcode block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Shortcode block.
 *
 * @group blocks
 *
 * @covers ::render_block_core_shortcode
 */
class Render_Block_Shortcode_Test extends WP_UnitTestCase {

	/**
	 * The shortcode output, with indented markup.
	 *
	 * @var string
	 */
	const SHORTCODE_OUTPUT = "<section>\n  <div>\n    <h1>Hello</h1>\n  </div>\n</section>";

	public function set_up() {
		parent::set_up();

		add_shortcode(
			'test_block_shortcode',
			static function () {
				return self::SHORTCODE_OUTPUT;
			}
		);
	}

	public function tear_down() {
		remove_shortcode( 'test_block_shortcode' );

		parent::tear_down();
	}

	/**
	 * Renders a Shortcode block with the given inner content.
	 *
	 * @param string $content The block inner content.
	 * @return string The rendered block.
	 */
	private function render_shortcode_block( $content ) {
		return do_blocks( "<!-- wp:shortcode -->\n" . $content . "\n<!-- /wp:shortcode -->" );
	}

	/**
	 * Tests that content with an unexpanded shortcode is still passed through wpautop().
	 */
	public function test_should_autop_content_with_unexpanded_shortcode() {
		$this->assertSame(
			"<p>Text [test_block_shortcode] here</p>\n",
			$this->render_shortcode_block( 'Text [test_block_shortcode] here' )
		);
	}

	/**
	 * Tests that plain text content is still passed through wpautop().
	 */
	public function test_should_autop_plain_text_content() {
		$this->assertSame(
			"<p>First line<br />\nSecond line</p>\n",
			$this->render_shortcode_block( "First line\nSecond line" )
		);
	}

	/**
	 * Tests that already expanded shortcode markup is not altered.
	 */
	public function test_should_not_autop_expanded_shortcode_markup() {
		$this->assertSame(
			"\n" . self::SHORTCODE_OUTPUT . "\n",
			$this->render_shortcode_block( self::SHORTCODE_OUTPUT )
		);
	}

	/**
	 * Tests that a Shortcode block in a block template does not add stray paragraph tags
	 * to the shortcode output.
	 *
	 * @link https://github.com/WordPress/gutenberg/issues/54136
	 */
	public function test_should_not_add_paragraph_tags_to_shortcode_output_in_block_template() {
		global $_wp_current_template_content;

		$_wp_current_template_content = "<!-- wp:shortcode -->\n[test_block_shortcode]\n<!-- /wp:shortcode -->";

		$output = get_the_block_template_html();

		$this->assertStringContainsString( self::SHORTCODE_OUTPUT, $output );
		$this->assertStringNotContainsString( '<p>', $output );
		$this->assertStringNotContainsString( '</p>', $output );
	}

	/**
	 * Tests that a Shortcode block in a block widget does not wrap the shortcode output
	 * in a paragraph.
	 *
	 * @link https://github.com/WordPress/gutenberg/pull/86893#issuecomment-7004365134
	 */
	public function test_should_not_wrap_shortcode_output_in_paragraph_in_block_widget() {
		$output = apply_filters(
			'widget_block_content',
			"<!-- wp:shortcode -->\n[test_block_shortcode]\n<!-- /wp:shortcode -->",
			array(),
			null
		);

		$this->assertStringContainsString( self::SHORTCODE_OUTPUT, $output );
		$this->assertStringNotContainsString( '<p>', $output );
	}
}
