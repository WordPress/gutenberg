<?php

class Tests_Font_Library_FontDirCanBeFiltered extends WP_UnitTestCase {

	public function test_font_directory_can_be_filtered() {
		/*
		 * Naive filtering of uploads directory to return font directory.
		 *
		 * This emulates the approach a plugin developer may take to
		 * add the filter when extending the font library functionality.
		 */
		add_filter( 'upload_dir', 'wp_get_font_dir' );

		add_filter(
			'upload_dir',
			function ( $upload_dir ) {
				static $count = 0;
				++$count;
				// It may be hit a couple of times, at five iterations assume an infinite loop.
				$this->assertLessThan( 5, $count, 'Filtering uploads directory should not trigger infinite loop.' );
				return $upload_dir;
			},
			5
		);

		/*
		 * Filter the font directory to return the uploads directory.
		 *
		 * The emulates a moving font files back to the uploads directory due
		 * to file system structure.
		 */
		add_filter( 'font_dir', 'wp_get_upload_dir' );

		wp_get_upload_dir();

		// This will never be hit if an infinite loop is triggered.
		$this->assertTrue( true );
	}
}
