<?php
/**
 * Tests for the edit_root REST field and the
 * `wp_edited_image_metadata` hook that maintains it.
 *
 * @group media
 */
class Gutenberg_Edit_Root_Attachment_Test extends WP_UnitTestCase {
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

	private function make_attachment( $edit_root_id = null ) {
		$file                = DIR_TESTDATA . '/images/canola.jpg';
		$id                  = self::factory()->attachment->create_upload_object( $file );
		$this->created_ids[] = $id;

		if ( null !== $edit_root_id ) {
			update_post_meta(
				$id,
				GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
				(int) $edit_root_id
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

	public function test_get_edit_root_attachment_id_returns_self_without_lineage() {
		$id = $this->make_attachment();
		$this->assertSame( $id, gutenberg_get_edit_root_attachment_id( $id ) );
	}

	public function test_get_edit_root_attachment_id_returns_recorded_edit_root() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );
		$this->assertSame( $edit_root, gutenberg_get_edit_root_attachment_id( $child ) );
	}

	public function test_no_lineage_returns_zero_and_no_link() {
		$id      = $this->make_attachment();
		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );

		$this->assertSame( 0, $response->get_data()['edit_root'] );
		$this->assertArrayNotHasKey(
			'https://api.w.org/edit-root',
			$response->get_links()
		);
	}

	public function test_field_is_registered_in_schema() {
		// Ensure `rest_api_init` has fired so the field is registered.
		rest_get_server();

		$controller = new WP_REST_Attachments_Controller( 'attachment' );
		$properties = $controller->get_item_schema()['properties'];

		$this->assertArrayHasKey( 'edit_root', $properties );
		$this->assertSame( 'integer', $properties['edit_root']['type'] );
		$this->assertSame( array( 'edit' ), $properties['edit_root']['context'] );
	}

	public function test_recorded_edit_root_id_surfaces_in_response() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		$data = $this->get_response_data( $child );
		$this->assertArrayHasKey( 'edit_root', $data );
		$this->assertSame( $edit_root, $data['edit_root'] );
	}

	public function test_edit_root_link_is_embeddable() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $child );
		$request->set_param( 'context', 'edit' );
		$response = rest_do_request( $request );

		$links = $response->get_links();
		$this->assertArrayHasKey( 'https://api.w.org/edit-root', $links );
		// `rest_prepare_attachment` fires twice per attachment; the
		// filter must not add the link twice.
		$this->assertCount( 1, $links['https://api.w.org/edit-root'] );

		$link = $links['https://api.w.org/edit-root'][0];
		$this->assertStringEndsWith( '/wp/v2/media/' . $edit_root, $link['href'] );
		$this->assertTrue( $link['attributes']['embeddable'] );

		// The curie-compacted rel hydrates under `_embedded` with `?_embed`.
		$embedded = rest_get_server()->response_to_data( $response, true );
		$this->assertCount( 1, $embedded['_embedded']['wp:edit-root'] );
		$this->assertSame(
			$edit_root,
			$embedded['_embedded']['wp:edit-root'][0]['id']
		);
	}

	public function test_field_limited_request_omits_link() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $child );
		$request->set_param( 'context', 'edit' );
		$request->set_param( '_fields', 'id' );
		$response = rest_do_request( $request );

		$this->assertArrayNotHasKey(
			'https://api.w.org/edit-root',
			$response->get_links()
		);
	}

	public function test_field_limited_request_keeps_link_when_links_included() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $child );
		$request->set_param( 'context', 'edit' );
		$request->set_param( '_fields', 'id,_links' );
		$response = rest_do_request( $request );

		$this->assertArrayHasKey(
			'https://api.w.org/edit-root',
			$response->get_links()
		);
	}

	public function test_view_context_omits_field_and_link() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		$request = new WP_REST_Request( 'GET', '/wp/v2/media/' . $child );
		$request->set_param( 'context', 'view' );
		$response = rest_do_request( $request );

		$this->assertArrayNotHasKey( 'edit_root', $response->get_data() );
		$this->assertArrayNotHasKey(
			'https://api.w.org/edit-root',
			$response->get_links()
		);
	}

	public function test_self_referencing_edit_root_id_returns_zero() {
		$id = $this->make_attachment();
		update_post_meta( $id, GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY, $id );

		$data = $this->get_response_data( $id );
		$this->assertSame( 0, $data['edit_root'] );
	}

	public function test_edit_hook_inherits_grandparent_edit_root() {
		// Simulate the chain that `/edit` would produce: the
		// grandparent is the edit root, the parent has its postmeta
		// pointing at the grandparent, and a fresh edit off the parent
		// should inherit that same edit root.
		$grandparent = $this->make_attachment();
		$parent      = $this->make_attachment( $grandparent );
		$new_child   = $this->make_attachment();

		gutenberg_record_edit_root_attachment_id( array(), $new_child, $parent );

		$this->assertSame(
			$grandparent,
			(int) get_post_meta(
				$new_child,
				GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
				true
			)
		);
	}

	public function test_edit_hook_uses_parent_when_parent_has_no_edit_root() {
		// First edit off an unedited upload: the parent has no
		// `_wp_attachment_edit_root_id`, so the new child's edit root
		// is the parent itself.
		$parent    = $this->make_attachment();
		$new_child = $this->make_attachment();

		gutenberg_record_edit_root_attachment_id( array(), $new_child, $parent );

		$this->assertSame(
			$parent,
			(int) get_post_meta(
				$new_child,
				GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
				true
			)
		);
	}

	public function test_delete_clears_edit_root_attachment_id_on_descendants() {
		$edit_root = $this->make_attachment();
		$child     = $this->make_attachment( $edit_root );

		// Sanity: child currently points at edit root.
		$this->assertSame(
			$edit_root,
			(int) get_post_meta(
				$child,
				GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
				true
			)
		);

		wp_delete_attachment( $edit_root, true );
		$this->created_ids = array_diff( $this->created_ids, array( $edit_root ) );

		$this->assertSame(
			'',
			get_post_meta( $child, GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY, true )
		);
	}

	public function test_delete_leaves_unrelated_descendants_alone() {
		$edit_root_a = $this->make_attachment();
		$child_a     = $this->make_attachment( $edit_root_a );

		$edit_root_b = $this->make_attachment();
		$child_b     = $this->make_attachment( $edit_root_b );

		wp_delete_attachment( $edit_root_a, true );
		$this->created_ids = array_diff( $this->created_ids, array( $edit_root_a ) );

		// child_b's pointer untouched.
		$this->assertSame(
			$edit_root_b,
			(int) get_post_meta(
				$child_b,
				GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY,
				true
			)
		);

		// child_a's pointer cleared.
		$this->assertSame(
			'',
			get_post_meta( $child_a, GUTENBERG_EDIT_ROOT_ATTACHMENT_ID_META_KEY, true )
		);
	}
}
