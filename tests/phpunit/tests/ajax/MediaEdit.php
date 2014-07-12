<?php
/**
 * Admin ajax functions to be tested
 */
require_once( ABSPATH . 'wp-admin/includes/ajax-actions.php' );

/**
 * Testing ajax media editing
 *
 * @package    WordPress
 * @subpackage UnitTests
 * @since      3.5.0
 * @group      ajax
 */
class Tests_Ajax_MediaEdit extends WP_Ajax_UnitTestCase {

	/**
	 * List of media thumbnail ids
	 * @var array
	 */
	protected $_ids = array();

	/**
	 * Set up the test fixture.
	 */
	public function setUp() {
		parent::setUp();
	}

	/**
	 * Tear down the test fixture.
	 */
	public function tearDown() {
		// Cleanup
		foreach ( $this->_ids as $id ) {
			wp_delete_attachment( $id, true );
		}

		parent::tearDown();
	}

	/**
	 * Function snagged from ./tests/post/attachments.php
	 */
	function _make_attachment($upload, $parent_post_id = 0) {
		$type = '';
		if ( !empty($upload['type']) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ($mime)
				$type = $mime['type'];
		}

		$attachment = array(
			'post_title' => basename( $upload['file'] ),
			'post_content' => '',
			'post_type' => 'attachment',
			'post_parent' => $parent_post_id,
			'post_mime_type' => $type,
			'guid' => $upload[ 'url' ],
		);

		// Save the data
		$id = wp_insert_attachment( $attachment, $upload[ 'file' ], $parent_post_id );
		wp_update_attachment_metadata( $id, wp_generate_attachment_metadata( $id, $upload['file'] ) );
		return $this->_ids[] = $id;
	}

	/**
	 * @ticket 22985
	 */
	public function testCropImageThumbnail() {
		include_once( ABSPATH . 'wp-admin/includes/image-edit.php' );

		$filename = DIR_TESTDATA . '/images/canola.jpg';
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$id = $this->_make_attachment($upload);

		$_REQUEST['action'] = 'image-editor';
		$_REQUEST['context'] = 'edit-attachment';
		$_REQUEST['postid'] = $id;
		$_REQUEST['target'] = 'thumbnail';
		$_REQUEST['do'] = 'save';
		$_REQUEST['history'] = '[{"c":{"x":5,"y":8,"w":289,"h":322}}]';

		$media_meta = wp_get_attachment_metadata($id);
		$this->assertArrayHasKey('sizes', $media_meta, 'attachment should have size data');
		$this->assertArrayHasKey('medium', $media_meta['sizes'], 'attachment should have data for medium size');
		$ret = wp_save_image($id);

		$media_meta = wp_get_attachment_metadata($id);
		$this->assertArrayHasKey('sizes', $media_meta, 'cropped attachment should have size data');
		$this->assertArrayHasKey('medium', $media_meta['sizes'], 'cropped attachment should have data for medium size');
	}
}
