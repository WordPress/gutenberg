<?php

/**
 * Test list_files().
 *
 * @group functions.php
 */
class Tests_Functions_ListFiles extends WP_UnitTestCase {
	public function test_list_files_returns_a_list_of_files() {
		$admin_files = list_files( ABSPATH . 'wp-admin/' );
		$this->assertInternalType( 'array', $admin_files );
		$this->assertNotEmpty( $admin_files );
		$this->assertContains( ABSPATH . 'wp-admin/index.php', $admin_files );
	}

	public function test_list_files_can_exclude_files() {
		$admin_files = list_files( ABSPATH . 'wp-admin/', 100, array( 'index.php' ) );
		$this->assertNotContains( ABSPATH . 'wp-admin/index.php', $admin_files );
	}
}
