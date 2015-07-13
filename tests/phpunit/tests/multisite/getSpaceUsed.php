<?php

if ( is_multisite() ) :

/**
 * @group multisite
 * @covers ::get_space_used
 */
class Tests_Multisite_Get_Space_Used extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER['REMOTE_ADDR'] = '';
	}

	function tearDown() {
		global $wpdb;
		$wpdb->suppress_errors( $this->suppress );
		parent::tearDown();
	}

	function test_get_space_used_switched_site() {
		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		// Our comparison of space relies on an initial value of 0. If a previous test has failed or if the
		// src directory already contains a content directory with site content, then the initial expectation
		// will be polluted. We create sites until an empty one is available.
		while ( 0 != get_space_used() ) {
			restore_current_blog();
			$blog_id = $this->factory->blog->create();
			switch_to_blog( $blog_id );
		}

		// Upload a file to the new site.
		$filename = rand_str().'.jpg';
		$contents = rand_str();
		$file = wp_upload_bits( $filename, null, $contents );

		// get_space_used() is measures in MB, get the size of the new file in MB.
		$size = filesize( $file['file'] ) / 1024 / 1024;

		delete_transient( 'dirsize_cache' );

		$this->assertEquals( $size, get_space_used() );
		$upload_dir = wp_upload_dir();
		$this->remove_added_uploads();
		$this->delete_folders( $upload_dir['basedir'] );
		restore_current_blog();
	}

	/**
	 * Directories of sub sites on a network should not count against the same spaced used total for
	 * the main site.
	 */
	function test_get_space_used_main_site() {
		$space_used = get_space_used();

		$blog_id = $this->factory->blog->create();
		switch_to_blog( $blog_id );

		// We don't rely on an initial value of 0 for space used, but should have a clean space available
		// so that we can remove any uploaded files and directories without concern of a conflict with
		// existing content directories in src.
		while ( 0 != get_space_used() ) {
			restore_current_blog();
			$blog_id = $this->factory->blog->create();
			switch_to_blog( $blog_id );
		}

		// Upload a file to the new site.
		$filename = rand_str().'.jpg';
		$contents = rand_str();
		wp_upload_bits( $filename, null, $contents );

		restore_current_blog();

		delete_transient( 'dirsize_cache' );

		$this->assertEquals( $space_used, get_space_used() );

		// Switch back to the new site to remove the uploaded file.
		switch_to_blog( $blog_id );
		$upload_dir = wp_upload_dir();
		$this->remove_added_uploads();
		$this->delete_folders( $upload_dir['basedir'] );
		restore_current_blog();
	}

	function test_get_space_used_pre_get_spaced_used_filter() {
		add_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );

		$this->assertEquals( 300, get_space_used() );

		remove_filter( 'pre_get_space_used', array( $this, '_filter_space_used' ) );
	}

	function _filter_space_used() {
		return 300;
	}
}
endif;