<?php
/**
 * Calendar block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Calendar block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Calendar extends WP_UnitTestCase {

	/**
	 * @covers ::block_core_calendar_update_has_published_post_on_delete
	 *
	 * @group ms-excluded
	 */
	public function test_has_published_posts_flag_is_reset_when_last_published_post_is_force_deleted(): void {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		$this->assertTrue( (bool) get_option( 'wp_calendar_block_has_published_posts' ) );

		wp_delete_post( $post_id, true );

		$this->assertFalse( (bool) get_option( 'wp_calendar_block_has_published_posts' ) );
	}

	/**
	 * @covers ::block_core_calendar_update_has_published_post_on_delete
	 *
	 * @group ms-excluded
	 */
	public function test_has_published_posts_flag_is_kept_when_another_published_post_remains(): void {
		$post_id = self::factory()->post->create( array( 'post_status' => 'publish' ) );
		self::factory()->post->create( array( 'post_status' => 'publish' ) );

		wp_delete_post( $post_id, true );

		$this->assertTrue( (bool) get_option( 'wp_calendar_block_has_published_posts' ) );
	}
}
