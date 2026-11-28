<?php
/**
 * Tests for encoding spaces in attachment URLs returned by the REST API.
 *
 * @group media
 * @group restapi
 */
class Gutenberg_Attachment_Source_URL_Encoding_Test extends WP_UnitTestCase {
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
		add_filter( 'upload_dir', array( $this, 'upload_dir_with_space' ) );
	}

	public function tear_down() {
		foreach ( $this->created_ids as $id ) {
			wp_delete_attachment( $id, true );
		}
		$this->created_ids = array();

		$uploads = wp_upload_dir();
		if ( is_dir( $uploads['path'] ) ) {
			rmdir( $uploads['path'] );
		}

		parent::tear_down();
	}

	/**
	 * Puts uploads in a subdirectory whose name contains a space.
	 *
	 * @param array $uploads Upload directory data.
	 * @return array Filtered upload directory data.
	 */
	public function upload_dir_with_space( $uploads ) {
		$uploads['subdir'] = '/my uploads';
		$uploads['path']   = $uploads['basedir'] . $uploads['subdir'];
		$uploads['url']    = $uploads['baseurl'] . $uploads['subdir'];
		return $uploads;
	}

	/**
	 * @requires function imagejpeg
	 */
	public function test_rest_source_urls_match_media_modal_urls() {
		$id                  = self::factory()->attachment->create_upload_object( DIR_TESTDATA . '/images/canola.jpg' );
		$this->created_ids[] = $id;

		$data    = rest_do_request( new WP_REST_Request( 'GET', '/wp/v2/media/' . $id ) )->get_data();
		$js_data = wp_prepare_attachment_for_js( $id );

		$this->assertStringContainsString( '/my%20uploads/', $data['source_url'] );
		$this->assertSame( $js_data['url'], $data['source_url'] );
		$this->assertNotEmpty( $data['media_details']['sizes'] );

		foreach ( $data['media_details']['sizes'] as $size => $size_data ) {
			$this->assertStringNotContainsString( ' ', $size_data['source_url'], "The {$size} size URL contains a space." );

			if ( isset( $js_data['sizes'][ $size ] ) ) {
				$this->assertSame( $js_data['sizes'][ $size ]['url'], $size_data['source_url'], "The {$size} size URL does not match." );
			}
		}
	}

	public function test_already_encoded_urls_are_unchanged() {
		$url      = 'http://example.org/wp-content/uploads/my%20uploads/image.jpg';
		$response = new WP_REST_Response(
			array(
				'source_url'    => $url,
				'media_details' => array(
					'sizes' => array(
						'thumbnail' => array( 'source_url' => $url ),
					),
				),
			)
		);

		$data = gutenberg_encode_attachment_source_urls( $response )->get_data();

		$this->assertSame( $url, $data['source_url'] );
		$this->assertSame( $url, $data['media_details']['sizes']['thumbnail']['source_url'] );
	}
}
