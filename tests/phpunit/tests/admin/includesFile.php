<?php

/**
 * @group file
 * @group admin
 */
class Tests_Admin_includesFile extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
	}

	/**
	 * @ticket 20449
	 */
	function test_get_home_path() {
		$home = get_option( 'home' );
		$siteurl = get_option( 'siteurl' );
		$sfn = $_SERVER['SCRIPT_FILENAME'];
		$this->assertEquals( str_replace( '\\', '/', ABSPATH ), get_home_path() );

		update_option( 'home', 'http://localhost' );
		update_option( 'siteurl', 'http://localhost/wp' );

		$_SERVER['SCRIPT_FILENAME'] = 'D:\root\vhosts\site\httpdocs\wp\wp-admin\options-permalink.php';
		$this->assertEquals( 'D:/root/vhosts/site/httpdocs/', get_home_path() );

		$_SERVER['SCRIPT_FILENAME'] = '/Users/foo/public_html/trunk/wp/wp-admin/options-permalink.php';
		$this->assertEquals( '/Users/foo/public_html/trunk/', get_home_path() );

		$_SERVER['SCRIPT_FILENAME'] = 'S:/home/wordpress/trunk/wp/wp-admin/options-permalink.php';
		$this->assertEquals( 'S:/home/wordpress/trunk/', get_home_path() );

		update_option( 'home', $home );
		update_option( 'siteurl', $siteurl );
		$_SERVER['SCRIPT_FILENAME'] = $sfn;
	}
}