<?php
/**
 * Tests for the root_image REST filter.
 *
 * @group media
 */
class Gutenberg_Root_Image_Filter_Test extends WP_UnitTestCase {
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

	private function make_attachment( $parent_image_id = null ) {
		$file                = DIR_TESTDATA . '/images/canola.jpg';
		$id                  = self::factory()->attachment->create_upload_object( $file );
		$this->created_ids[] = $id;

		if ( null !== $parent_image_id ) {
			$meta                 = wp_get_attachment_metadata( $id );
			$meta['parent_image'] = array(
				'attachment_id' => $parent_image_id,
				'file'          => 'irrelevant.jpg',
			);
			wp_update_attachment_metadata( $id, $meta );
		}

		return $id;
	}

	private function get_response_data( $id ) {
		$request  = new WP_REST_Request( 'GET', '/wp/v2/media/' . $id );
		$response = rest_do_request( $request );
		return $response->get_data();
	}

	public function test_no_chain_omits_root_image() {
		$id   = $this->make_attachment();
		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'root_image', $data['media_details'] );
	}

	public function test_single_hop_chain_returns_parent_as_root() {
		$root  = $this->make_attachment();
		$child = $this->make_attachment( $root );
		$data  = $this->get_response_data( $child );

		$this->assertArrayHasKey( 'root_image', $data['media_details'] );
		$this->assertSame( $root, $data['media_details']['root_image']['attachment_id'] );
		$this->assertSame(
			wp_get_attachment_url( $root ),
			$data['media_details']['root_image']['source_url']
		);
	}

	public function test_multi_hop_chain_walks_to_root() {
		$root   = $this->make_attachment();
		$middle = $this->make_attachment( $root );
		$leaf   = $this->make_attachment( $middle );
		$data   = $this->get_response_data( $leaf );

		$this->assertSame( $root, $data['media_details']['root_image']['attachment_id'] );
	}

	public function test_self_reference_is_treated_as_no_chain() {
		$id                   = $this->make_attachment();
		$meta                 = wp_get_attachment_metadata( $id );
		$meta['parent_image'] = array(
			'attachment_id' => $id,
			'file'          => 'x.jpg',
		);
		wp_update_attachment_metadata( $id, $meta );

		$data = $this->get_response_data( $id );
		$this->assertArrayNotHasKey( 'root_image', $data['media_details'] );
	}

	public function test_cycle_does_not_loop_forever() {
		$a                      = $this->make_attachment();
		$b                      = $this->make_attachment( $a );
		$meta_a                 = wp_get_attachment_metadata( $a );
		$meta_a['parent_image'] = array(
			'attachment_id' => $b,
			'file'          => 'x.jpg',
		);
		wp_update_attachment_metadata( $a, $meta_a );

		$data = $this->get_response_data( $b );
		$this->assertIsArray( $data['media_details'] );
	}
}
