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
			$result = $parser->parse( $html );

			$time = microtime( true ) - $start;
			$mem = memory_get_usage() - $start_mem;

			error_log( '' );
			error_log( 'Memory used (KB) : ' . round( $mem / 1024 ) );
			error_log( 'Time (seconds)   : ' . ( round( $time * 100 ) / 100 ) );

			$this->assertLessThanOrEqual(
				0.3,
				$time,
				"Parsing 'phpunit/fixtures/long-content.html' took too long."
			);
		}
	}
}
