<?php

/**
 * Tests for the WP_Site_Icon class.
 *
 * @group site_icon
 */
class Tests_WP_Site_Icon extends WP_UnitTestCase {
	public $wp_site_icon;
	public $attachment_id = 0;

	function setUp() {
		parent::setUp();

		require_once ABSPATH . 'wp-admin/includes/class-wp-site-icon.php';
		$this->wp_site_icon = $GLOBALS['wp_site_icon'];
	}

	function tearDown() {
		$this->site_icon = null;
		$this->remove_added_uploads();
		parent::tearDown();
	}

	function test_intermediate_image_sizes() {
		$image_sizes = $this->wp_site_icon->intermediate_image_sizes( array() );

		$sizes = array();
		foreach ( $this->wp_site_icon->site_icon_sizes as $size ) {
			$sizes[] = 'site_icon-' . $size;
		}

		$this->assertEquals( $sizes, $image_sizes );
	}

	function test_intermediate_image_sizes_with_filter() {
		add_filter( 'site_icon_image_sizes', array( $this, '_custom_test_sizes' ) );
		$image_sizes = $this->wp_site_icon->intermediate_image_sizes( array() );

		$sizes = array();
		foreach ( $this->wp_site_icon->site_icon_sizes as $size ) {
			$sizes[] = 'site_icon-' . $size;
		}

		// Is our custom icon size there?
		$this->assertContains( 'site_icon-321', $image_sizes );

		// All icon sizes should be part of the array, including sizes added through the filter.
		$this->assertEquals( $sizes, $image_sizes );

		// Remove custom size.
		unset( $this->wp_site_icon->site_icon_sizes[ array_search( 321, $this->wp_site_icon->site_icon_sizes ) ] );
		// Remove the filter we added
		remove_filter( 'site_icon_image_sizes', array( $this, '_custom_test_sizes' ) );
	}

	function test_additional_sizes() {
		$image_sizes = $this->wp_site_icon->additional_sizes( array() );

		$sizes = array();
		foreach ( $this->wp_site_icon->site_icon_sizes as $size ) {
			$sizes[ 'site_icon-' . $size ] = array(
				'width ' => $size,
				'height' => $size,
				'crop'   => true,
			);
		}

		$this->assertEquals( $sizes, $image_sizes );
	}

	function test_additional_sizes_with_filter() {
		add_filter( 'site_icon_image_sizes', array( $this, '_custom_test_sizes' ) );
		$image_sizes = $this->wp_site_icon->additional_sizes( array() );

		$sizes = array();
		foreach ( $this->wp_site_icon->site_icon_sizes as $size ) {
			$sizes[ 'site_icon-' . $size ] = array(
				'width ' => $size,
				'height' => $size,
				'crop'   => true,
			);
		}

		// Is our custom icon size there?
		$this->assertArrayHasKey( 'site_icon-321', $image_sizes );

		// All icon sizes should be part of the array, including sizes added through the filter.
		$this->assertEquals( $sizes, $image_sizes );

		// Remove custom size.
		unset( $this->wp_site_icon->site_icon_sizes[ array_search( 321, $this->wp_site_icon->site_icon_sizes ) ] );
	}

	function test_create_attachment_object() {
		$attachment_id = $this->_insert_attachment();
		$parent_url    = get_post( $attachment_id )->guid;
		$cropped       = str_replace( basename( $parent_url ), 'cropped-test-image.jpg', $parent_url );

		$object = $this->wp_site_icon->create_attachment_object( $cropped, $attachment_id );

		$this->assertEquals( $object['post_title'],     'cropped-test-image.jpg' );
		$this->assertEquals( $object['context'],        'site-icon' );
		$this->assertEquals( $object['post_mime_type'], 'image/jpeg' );
		$this->assertEquals( $object['post_content'],   $cropped );
		$this->assertEquals( $object['guid'],           $cropped );
	}

	function test_insert_cropped_attachment() {
		$attachment_id = $this->_insert_attachment();
		$parent_url    = get_post( $attachment_id )->guid;
		$cropped       = str_replace( basename( $parent_url ), 'cropped-test-image.jpg', $parent_url );

		$object     = $this->wp_site_icon->create_attachment_object( $cropped, $attachment_id );
		$cropped_id = $this->wp_site_icon->insert_attachment( $object, $cropped );

		$this->assertInternalType( 'int', $cropped_id );
		$this->assertGreaterThan( 0, $cropped_id );
	}

	function test_delete_attachment_data() {
		$attachment_id = $this->_insert_attachment();
		update_option( 'site_icon', $attachment_id );

		wp_delete_attachment( $attachment_id, true );

		$this->assertFalse( get_option( 'site_icon', false ) );
	}

	function _custom_test_sizes( $sizes ) {
		$sizes[] = 321;

		return $sizes;
	}

	function _insert_attachment() {
		if ( $this->attachment_id ) {
			return $this->attachment_id;
		}

		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$type   = '';
		if ( ! empty( $upload['type'] ) ) {
			$type = $upload['type'];
		} else {
			$mime = wp_check_filetype( $upload['file'] );
			if ( $mime ) {
				$type = $mime['type'];
			}
		}

		$attachment = array(
			'post_title'     => basename( $upload['file'] ),
			'post_content'   => $upload['url'],
			'post_type'      => 'attachment',
			'post_mime_type' => $type,
			'guid'           => $upload['url'],
		);

		// Save the data
		$this->attachment_id  = wp_insert_attachment( $attachment, $upload['file'] );
		wp_update_attachment_metadata( $this->attachment_id, wp_generate_attachment_metadata( $this->attachment_id, $upload['file'] ) );

		return $this->attachment_id;
	}
}
