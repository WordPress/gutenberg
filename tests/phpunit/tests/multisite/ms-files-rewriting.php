<?php

if ( is_multisite() ) :

/**
 * Tests specific to the ms_files_rewriting option in multisite.
 *
 * The ms-files group tag must be used for these tests to run as the constants
 * set in ms_upload_constants() conflict with a non ms-files configuration.
 *
 * @group ms-files
 * @group multisite
 */
class Tests_Multisite_MS_Files_Rewriting extends WP_UnitTestCase {
	protected $suppress = false;

	function setUp() {
		global $wpdb;
		parent::setUp();
		$this->suppress = $wpdb->suppress_errors();

		$_SERVER[ 'REMOTE_ADDR' ] = '';

		update_site_option( 'ms_files_rewriting', 1 );
		ms_upload_constants();
	}

	function tearDown() {
		global $wpdb;

		update_site_option( 'ms_files_rewriting', 0 );
		parent::tearDown();
		$wpdb->suppress_errors( $this->suppress );
	}

	function test_switch_upload_dir() {
		$this->assertTrue( is_main_site() );

		$site = get_current_site();

		$user_id = $this->factory->user->create( array( 'role' => 'administrator' ) );
		$blog_id2 = $this->factory->blog->create( array( 'user_id' => $user_id ) );
		$info = wp_upload_dir();
		$this->assertEquals( 'http://' . $site->domain . '/wp-content/uploads/' . gmstrftime('%Y/%m'), $info['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/uploads/' . gmstrftime('%Y/%m'), $info['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info['subdir'] );
		$this->assertEquals( '', $info['error'] );

		switch_to_blog( $blog_id2 );
		$info2 = wp_upload_dir();
		$this->assertNotEquals( $info, $info2 );
		$this->assertEquals( get_option( 'siteurl' )  . '/wp-content/blogs.dir/' . get_current_blog_id() . '/files/' . gmstrftime('%Y/%m'), $info2['url'] );
		$this->assertEquals( ABSPATH . 'wp-content/blogs.dir/' . get_current_blog_id() . '/files/' . gmstrftime('%Y/%m'), $info2['path'] );
		$this->assertEquals( gmstrftime('/%Y/%m'), $info2['subdir'] );
		$this->assertEquals( '', $info2['error'] );
		restore_current_blog();
	}
}

endif;