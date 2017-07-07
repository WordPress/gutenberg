<?php
/**
 * Server-side performance tests
 *
 * @package Gutenberg
 */

// To run these tests, set the RUN_SLOW_TESTS environment variable to a truthy
// value.
if ( getenv( 'RUN_SLOW_TESTS' ) ) {
	class Performance_Test extends WP_UnitTestCase {
		function test_parse_large_post() {
			$start = microtime( true );
			$start_mem = memory_get_usage();

			$html = file_get_contents(
				dirname( __FILE__ ) . '/fixtures/long-content.html'
			);
			$parser = new Gutenberg_PEG_Parser;
			$parser->parse( $html );

			$time = microtime( true ) - $start;
			$mem = memory_get_usage() - $start_mem;

			$this->assertLessThanOrEqual(
				0.3, // Seconds.
				$time,
				sprintf(
					"Parsing 'phpunit/fixtures/long-content.html' took too long. Time: %s (seconds), memory used: %sKB.",
					( round( $time * 100 ) / 100 ),
					round( $mem / 1024 )
				)
			);
		}
	}
}
