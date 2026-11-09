<?php
/**
 * Comment Date block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Comment Date block.
 *
 * @group blocks
 *
 * @covers ::gutenberg_render_block_core_comment_date
 */
class Tests_Blocks_Render_Comment_Date extends WP_UnitTestCase {

	/**
	 * Tests that the human-diff format measures the elapsed time from the actual Unix timestamp.
	 *
	 * The local 'U' timestamp from {@see mysql2date()} includes the timezone offset, so a site
	 * ahead of UTC would otherwise report a comment as hours older than it is.
	 *
	 * @dataProvider data_gmt_offsets
	 *
	 * @param int $gmt_offset GMT offset in hours.
	 */
	public function test_human_diff_ignores_timezone_offset( $gmt_offset ) {
		update_option( 'timezone_string', '' );
		update_option( 'gmt_offset', $gmt_offset );

		$timestamp  = time() - 10 * MINUTE_IN_SECONDS;
		$comment_id = self::factory()->comment->create(
			array(
				'comment_post_ID'  => self::factory()->post->create(),
				'comment_date'     => gmdate( 'Y-m-d H:i:s', $timestamp + $gmt_offset * HOUR_IN_SECONDS ),
				'comment_date_gmt' => gmdate( 'Y-m-d H:i:s', $timestamp ),
			)
		);

		$parsed_block = parse_blocks( '<!-- wp:comment-date {"format":"human-diff"} /-->' )[0];
		$block        = new WP_Block( $parsed_block, array( 'commentId' => $comment_id ) );

		$this->assertSame( '10 minutes ago', wp_strip_all_tags( $block->render() ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array<non-falsy-string, array{ gmt_offset: int }>
	 */
	public function data_gmt_offsets() {
		return array(
			'UTC'    => array( 'gmt_offset' => 0 ),
			'UTC+2'  => array( 'gmt_offset' => 2 ),
			'UTC-5'  => array( 'gmt_offset' => -5 ),
			'UTC+14' => array( 'gmt_offset' => 14 ),
		);
	}
}
