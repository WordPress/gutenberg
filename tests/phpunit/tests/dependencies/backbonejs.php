<?php

/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies_Backbonejs extends WP_UnitTestCase {

	function test_exclusion_of_sourcemaps() {
		$file = ABSPATH . WPINC . '/js/backbone.min.js';
		$this->assertTrue( file_exists( $file ) );
		$contents = trim( file_get_contents( $file ) );
		$this->assertFalse( strpos( $contents, 'sourceMappingURL' ), 'Presence of sourceMappingURL' );
	}
}
