<?php
/**
 * Unit tests for the JSON-aware kses replacement that sanitizes
 * wp_user_taxonomy post_content. See lib/experimental/content-types/kses.php.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_filter_user_taxonomy_post_content
 */
class User_Taxonomy_KSES_Test extends WP_UnitTestCase {

	/**
	 * The filter strips HTML inside labels even when the record is written
	 * via wp_insert_post instead of through the REST controller — closing
	 * the non-REST write path.
	 */
	public function test_strips_html_via_direct_insert() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_user_taxonomy',
				'post_status'  => 'publish',
				'post_name'    => 'kses-direct',
				'post_title'   => 'Direct',
				'post_content' => wp_json_encode(
					array(
						GUTENBERG_USER_TAXONOMY_CONFIG_MARKER => true,
						'labels' => array(
							'singular_name' => '<script>alert(1)</script>Direct',
						),
					)
				),
			)
		);

		$stored = json_decode( get_post( $post_id )->post_content, true );
		$this->assertArrayHasKey( 'labels', $stored );
		$this->assertSame( 'Direct', $stored['labels']['singular_name'] );
		$this->assertStringNotContainsString( '<script', get_post( $post_id )->post_content );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Only acts on payloads carrying our marker — unrelated `post_content`
	 * writes pass through unchanged.
	 */
	public function test_ignores_non_marker_payload() {
		$payload = wp_json_encode(
			array(
				'something' => 'else',
				'labels'    => array( 'x' => 'y' ),
			)
		);
		$result  = gutenberg_filter_user_taxonomy_post_content( $payload );
		$this->assertSame( $payload, $result );
	}

	/**
	 * Non-JSON `post_content` bytes also pass through — the filter must not
	 * corrupt unrelated posts.
	 */
	public function test_ignores_non_json_payload() {
		$payload = '<p>Just regular post content.</p>';
		$result  = gutenberg_filter_user_taxonomy_post_content( $payload );
		$this->assertSame( $payload, $result );
	}
}
