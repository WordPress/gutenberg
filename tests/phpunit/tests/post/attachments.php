<?php

/**
 * @group post
 * @group media
 * @group upload
 */
class Tests_Post_Attachments extends WP_UnitTestCase {

	function tearDown() {
		// Remove all uploads.
		$this->remove_added_uploads();
		parent::tearDown();
	}

	function _make_attachment( $upload, $parent_post_id = 0 ) {

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

		return $this->ids[] = $id;

	}

	function test_insert_bogus_image() {
		$filename = rand_str().'.jpg';
		$contents = rand_str();

		$upload = wp_upload_bits($filename, null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$id = $this->_make_attachment($upload);
	}

	function test_insert_image_no_thumb() {

		// this image is smaller than the thumbnail size so it won't have one
		$filename = ( DIR_TESTDATA.'/images/test-image.jpg' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$id = $this->_make_attachment($upload);

		// intermediate copies should not exist
		$this->assertFalse( image_get_intermediate_size($id, 'thumbnail') );
		$this->assertFalse( image_get_intermediate_size($id, 'medium') );

		// medium and full size will both point to the original
		$downsize = image_downsize($id, 'medium');
		$this->assertEquals( basename( $upload['file'] ), basename($downsize[0]) );
		$this->assertEquals( 50, $downsize[1] );
		$this->assertEquals( 50, $downsize[2] );

		$downsize = image_downsize($id, 'full');
		$this->assertEquals( basename( $upload['file'] ), basename($downsize[0]) );
		$this->assertEquals( 50, $downsize[1] );
		$this->assertEquals( 50, $downsize[2] );

	}

	function test_insert_image_thumb_only() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		update_option( 'medium_size_w', 0 );
		update_option( 'medium_size_h', 0 );

		$filename = ( DIR_TESTDATA.'/images/a2-small.jpg' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$id = $this->_make_attachment($upload);

		// intermediate copies should exist: thumbnail only
		$thumb = image_get_intermediate_size($id, 'thumbnail');
		$this->assertEquals( 'a2-small-150x150.jpg', $thumb['file'] );

		$uploads = wp_upload_dir();
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $thumb['path']) );

		$this->assertFalse( image_get_intermediate_size($id, 'medium') );

		// the thumb url should point to the thumbnail intermediate
		$this->assertEquals( $thumb['url'], wp_get_attachment_thumb_url($id) );

		// image_downsize() should return the correct images and sizes
		$downsize = image_downsize($id, 'thumbnail');
		$this->assertEquals( 'a2-small-150x150.jpg', basename($downsize[0]) );
		$this->assertEquals( 150, $downsize[1] );
		$this->assertEquals( 150, $downsize[2] );

		// medium and full will both point to the original
		$downsize = image_downsize($id, 'medium');
		$this->assertEquals( 'a2-small.jpg', basename($downsize[0]) );
		$this->assertEquals( 400, $downsize[1] );
		$this->assertEquals( 300, $downsize[2] );

		$downsize = image_downsize($id, 'full');
		$this->assertEquals( 'a2-small.jpg', basename($downsize[0]) );
		$this->assertEquals( 400, $downsize[1] );
		$this->assertEquals( 300, $downsize[2] );

	}

	function test_insert_image_medium() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		update_option('medium_size_w', 400);
		update_option('medium_size_h', 0);

