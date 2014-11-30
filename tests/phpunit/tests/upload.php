<?php
/**
 * @group upload
 * @group media
 */
class Tests_Upload extends WP_UnitTestCase {

	var $siteurl;

	function setUp() {
		if ( is_multisite() ) {
			$this->knownUTBug( 35 );
		}

		$this->_reset_options();
		parent::setUp();
	}

	function _reset_options() {
		// system defaults
		update_option( 'upload_path', 'wp-content/uploads' );
		update_option( 'upload_url_path', '' );
		update_option( 'uploads_use_yearmonth_folders', 1 );
	}

	function test_upload_dir_default() {
		// wp_upload_dir() with default parameters
		$info = wp_upload_dir();
		$this->assertEquals( get_option( 'siteurl' ) . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	function test_upload_dir_relative() {
		// wp_upload_dir() with a relative upload path that is not 'wp-content/uploads'
		update_option( 'upload_path', 'foo/bar' );
		$info = wp_upload_dir();
		$this->delete_folders( ABSPATH . 'foo' );

		$this->assertEquals( get_option( 'siteurl' ) . '/foo/bar/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'foo/bar/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	/**
	 * @ticket 5953
	 */
	function test_upload_dir_absolute() {
		$path = '/tmp/wp-unit-test';
		// wp_upload_dir() with an absolute upload path
		update_option( 'upload_path', $path );
		// doesn't make sense to use an absolute file path without setting the url path
		update_option( 'upload_url_path', '/baz' );
		$info = wp_upload_dir();
		$this->delete_folders( $path );

		$this->assertEquals( '/baz/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( "$path/" . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	function test_upload_dir_no_yearnum() {
		update_option( 'uploads_use_yearmonth_folders', 0 );
		$info = wp_upload_dir();
		$this->assertEquals( get_option( 'siteurl' ) . '/wp-content/uploads', $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads', $info['path'] );
		$this->assertEquals( '', $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	function test_upload_path_absolute() {
		update_option( 'upload_url_path', 'http://example.org/asdf' );
		$info = wp_upload_dir();
		$this->assertEquals( 'http://example.org/asdf/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

	function test_upload_dir_empty() {
		// upload path setting is empty - it should default to 'wp-content/uploads'
		update_option('upload_path', '');
		$info = wp_upload_dir();
		$this->assertEquals( get_option( 'siteurl' ) . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );
	}

}
