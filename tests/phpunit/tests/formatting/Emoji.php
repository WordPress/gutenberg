<?php

/**
 * @group formatting
 */
class Tests_Formatting_Emoji extends WP_UnitTestCase {
	/**
	 * @ticket 36525
	 */
	public function test_unfiltered_emoji_cdns() {
		$png_cdn = 'https://s.w.org/images/core/emoji/2.2.5/72x72/';
		$svn_cdn = 'https://s.w.org/images/core/emoji/2.2.5/svg/';

		$output = get_echo( '_print_emoji_detection_script' );

		$this->assertContains( wp_json_encode( $png_cdn ), $output );
		$this->assertContains( wp_json_encode( $svn_cdn ), $output );
	}

	public function _filtered_emoji_svn_cdn( $cdn = '' ) {
		return 'https://s.wordpress.org/images/core/emoji/svg/';
	}

	/**
	 * @ticket 36525
	 */
	public function test_filtered_emoji_svn_cdn() {
		$png_cdn = 'https://s.w.org/images/core/emoji/2.2.5/72x72/';
		$svn_cdn = 'https://s.w.org/images/core/emoji/2.2.5/svg/';

		$filtered_svn_cdn = $this->_filtered_emoji_svn_cdn();

		add_filter( 'emoji_svg_url', array( $this, '_filtered_emoji_svn_cdn' ) );

		$output = get_echo( '_print_emoji_detection_script' );

		$this->assertContains( wp_json_encode( $png_cdn ), $output );
		$this->assertNotContains( wp_json_encode( $svn_cdn ), $output );
		$this->assertContains( wp_json_encode( $filtered_svn_cdn ), $output );

		remove_filter( 'emoji_svg_url', array( $this, '_filtered_emoji_svn_cdn' ) );
	}

	public function _filtered_emoji_png_cdn( $cdn = '' ) {
		return 'https://s.wordpress.org/images/core/emoji/png_cdn/';
	}

	/**
	 * @ticket 36525
	 */
	public function test_filtered_emoji_png_cdn() {
		$png_cdn = 'https://s.w.org/images/core/emoji/2.2.5/72x72/';
		$svn_cdn = 'https://s.w.org/images/core/emoji/2.2.5/svg/';

		$filtered_png_cdn = $this->_filtered_emoji_png_cdn();

		add_filter( 'emoji_url', array( $this, '_filtered_emoji_png_cdn' ) );

		$output = get_echo( '_print_emoji_detection_script' );

		$this->assertContains( wp_json_encode( $filtered_png_cdn ), $output );
		$this->assertNotContains( wp_json_encode( $png_cdn ), $output );
		$this->assertContains( wp_json_encode( $svn_cdn ), $output );

		remove_filter( 'emoji_url', array( $this, '_filtered_emoji_png_cdn' ) );
	}

}