		$filename = ( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$id = $this->_make_attachment($upload);
		$uploads = wp_upload_dir();

		// intermediate copies should exist: thumbnail and medium
		$thumb = image_get_intermediate_size($id, 'thumbnail');
		$this->assertEquals( '2007-06-17DSC_4173-150x150.jpg', $thumb['file'] );
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $thumb['path']) );

		$medium = image_get_intermediate_size($id, 'medium');
		$this->assertEquals( '2007-06-17DSC_4173-400x602.jpg', $medium['file'] );
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $medium['path']) );

		// the thumb url should point to the thumbnail intermediate
		$this->assertEquals( $thumb['url'], wp_get_attachment_thumb_url($id) );

		// image_downsize() should return the correct images and sizes
		$downsize = image_downsize($id, 'thumbnail');
		$this->assertEquals( '2007-06-17DSC_4173-150x150.jpg', basename($downsize[0]) );
		$this->assertEquals( 150, $downsize[1] );
		$this->assertEquals( 150, $downsize[2] );

		$downsize = image_downsize($id, 'medium');
		$this->assertEquals( '2007-06-17DSC_4173-400x602.jpg', basename($downsize[0]) );
		$this->assertEquals( 400, $downsize[1] );
		$this->assertEquals( 602, $downsize[2] );

		$downsize = image_downsize($id, 'full');
		$this->assertEquals( '2007-06-17DSC_4173.jpg', basename($downsize[0]) );
		$this->assertEquals( 680, $downsize[1] );
		$this->assertEquals( 1024, $downsize[2] );
	}


	function test_insert_image_delete() {
		if ( !function_exists( 'imagejpeg' ) )
			$this->markTestSkipped( 'jpeg support unavailable' );

		update_option('medium_size_w', 400);
		update_option('medium_size_h', 0);

		$filename = ( DIR_TESTDATA.'/images/2007-06-17DSC_4173.JPG' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$id = $this->_make_attachment($upload);
		$uploads = wp_upload_dir();

		// check that the file and intermediates exist
		$thumb = image_get_intermediate_size($id, 'thumbnail');
		$this->assertEquals( '2007-06-17DSC_4173-150x150.jpg', $thumb['file'] );
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $thumb['path']) );

		$medium = image_get_intermediate_size($id, 'medium');
		$this->assertEquals( '2007-06-17DSC_4173-400x602.jpg', $medium['file'] );
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $medium['path']) );

		$meta = wp_get_attachment_metadata($id);
		$original = $meta['file'];
		$this->assertTrue( is_file($uploads['basedir'] . DIRECTORY_SEPARATOR . $original) );

		// now delete the attachment and make sure all files are gone
		wp_delete_attachment($id);

		$this->assertFalse( is_file($thumb['path']) );
		$this->assertFalse( is_file($medium['path']) );
		$this->assertFalse( is_file($original) );
	}

	/**
	 * GUID should never be empty
	 * @ticket 18310
	 * @ticket 21963
	 */
	function test_insert_image_without_guid() {
		// this image is smaller than the thumbnail size so it won't have one
		$filename = ( DIR_TESTDATA.'/images/test-image.jpg' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits(basename($filename), null, $contents);
		$this->assertTrue( empty($upload['error']) );

		$upload['url'] = '';
		$id = $this->_make_attachment( $upload );

		$guid = get_the_guid( $id );
		$this->assertFalse( empty( $guid ) );
	}

	/**
	 * @ticket 21963
	 */
	function test_update_attachment_fields() {
		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents($filename);

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		$id = $this->_make_attachment( $upload );

		$attached_file = get_post_meta( $id, '_wp_attached_file', true );

		$post = get_post( $id, ARRAY_A );

		$post['post_title'] = 'title';
		$post['post_excerpt'] = 'caption';
		$post['post_content'] = 'description';

		wp_update_post( $post );

		// Make sure the update didn't remove the attached file.
		$this->assertEquals( $attached_file, get_post_meta( $id, '_wp_attached_file', true ) );
	}

	/**
	 * @ticket 29646
	 */
	function test_update_orphan_attachment_parent() {
		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		$attachment_id = $this->_make_attachment( $upload );

		// Assert that the attachment is an orphan
		$attachment = get_post( $attachment_id );
		$this->assertEquals( $attachment->post_parent, 0 );

		$post_id = wp_insert_post( array( 'post_content' => rand_str(), 'post_title' => rand_str() ) );

		// Assert that the attachment has a parent
		wp_insert_attachment( $attachment, '', $post_id );
		$attachment = get_post( $attachment_id );
		$this->assertEquals( $attachment->post_parent, $post_id );
	}

	/**
	 * @ticket 15928
	 */
	public function test_wp_get_attachment_url_should_not_force_https_when_current_page_is_non_ssl_and_siteurl_is_non_ssl() {
		$siteurl = get_option( 'siteurl' );
		update_option( 'siteurl', set_url_scheme( $siteurl, 'http' ) );

		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID.
		$attachment_id = $this->_make_attachment( $upload );

		// Save server data for cleanup.
		$is_ssl = is_ssl();
		$_SERVER['HTTPS'] = 'off';

		$url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( set_url_scheme( $url, 'http' ), $url );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
	}

	/**
	 * @ticket 15928
	 *
	 * This situation (current request is non-SSL but siteurl is https) should never arise.
	 */
	public function test_wp_get_attachment_url_should_not_force_https_when_current_page_is_non_ssl_and_siteurl_is_ssl() {
		$siteurl = get_option( 'siteurl' );
		update_option( 'siteurl', set_url_scheme( $siteurl, 'https' ) );

		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID.
		$attachment_id = $this->_make_attachment( $upload );

		// Save server data for cleanup.
		$is_ssl = is_ssl();
		$_SERVER['HTTPS'] = 'off';

		$url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( set_url_scheme( $url, 'http' ), $url );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
	}

	/**
	 * @ticket 15928
	 *
	 * Canonical siteurl is non-SSL, but SSL support is available/optional.
	 */
	public function test_wp_get_attachment_url_should_force_https_with_https_on_same_host_when_siteurl_is_non_ssl_but_ssl_is_available() {
		$siteurl = get_option( 'siteurl' );
		update_option( 'siteurl', set_url_scheme( $siteurl, 'http' ) );

		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID
		$attachment_id = $this->_make_attachment( $upload );

		// Save server data for cleanup
		$is_ssl = is_ssl();
		$http_host = $_SERVER['HTTP_HOST'];

		$_SERVER['HTTPS'] = 'on';

		// Verify that server host matches the host of wp_upload_dir().
		$upload_dir = wp_upload_dir();
		$_SERVER['HTTP_HOST'] = parse_url( $upload_dir['baseurl'], PHP_URL_HOST );

		// Test that wp_get_attachemt_url returns with https scheme.
		$url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( set_url_scheme( $url, 'https' ), $url );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
		$_SERVER['HTTP_HOST'] = $http_host;
	}

	/**
	 * @ticket 15928
	 */
	public function test_wp_get_attachment_url_with_https_on_same_host_when_siteurl_is_https() {
		$siteurl = get_option( 'siteurl' );
		update_option( 'siteurl', set_url_scheme( $siteurl, 'https' ) );

		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID.
		$attachment_id = $this->_make_attachment( $upload );

		// Save server data for cleanup.
		$is_ssl = is_ssl();
		$http_host = $_SERVER['HTTP_HOST'];

		$_SERVER['HTTPS'] = 'on';

		// Verify that server host matches the host of wp_upload_dir().
		$upload_dir = wp_upload_dir();
		$_SERVER['HTTP_HOST'] = parse_url( $upload_dir['baseurl'], PHP_URL_HOST );

		// Test that wp_get_attachemt_url returns with https scheme.
		$url = wp_get_attachment_url( $attachment_id );
		$this->assertSame( set_url_scheme( $url, 'https' ), $url );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
		$_SERVER['HTTP_HOST'] = $http_host;
	}

	/**
	* @ticket 15928
	*/
	public function test_wp_get_attachment_url_should_not_force_https_when_administering_over_https_but_siteurl_is_not_https() {
		$siteurl = get_option( 'siteurl' );
		update_option( 'siteurl', set_url_scheme( $siteurl, 'http' ) );

		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID
		$attachment_id = $this->_make_attachment( $upload );

		$is_ssl = is_ssl();
		$_SERVER['HTTPS'] = 'on';
		set_current_screen( 'dashboard' );

		$url = wp_get_attachment_url( $attachment_id );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
		set_current_screen( 'front' );

		$this->assertSame( set_url_scheme( $url, 'http' ), $url );
	}

	/**
	 * @ticket 15928
	 */
	public function test_wp_get_attachment_url_should_force_https_when_administering_over_https_and_siteurl_is_https() {
		// Must set the upload_url_path to fake out `wp_upload_dir()`.
		$siteurl = get_option( 'siteurl' );
		update_option( 'upload_url_path', set_url_scheme( $siteurl, 'https' ) . '/uploads' );

		$filename = ( DIR_TESTDATA . '/images/test-image.jpg' );
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$this->assertTrue( empty( $upload['error'] ) );

		// Set attachment ID
		$attachment_id = $this->_make_attachment( $upload );

		$is_ssl = is_ssl();
		$_SERVER['HTTPS'] = 'on';
		set_current_screen( 'dashboard' );

		$url = wp_get_attachment_url( $attachment_id );

		// Cleanup.
		$_SERVER['HTTPS'] = $is_ssl ? 'on' : 'off';
		set_current_screen( 'front' );

		$this->assertSame( set_url_scheme( $url, 'https' ), $url );
	}

	public function test_wp_attachment_is() {
		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$attachment_id = $this->_make_attachment( $upload );

		$this->assertTrue( wp_attachment_is_image( $attachment_id ) );
		$this->assertTrue( wp_attachment_is( 'image', $attachment_id ) );
		$this->assertFalse( wp_attachment_is( 'audio', $attachment_id ) );
		$this->assertFalse( wp_attachment_is( 'video', $attachment_id ) );
	}

	public function test_wp_attachment_is_default() {
		// On Multisite, psd is not an allowed mime type by default.
		if ( is_multisite() ) {
			add_filter( 'upload_mimes', array( $this, 'whitelist_psd_mime_type' ), 10, 2 );
		}

		$filename = DIR_TESTDATA . '/images/test-image.psd';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );
		$attachment_id = $this->_make_attachment( $upload );

		$this->assertFalse( wp_attachment_is_image( $attachment_id ) );
		$this->assertTrue( wp_attachment_is( 'psd', $attachment_id ) );
		$this->assertFalse( wp_attachment_is( 'audio', $attachment_id ) );
		$this->assertFalse( wp_attachment_is( 'video', $attachment_id ) );

		if ( is_multisite() ) {
			remove_filter( 'upload_mimes', array( $this, 'whitelist_psd_mime_type' ), 10, 2 );
		}
	}

	public function test_upload_mimes_filter_is_applied() {
		$filename = DIR_TESTDATA . '/images/test-image.jpg';
		$contents = file_get_contents( $filename );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );

		$this->assertFalse( $upload['error'] );

		add_filter( 'upload_mimes', array( $this, 'blacklist_jpg_mime_type' ) );

		$upload = wp_upload_bits( basename( $filename ), null, $contents );

		$this->assertNotEmpty( $upload['error'] );

		remove_filter( 'upload_mimes', array( $this, 'blacklist_jpg_mime_type' ) );
	}

	public function whitelist_psd_mime_type( $mimes ) {
		$mimes['psd'] = 'application/octet-stream';
		return $mimes;
	}

	public function blacklist_jpg_mime_type( $mimes ) {
		unset( $mimes['jpg|jpeg|jpe'] );
		return $mimes;
	}
}
