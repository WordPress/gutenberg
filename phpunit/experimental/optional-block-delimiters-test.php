<?php
/**
 * Tests for reading HTML outside block delimiters as blocks on the server.
 *
 * @package gutenberg
 *
 * @covers Gutenberg_Undelimited_Block_Parser
 * @covers ::gutenberg_do_blocks_without_delimiters
 */
class Gutenberg_Optional_Block_Delimiters_Test extends WP_UnitTestCase {

	const CLASSIC_POST = "Hello <strong>world</strong>.\nA second line.\n\n<h2 id=\"intro\" data-x>A heading</h2>\nMore text.\n\n<section class=\"cards\">\n\t<article><span>Badge</span><h3>Card</h3><p>Text</p></article>\n</section>\n<script>if ( a < b ) {}</script>\n";

	public function test_keeps_parse_blocks_as_is() {
		$this->assertSame( array( null ), array_column( parse_blocks( self::CLASSIC_POST ), 'blockName' ) );
	}

	public function test_reads_html_without_delimiters_as_blocks() {
		$blocks = array_values(
			array_filter(
				( new Gutenberg_Undelimited_Block_Parser() )->parse( self::CLASSIC_POST ),
				static function ( $block ) {
					return null !== $block['blockName'];
				}
			)
		);
		$this->assertSame(
			array( 'core/paragraph', 'core/heading', 'core/paragraph', 'core/html', 'core/html' ),
			array_column( $blocks, 'blockName' )
		);
		$this->assertSame( '<p>Hello <strong>world</strong>.<br />' . "\n" . 'A second line.</p>', $blocks[0]['innerHTML'] );
		$this->assertSame( array( 'core/heading', 'core/paragraph' ), array_column( $blocks[3]['innerBlocks'], 'blockName' ) );
		$this->assertSame(
			array( "<section class=\"cards\">\n\t<article><span>Badge</span>", null, '', null, "</article>\n</section>" ),
			$blocks[3]['innerContent']
		);
	}

	public function test_render_filters_see_each_block() {
		$names  = array();
		$filter = static function ( $content, $block ) use ( &$names ) {
			$names[] = $block['blockName'];
			return $content;
		};
		add_filter( 'render_block', $filter, 10, 2 );
		gutenberg_do_blocks_without_delimiters( self::CLASSIC_POST );
		remove_filter( 'render_block', $filter, 10 );
		$this->assertSame(
			array( 'core/paragraph', 'core/heading', 'core/paragraph', 'core/heading', 'core/paragraph', 'core/html', 'core/html' ),
			array_values( array_filter( $names ) )
		);
	}

	/**
	 * @dataProvider data_blocks_with_delimiters
	 *
	 * @param string $html            HTML without delimiters.
	 * @param string $with_delimiters The same blocks, with delimiters.
	 */
	public function test_renders_blocks_like_blocks_with_delimiters( $html, $with_delimiters ) {
		$this->assertSame( do_blocks( $with_delimiters ), gutenberg_do_blocks_without_delimiters( $html ) );
	}

	public function data_blocks_with_delimiters() {
		return array(
			'paragraph'                      => array( '<p>Hi</p>', '<!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph -->' ),
			'heading'                        => array( '<h2 id="x">Hi</h2>', '<!-- wp:heading --><h2 id="x">Hi</h2><!-- /wp:heading -->' ),
			'text next to a delimited block' => array(
				"Hello\n\n<!-- wp:separator --><hr class=\"wp-block-separator\"/><!-- /wp:separator -->",
				"<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->\n\n<!-- wp:separator --><hr class=\"wp-block-separator\"/><!-- /wp:separator -->",
			),
			'paragraph in unknown HTML'      => array(
				'<section><p>Hi</p></section>',
				'<!-- wp:html --><section><!-- wp:paragraph --><p>Hi</p><!-- /wp:paragraph --></section><!-- /wp:html -->',
			),
		);
	}
}
