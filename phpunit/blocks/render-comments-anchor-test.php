<?php
/**
 * Comments Title and Comments Form anchor rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests that the Comments Title and Comments Form blocks keep their fixed IDs.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Comments_Anchor extends WP_UnitTestCase {

	/**
	 * ID of a post with an approved comment, so that both blocks render.
	 *
	 * @var int
	 */
	protected static $post_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$post_id = $factory->post->create( array( 'comment_status' => 'open' ) );
		$factory->comment->create( array( 'comment_post_ID' => self::$post_id ) );
	}

	public function set_up() {
		parent::set_up();

		$GLOBALS['post'] = get_post( self::$post_id );
		setup_postdata( $GLOBALS['post'] );
	}

	public function tear_down() {
		wp_reset_postdata();

		parent::tear_down();
	}

	/**
	 * An anchor saved before these blocks dropped anchor support is ignored,
	 * so the element keeps the single ID that comment links rely on.
	 *
	 * @covers ::render_block_core_comments_title
	 * @covers ::render_block_core_post_comments_form
	 *
	 * @dataProvider data_blocks_with_fixed_ids
	 *
	 * @param string $block_markup Block markup with a saved anchor.
	 * @param string $class_name   Class name of the element that has the fixed ID.
	 * @param string $expected_id  The element's fixed ID.
	 */
	public function test_should_ignore_saved_anchor( string $block_markup, string $class_name, string $expected_id ): void {
		$rendered = do_blocks( $block_markup );

		$processor = new WP_HTML_Tag_Processor( $rendered );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => $class_name ) ) );
		$this->assertSame( $expected_id, $processor->get_attribute( 'id' ) );
		$this->assertStringNotContainsString( 'legacy-anchor', $rendered );
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_blocks_with_fixed_ids(): array {
		return array(
			'Comments Title' => array(
				'block_markup' => '<!-- wp:comments-title {"anchor":"legacy-anchor"} /-->',
				'class_name'   => 'wp-block-comments-title',
				'expected_id'  => 'comments',
			),
			'Comments Form'  => array(
				'block_markup' => '<!-- wp:post-comments-form {"anchor":"legacy-anchor"} /-->',
				'class_name'   => 'wp-block-post-comments-form',
				'expected_id'  => 'respond',
			),
		);
	}
}
