<?php
/**
 * Tests for core/rss Gutenberg block.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Class for testing the core/rss Gutenberg block.
 *
 * @group blocks
 */
class Tests_Blocks_Render_Rss extends WP_UnitTestCase {

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'wp_feed_cache_transient_lifetime', '__return_zero' );
		add_filter( 'pre_http_request', array( $this, 'mock_http_request' ), 10, 3 );
	}

	/**
	 * Mock HTTP request to return test feed data.
	 *
	 * @param bool|array $response The existing response or false.
	 * @param array      $args     The request arguments.
	 * @param string     $url      The request URL.
	 * @return array The mocked response.
	 */
	public function mock_http_request( $response, $args, $url ) {
		$feeds = array(
			'https://example.com/testrss.xml'     => 'feed-with-gmt-offset.xml',
			'https://example.com/testrss-dst.xml' => 'feed-across-dst.xml',
		);

		if ( ! isset( $feeds[ $url ] ) ) {
			return $response;
		}

		return array(
			'headers'  => array(
				'content-type' => 'application/rss+xml; charset=UTF-8',
			),
			// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
			'body'     => file_get_contents( GUTENBERG_DIR_TESTDATA . 'feed/' . $feeds[ $url ] ),
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Sets up the "core/rss" block context for testing.
	 * This is needed to avoid null access in WP_Block_Supports::apply_block_supports().
	 */
	private function setup_block_context() {
		$block = array(
			'blockName' => 'core/rss',
			'attrs'     => array(),
		);

		$wp_block_supports = WP_Block_Supports::get_instance();
		$reflection        = new ReflectionClass( $wp_block_supports );
		$property          = $reflection->getProperty( 'block_to_render' );
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( $wp_block_supports, $block );
	}

	/**
	 * Test that the date in the RSS feed is correctly rendered in the HTML.
	 *
	 * @ticket 66970
	 *
	 * @covers ::gutenberg_render_block_core_rss
	 */
	public function test_rss_date_rendering() {

		update_option( 'date_format', 'F j, Y' );
		// We set to UTC+9 to test timezone conversion.
		update_option( 'gmt_offset', 9 );

		$this->setup_block_context();

		// Mock RSS Attributes.
		$attributes = array(
			'feedURL'        => 'https://example.com/testrss.xml',
			'itemsToShow'    => 2,
			'displayExcerpt' => false,
			'displayAuthor'  => false,
			'displayDate'    => true,
			'blockLayout'    => 'list',
		);

		$rendered_html = gutenberg_render_block_core_rss( $attributes );

		$this->assertStringContainsString( '<time datetime=', $rendered_html, 'No time element found in rendered HTML' );

		$this->assertStringContainsString( 'March 19, 2025', $rendered_html, 'Formatted date not found in rendered HTML' );

		$this->assertMatchesRegularExpression( '/<time datetime="[^"]*2025-03-19[^"]*"/', $rendered_html, 'ISO datetime format missing expected date' );
	}

	/**
	 * Test that each item's date uses the site's UTC offset on that item's date,
	 * not today's offset, when the site timezone observes daylight saving time.
	 *
	 * @ticket 86637
	 *
	 * @covers ::gutenberg_render_block_core_rss
	 */
	public function test_rss_date_rendering_across_daylight_saving_time() {
		// The feed has one item from each period, so a wrong offset fails whatever the current date.
		update_option( 'timezone_string', 'America/New_York' );

		$this->setup_block_context();

		$attributes = array(
			'feedURL'        => 'https://example.com/testrss-dst.xml',
			'itemsToShow'    => 2,
			'displayExcerpt' => false,
			'displayAuthor'  => false,
			'displayDate'    => true,
			'blockLayout'    => 'list',
		);

		$rendered_html = gutenberg_render_block_core_rss( $attributes );

		$this->assertStringContainsString( 'datetime="2026-01-15T18:30:00-05:00"', $rendered_html, 'Standard time item has the wrong datetime' );
		$this->assertStringContainsString( 'datetime="2026-07-16T00:30:00-04:00"', $rendered_html, 'Daylight saving time item has the wrong datetime' );
	}
}
