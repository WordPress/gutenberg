<?php
/**
 * Comment Author Avatar block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Comment Author Avatar block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_comment_author_avatar
 */
class Tests_Blocks_Render_Comment_Author_Avatar extends WP_UnitTestCase {

	/**
	 * Comment to render the avatar for.
	 *
	 * @var int
	 */
	private static $comment_id;

	public static function wpSetUpBeforeClass( $factory ) {
		$post_id          = $factory->post->create();
		self::$comment_id = $factory->comment->create(
			array(
				'comment_post_ID'      => $post_id,
				'comment_author'       => 'Test',
				'comment_author_email' => 'test@example.org',
			)
		);
	}

	/**
	 * Renders a Comment Author Avatar block and returns its wrapper style.
	 *
	 * @param array $attributes Block attributes.
	 * @return string|null Wrapper `style` attribute.
	 */
	private function get_wrapper_style( $attributes ) {
		$parsed_block = parse_blocks( '<!-- wp:comment-author-avatar ' . wp_json_encode( (object) $attributes ) . ' /-->' )[0];
		$block        = new WP_Block( $parsed_block, array( 'commentId' => self::$comment_id ) );

		$processor = new WP_HTML_Tag_Processor( $block->render() );
		$this->assertTrue( $processor->next_tag( 'div' ) );

		return $processor->get_attribute( 'style' );
	}

	/**
	 * @dataProvider data_spacing_styles
	 *
	 * @param array  $spacing        Spacing attribute.
	 * @param string $expected_style Expected wrapper style.
	 */
	public function test_wrapper_has_spacing_styles( $spacing, $expected_style ) {
		$this->assertSame( $expected_style, $this->get_wrapper_style( array( 'style' => array( 'spacing' => $spacing ) ) ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_spacing_styles() {
		return array(
			'custom value'        => array(
				'spacing'        => array( 'padding' => array( 'top' => '10px' ) ),
				'expected_style' => 'padding-top:10px;',
			),
			'preset'              => array(
				'spacing'        => array( 'padding' => array( 'top' => 'var:preset|spacing|40' ) ),
				'expected_style' => 'padding-top:var(--wp--preset--spacing--40);',
			),
			'padding and margin'  => array(
				'spacing'        => array(
					'margin'  => array( 'top' => '5px' ),
					'padding' => array( 'left' => '10px' ),
				),
				'expected_style' => 'padding-left:10px;margin-top:5px;',
			),
			'empty spacing array' => array(
				'spacing'        => array(),
				'expected_style' => '',
			),
		);
	}

	public function test_wrapper_has_no_style_without_spacing() {
		$this->assertNull( $this->get_wrapper_style( array() ) );
	}
}
