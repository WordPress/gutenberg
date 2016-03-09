<?php

/**
 * Tests for the WP_Custom_logo class.
 *
 * @group custom_logo
 */
class Tests_WP_Custom_Logo extends WP_UnitTestCase {
	public $attachment_id = 0;

	function setUp() {
		parent::setUp();

		require_once ABSPATH . 'wp-admin/includes/class-wp-custom-logo.php';
	}

	function tearDown() {
		$this->custom_logo = null;
		$this->remove_added_uploads();
		parent::tearDown();
	}

	function test_delete_attachment_data() {
		$attachment_id = $this->_insert_attachment();
		set_theme_mod( 'custom_logo', $attachment_id );

		wp_delete_attachment( $attachment_id, true );

		$this->assertFalse( get_theme_mod( 'custom_logo' ) );
	}

	function _insert_attachment() {
		if ( $this->attachment_id ) {
			return $this->attachment_id;
		}

		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );

		$this->attachment_id = $this->_make_attachment( $upload );
		return $this->attachment_id;
	}
}
