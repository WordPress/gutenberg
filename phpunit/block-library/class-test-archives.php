<?php
/**
 * Test the server-side rendering of the `core/archives` block.
 *
 * @package Gutenberg
 */

class Archives_Test extends WP_UnitTestCase {
	/**
	 * Create a shared post fixture, so that the block can return the desired markup.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory singleton.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		$factory->post->create();
	}

	/**
	 * Verify the block output when no posts are found.
	 */
	public function test_no_posts_found() {
		// The shared fixture is published, so modifying the SQL query used by `wp_get_archives()` will make it seem
		// like there are no posts to show.
		add_filter(
			'getarchives_where',
			function( $sql_where ) {
				return str_replace( 'publish', 'private', $sql_where );
			}
		);

		$this->assertDiscardWhitespace(
			'<div class="wp-block-archives wp-block-archives-list">No archives to show.</div>',
			render_block_core_archives(
				array(
					'displayAsDropdown' => false,
					'showPostCounts'    => false,
				)
			)
		);
	}

	/**
	 * Verify the block classes with the default attributes.
	 */
	public function test_default_block_classes_output() {
		$this->assertContains(
			'<ul class="wp-block-archives wp-block-archives-list">',
			render_block_core_archives(
				array(
					'displayAsDropdown' => false,
					'showPostCounts'    => false,
				)
			)
		);
	}

	/**
	 * Verify the block classes with the when displaying as a dropdown.
	 */
	public function test_display_as_dropdown_block_classes_output() {
		$this->assertContains(
			'<div class="wp-block-archives wp-block-archives-dropdown">',
			render_block_core_archives(
				array(
					'displayAsDropdown' => true,
					'showPostCounts'    => false,
				)
			)
		);
	}
}
