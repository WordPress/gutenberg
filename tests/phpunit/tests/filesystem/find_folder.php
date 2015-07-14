<?php

require_once dirname( __FILE__ ) . '/base.php';

/**
 * @group filesystem
 * @group wp-filesystem
 */
class WP_Filesystem_find_folder_UnitTestCases extends WP_Filesystem_UnitTestCase {

	function test_ftp_has_root_access() {
		global $wp_filesystem;
		$fs = $wp_filesystem;
		$fs->init('
			/var/www/wordpress/
			/var/www/wordpress/wp-includes/
			/var/www/wordpress/index.php
		');

		$path = $fs->find_folder( '/var/www/wordpress/' );
		$this->assertEquals( '/var/www/wordpress/', $path );

		$path = $fs->find_folder( '/this/directory/doesnt/exist/' );
		$this->assertFalse( $path );

	}

	function test_sibling_wordpress_in_subdir() {
		global $wp_filesystem;
		$fs = $wp_filesystem;
		$fs->init('
			/www/example.com/wordpress/
			/www/example.com/wordpress/wp-includes/
			/www/example.com/wordpress/index.php
			/www/wp.example.com/wordpress/
			/www/wp.example.com/wordpress/wp-includes/
			/www/wp.example.com/wordpress/wp-content/
			/www/wp.example.com/wordpress/index.php
			/www/index.php
		');

		$path = $fs->find_folder( '/var/www/example.com/wordpress/' );
		$this->assertEquals( '/www/example.com/wordpress/', $path );
		
		$path = $fs->find_folder( '/var/www/wp.example.com/wordpress/wp-content/' );
		$this->assertEquals( '/www/wp.example.com/wordpress/wp-content/', $path );

	}

	/**
	 * Two WordPress installs, with one contained within the other
	 * FTP / = /var/www/example.com/ on Disk
	 * example.com at /
	 * wp.example.com at /wp.example.com/wordpress/
	 */
	function test_subdir_of_another() {
		global $wp_filesystem;
		$fs = $wp_filesystem;
		$fs->init('
			/wp.example.com/index.php
			/wp.example.com/wordpress/
			/wp.example.com/wordpress/wp-includes/
			/wp.example.com/wordpress/index.php
			/wp-includes/
			/index.php
		');

		$path = $fs->abspath( '/var/www/example.com/wp.example.com/wordpress/' );
		$this->assertEquals( '/wp.example.com/wordpress/', $path );
		
		$path = $fs->abspath( '/var/www/example.com/' );
		$this->assertEquals( '/', $path );

	}

	/**
	 * Test the WordPress ABSPATH containing TWO tokens (www) of which exists in the current FTP home.
	 *
	 * @ticket 20934
	 */
	function test_multiple_tokens_in_path1() {
		global $wp_filesystem;
		$fs = $wp_filesystem;
		$fs->init('
			# www.example.com
			/example.com/www/index.php
			/example.com/www/wp-includes/
			/example.com/www/wp-content/plugins/
			
			# sub.example.com
			/example.com/sub/index.php
			/example.com/sub/wp-includes/
			/example.com/sub/wp-content/plugins/
		');

		// www.example.com
		$path = $fs->abspath( '/var/www/example.com/www/' );
		$this->assertEquals( '/example.com/www/', $path );

		// sub.example.com
		$path = $fs->abspath( '/var/www/example.com/sub/' );
		$this->assertEquals( '/example.com/sub/', $path );

		// sub.example.com - Plugins
		$path = $fs->find_folder( '/var/www/example.com/sub/wp-content/plugins/' );
		$this->assertEquals( '/example.com/sub/wp-content/plugins/', $path );
	}

}