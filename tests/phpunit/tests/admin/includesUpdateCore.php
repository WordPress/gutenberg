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
	 * Ensure no project files are inside `$_old_files`.
	 *
	 * @ticket 36083
	 *
	 * @dataProvider data_old_files
	 *
	 * @param string $file File name.
	 */
	public function test_new_files_are_not_in_old_files_array( $file ) {
		$this->assertFalse( file_exists( ABSPATH . $file ) );
		$this->assertFalse( file_exists( ABSPATH . str_replace( '.min.', '.', $file ) ) );
		$this->assertFalse( file_exists( ABSPATH . str_replace( '-rtl.min.', '.', $file ) ) );
	}

	/**
	 * Ensure no project files are inside `$_old_files` in the build directory.
	 *
	 * The previous test confirms that no existing files are inside `$_old_files`.
	 * However, we must also confirm that these do not exist in the final build.
	 *
	 * @ticket 36083
	 *
	 * @depends test_new_files_are_not_in_old_files_array
	 * @dataProvider data_old_files
	 *
	 * @param string $file File name.
	 */
	public function test_new_files_are_not_in_old_files_array_compiled( $file ) {
		$this->assertFalse( file_exists( dirname( ABSPATH ) . '/build/' . $file ) );
	}
}
