<?php
/**
 * Admin Tests
 *
 * @package Gutenberg
 */

/**
 * Test functions in register.php
 */
class Admin_Test extends WP_UnitTestCase {

	/**
	 * ID for a post containing blocks.
	 *
	 * @var int
	 */
	protected static $post_with_blocks;

	/**
	 * ID for a post without blocks.
	 *
	 * @var int
	 */
	protected static $post_without_blocks;

	/**
	 * Set up before class.
	 */
	public static function wpSetUpBeforeClass() {
		self::$post_with_blocks    = self::factory()->post->create(
			array(
				'post_title'   => 'Example',
				'post_content' => "<!-- wp:core/text {\"dropCap\":true} -->\n<p class=\"has-drop-cap\">Tester</p>\n<!-- /wp:core/text -->",
			)
		);
		self::$post_without_blocks = self::factory()->post->create(
			array(
				'post_title'   => 'Example',
				'post_content' => 'Tester',
			)
		);
	}

	/**
	 * Tests gutenberg_post_has_blocks().
	 *
	 * @covers ::gutenberg_post_has_blocks
	 * @expectedDeprecated gutenberg_post_has_blocks
	 */
	function test_gutenberg_post_has_blocks() {
		$this->assertTrue( gutenberg_post_has_blocks( self::$post_with_blocks ) );
		$this->assertFalse( gutenberg_post_has_blocks( self::$post_without_blocks ) );
	}

	/**
	 * Tests gutenberg_content_has_blocks().
	 *
	 * @covers ::gutenberg_content_has_blocks
	 * @expectedDeprecated gutenberg_content_has_blocks
	 */
	function test_gutenberg_content_has_blocks() {
		$content_with_blocks    = get_post_field( 'post_content', self::$post_with_blocks );
		$content_without_blocks = get_post_field( 'post_content', self::$post_without_blocks );

		$this->assertTrue( gutenberg_content_has_blocks( $content_with_blocks ) );
		$this->assertFalse( gutenberg_content_has_blocks( $content_without_blocks ) );
	}
}
