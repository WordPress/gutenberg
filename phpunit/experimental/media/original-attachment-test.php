<?php
/**
 * Tests for the original_attachment REST filter and the
 * `wp_edited_image_metadata` hook that maintains it.
 *
 * @group media
 */
class Gutenberg_Original_Attachment_Filter_Test extends WP_UnitTestCase {
	/**
	 * @var int
	 */
	private static $admin_id;

	/**
	 * @var int[]
	 */
	private $created_ids = array();

	public static function wpSetUpBeforeClass( WP_UnitTest_Factory $factory ) {
		self::$admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
	}

	public function set_up() {
		parent::set_up();
		wp_set_current_user( self::$admin_id );
	}

	public function tear_down() {
		foreach ( $this->created_ids as $id ) {
			wp_delete_attachment( $id, true );
		}
		$this->created_ids = array();
		parent::tear_down();
	}

	private function make_attachment( $original_attachment_id = null ) {
		$file                = DIR_TESTDATA . '/images/canola.jpg';
		$id                  = self::factory()->attachment->create_upload_object( $file );
		$this->created_ids[] = $id;

		if ( null !== $original_attachment_id ) {
			update_post_meta(
				$id,
				GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
				(int) $original_attachment_id
			);
		}

		return $id;
	}

	private function get_response_data( $id, $context = 'edit' ) {
		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
		$request->set_param( 'context', $context );
		$response = rest_do_request( $request );
		return $response->get_data();
	}

	public function test_get_original_attachment_id_returns_self_without_lineage() {
		$id = $this->make_attachment();
		$this->assertSame( $id, gutenberg_get_original_attachment_id( $id ) );
	}

	public function test_get_original_attachment_id_returns_recorded_original() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );
		$this->assertSame( $original, gutenberg_get_original_attachment_id( $child ) );
	}

	public function test_no_original_attachment_id_omits_field_from_response() {
		$id   = $this->make_attachment();
		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'original_attachment', $data );
	}

	public function test_recorded_original_id_surfaces_in_response() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );

		$data = $this->get_response_data( $child );
		$this->assertArrayHasKey( 'original_attachment', $data );
		$this->assertSame( $original, $data['original_attachment'] );
	}

	public function test_original_attachment_link_is_embeddable() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $child );
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );

		$links = $response->get_links();
		$this->assertArrayHasKey( 'https://api.w.org/original-attachment', $links );
		// `rest_prepare_attachment` fires twice per attachment; the
		// filter must not add the link twice.
		$this->assertCount( 1, $links['https://api.w.org/original-attachment'] );

		$link = $links['https://api.w.org/original-attachment'][0];
		$this->assertStringEndsWith( '/wp/v2/media/' . $original, $link['href'] );
		$this->assertTrue( $link['attributes']['embeddable'] );

		// The curie-compacted rel hydrates under `_embedded` with `?_embed`.
		$embedded = rest_get_server()->response_to_data( $response, true );
		$this->assertCount( 1, $embedded['_embedded']['wp:original-attachment'] );
		$this->assertSame(
			$original,
			$embedded['_embedded']['wp:original-attachment'][0]['id']
		);
	}

	public function test_view_context_omits_field() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );

		$data = $this->get_response_data( $child, 'view' );
		$this->assertArrayNotHasKey( 'original_attachment', $data );
	}

	public function test_self_referencing_original_id_is_omitted() {
		$id = $this->make_attachment();
		update_post_meta( $id, GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY, $id );

		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'original_attachment', $data );
	}

	public function test_edit_hook_inherits_grandparent_original() {
		// Simulate the chain that `/edit` would produce: the
		// grandparent is the original, the parent has its postmeta
		// pointing at the grandparent, and a fresh edit off the parent
		// should inherit that same original.
		$grandparent = $this->make_attachment();
		$parent      = $this->make_attachment( $grandparent );
		$new_child   = $this->make_attachment();

		gutenberg_record_original_attachment_id( array(), $new_child, $parent );

		$this->assertSame(
			$grandparent,
			(int) get_post_meta(
				$new_child,
				GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
				true
			)
		);
	}

	public function test_edit_hook_uses_parent_when_parent_has_no_original() {
		// First edit off an unedited upload: the parent has no
		// `_wp_attachment_original_id`, so the new child's original
		// is the parent itself.
		$parent    = $this->make_attachment();
		$new_child = $this->make_attachment();

		gutenberg_record_original_attachment_id( array(), $new_child, $parent );

		$this->assertSame(
			$parent,
			(int) get_post_meta(
				$new_child,
				GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
				true
			)
		);
	}

	public function test_delete_clears_original_attachment_id_on_descendants() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );

		// Sanity: child currently points at original.
		$this->assertSame(
			$original,
			(int) get_post_meta(
				$child,
				GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
				true
			)
		);

		wp_delete_attachment( $original, true );
		$this->created_ids = array_diff( $this->created_ids, array( $original ) );

		$this->assertSame(
			'',
			get_post_meta( $child, GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY, true )
		);
	}

	public function test_delete_leaves_unrelated_descendants_alone() {
		$original_a = $this->make_attachment();
		$child_a    = $this->make_attachment( $original_a );

		$original_b = $this->make_attachment();
		$child_b    = $this->make_attachment( $original_b );

		wp_delete_attachment( $original_a, true );
		$this->created_ids = array_diff( $this->created_ids, array( $original_a ) );

		// child_b's pointer untouched.
		$this->assertSame(
			$original_b,
			(int) get_post_meta(
				$child_b,
				GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY,
				true
			)
		);

		// child_a's pointer cleared.
		$this->assertSame(
			'',
			get_post_meta( $child_a, GUTENBERG_ORIGINAL_ATTACHMENT_ID_META_KEY, true )
		);
	}
}
