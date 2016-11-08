<?php

/**
 * @group admin
 * @group upgrade
 */
class Tests_Admin_IncludesUpdateCore extends WP_UnitTestCase {
	public function data_old_files() {
		global $_old_files;

		require_once( ABSPATH . 'wp-admin/includes/update-core.php' );

		$files = $_old_files;

		foreach ( $files as &$file ) {
			$file = array( $file );
		}

		return $files;
	}

	/**
	 * Ensure no project files are inside `$_old_files` in the build directory.
	 *
	 * @ticket 36083
	 *
	 * @dataProvider data_old_files
	 *
	 * @param string $file File name.
	 */
	public function test_new_files_are_not_in_old_files_array_compiled( $file ) {
		$this->assertFileNotExists( dirname( ABSPATH ) . '/build/' . $file );
	}
}
