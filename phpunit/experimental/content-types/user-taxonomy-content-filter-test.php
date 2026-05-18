<?php
/**
 * Unit tests for the post-type-scoped JSON sanitizer that runs on
 * wp_insert_post_data for wp_user_taxonomy records.
 * See lib/experimental/content-types/index.php.
 *
 * Tests exercise the filter through wp_insert_post — the production write
 * path — rather than calling the filter function directly. Catches issues
 * that pure-function tests would miss: hook attachment, ordering, slashing.
 *
 * @package gutenberg
 *
 * @covers ::gutenberg_filter_user_taxonomy_post_content
 */
class User_Taxonomy_Content_Filter_Test extends WP_UnitTestCase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		// On multisite, `unfiltered_html` belongs to super admins only; the
		// single-site administrator role doesn't carry it. Promote so the
		// kses pre-filter is bypassed in both environments and the test
		// exercises our sanitizer as the sole line of defense.
		if ( is_multisite() ) {
			grant_super_admin( self::$admin_id );
		}
	}

	public static function wpTearDownAfterClass() {
		self::delete_user( self::$admin_id );
	}

	/**
	 * Inserting a wp_user_taxonomy record via wp_insert_post strips HTML from
	 * label values. Runs as admin (has unfiltered_html) so kses doesn't run
	 * first — verifies our filter is the line of defense, matching the
	 * production REST path where admins are the writers.
	 */
	public function test_strips_html_in_taxonomy_post() {
		wp_set_current_user( self::$admin_id );

		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_user_taxonomy',
				'post_status'  => 'publish',
				'post_name'    => 'filter-direct',
				'post_title'   => 'Direct',
				'post_content' => wp_json_encode(
					array(
						'labels' => array(
							'singular_name' => '<script>alert(1)</script>Direct',
						),
					)
				),
			)
		);

		$content = get_post( $post_id )->post_content;
		$decoded = json_decode( $content, true );
		$this->assertSame( 'Direct', $decoded['labels']['singular_name'] );
		$this->assertStringNotContainsString( '<script', $content );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Posts of unrelated post types pass through unchanged. Verified by
	 * including a key the sanitizer would otherwise drop (`foo`) — its
	 * survival confirms the filter didn't run on this post.
	 */
	public function test_ignores_other_post_types() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'post',
				'post_status'  => 'publish',
				'post_title'   => 'Regular',
				'post_content' => wp_json_encode(
					array(
						'foo'    => 'bar',
						'labels' => array( 'singular_name' => 'X' ),
					)
				),
			)
		);

		$decoded = json_decode( get_post( $post_id )->post_content, true );
		$this->assertSame( 'bar', $decoded['foo'] );
		$this->assertSame( 'X', $decoded['labels']['singular_name'] );

		wp_delete_post( $post_id, true );
	}

	/**
	 * Non-JSON post_content on a wp_user_taxonomy record is normalized to
	 * the canonical marker-only payload — a hedge against a stray read
	 * path surfacing arbitrary bytes.
	 */
	public function test_normalizes_non_json_payload_to_marker_only() {
		$post_id = wp_insert_post(
			array(
				'post_type'    => 'wp_user_taxonomy',
				'post_status'  => 'publish',
				'post_name'    => 'filter-non-json',
				'post_title'   => 'NonJSON',
				'post_content' => 'plain text, not JSON',
			)
		);

		$stored = get_post( $post_id )->post_content;
		$this->assertJson( $stored );
		$this->assertSame(
			array( GUTENBERG_USER_TAXONOMY_CONFIG_MARKER => true ),
			json_decode( $stored, true )
		);

		wp_delete_post( $post_id, true );
	}
}
