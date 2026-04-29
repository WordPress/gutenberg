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
			$meta                           = wp_get_attachment_metadata( $id );
			$meta['original_attachment_id'] = (int) $original_attachment_id;
			wp_update_attachment_metadata( $id, $meta );
		}

		return $id;
	}

	private function get_response_data( $id ) {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
		$response = rest_do_request( $request );
		return $response->get_data();
	}

	public function test_no_original_attachment_id_omits_field_from_response() {
		$id   = $this->make_attachment();
		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'original_attachment', $data['media_details'] );
	}

	public function test_recorded_original_id_surfaces_in_response() {
		$original = $this->make_attachment();
		$child    = $this->make_attachment( $original );

		$data = $this->get_response_data( $child );
		$this->assertArrayHasKey( 'original_attachment', $data['media_details'] );
		$this->assertSame( $original, $data['media_details']['original_attachment']['attachment_id'] );
		$this->assertSame(
			wp_get_attachment_url( $original ),
			$data['media_details']['original_attachment']['source_url']
		);
	}

	public function test_self_referencing_original_id_is_omitted() {
		$id                             = $this->make_attachment();
		$meta                           = wp_get_attachment_metadata( $id );
		$meta['original_attachment_id'] = $id;
		wp_update_attachment_metadata( $id, $meta );

		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'original_attachment', $data['media_details'] );
	}

	public function test_edit_hook_inherits_grandparent_original() {
		// Simulate the chain that `/edit` would produce: the
		// grandparent is the original, the parent has
		// `original_attachment_id` set to the grandparent, and a fresh
		// edit off the parent should inherit that same original.
		$grandparent = $this->make_attachment();
		$parent      = $this->make_attachment( $grandparent );

		$new_meta = gutenberg_record_original_attachment_id( array(), 999, $parent );
		$this->assertSame( $grandparent, $new_meta['original_attachment_id'] );
	}

	public function test_edit_hook_uses_parent_when_parent_has_no_original() {
		// First edit off an unedited upload: the parent has no
		// `original_attachment_id`, so the new child's original is the
		// parent itself.
		$parent = $this->make_attachment();

		$new_meta = gutenberg_record_original_attachment_id( array(), 999, $parent );
		$this->assertSame( $parent, $new_meta['original_attachment_id'] );
	}
}
