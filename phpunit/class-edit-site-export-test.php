<?php

/**
 * Test `gutenberg_edit_site_export` and its helper functions.
 *
 * @package Gutenberg
 */

class Edit_Site_Export_Test extends WP_UnitTestCase {
	/**
	 * Verify that post ids are stripped from template part blocks during the export.
	 *
	 * This is needed so that the exported template is loaded from the theme.
	 */
	public function test_post_ids_are_stripped_from_template_parts() {
		$post = self::factory()->post->create_and_get(
			array(
				'post_content' => '<!-- wp:template-part {"postId":123,"slug":"header","theme":"gutenberg-tests"} /-->',
				'post_title'   => 'Archive',
				'post_type'    => 'wp_template',
			)
		);

		$this->assertSame(
			'<!-- wp:template-part {"slug":"header","theme":"gutenberg-tests"} /-->',
			gutenberg_strip_post_ids_from_template_part_blocks( $post->post_content )
		);
	}
}
