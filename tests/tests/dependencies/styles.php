<?php
/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies_Styles extends WP_UnitTestCase {
	var $old_wp_styles;

	function setUp() {
		parent::setUp();
		$this->old_wp_styles = $GLOBALS['wp_styles'];
		remove_action( 'wp_default_styles', 'wp_default_styles' );
		$GLOBALS['wp_styles'] = new WP_Styles();
		$GLOBALS['wp_styles']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		$GLOBALS['wp_styles'] = $this->old_wp_styles;
		add_action( 'wp_default_styles', 'wp_default_styles' );
		parent::tearDown();
	}

	/**
	 * Test versioning
	 * @ticket 11315
	 */
	function test_wp_enqueue_style() {
		wp_enqueue_style('no-deps-no-version', 'example.com' );
		wp_enqueue_style('no-deps-version', 'example.com', array(), 1.2);
		wp_enqueue_style('no-deps-null-version', 'example.com', array(), null);
		wp_enqueue_style('no-deps-null-version-print-media', 'example.com', array(), null, 'print');
		$ver = get_bloginfo( 'version' );
		$expected  = "<link rel='stylesheet' id='no-deps-no-version-css'  href='http://example.com?ver=$ver' type='text/css' media='all' />\n";
		$expected .= "<link rel='stylesheet' id='no-deps-version-css'  href='http://example.com?ver=1.2' type='text/css' media='all' />\n";
		$expected .= "<link rel='stylesheet' id='no-deps-null-version-css'  href='http://example.com' type='text/css' media='all' />\n";
		$expected .= "<link rel='stylesheet' id='no-deps-null-version-print-media-css'  href='http://example.com' type='text/css' media='print' />\n";

		$this->assertEquals($expected, get_echo('wp_print_styles'));

		// No styles left to print
		$this->assertEquals("", get_echo('wp_print_styles'));
	}

	/**
	 * Test the different protocol references in wp_enqueue_style
	 * @global WP_Styles $wp_styles
	 * @ticket 16560
	 */
	public function test_protocols() {
		// Init
		global $wp_styles;
		$base_url_backup = $wp_styles->base_url;
		$wp_styles->base_url = 'http://example.com/wordpress';
		$expected = '';
		$ver = get_bloginfo( 'version' );

		// Try with an HTTP reference
		wp_enqueue_style( 'reset-css-http', 'http://yui.yahooapis.com/2.8.1/build/reset/reset-min.css' );
		$expected  .= "<link rel='stylesheet' id='reset-css-http-css'  href='http://yui.yahooapis.com/2.8.1/build/reset/reset-min.css?ver=$ver' type='text/css' media='all' />\n";

		// Try with an HTTPS reference
		wp_enqueue_style( 'reset-css-https', 'http://yui.yahooapis.com/2.8.1/build/reset/reset-min.css' );
		$expected  .= "<link rel='stylesheet' id='reset-css-https-css'  href='http://yui.yahooapis.com/2.8.1/build/reset/reset-min.css?ver=$ver' type='text/css' media='all' />\n";

		// Try with an automatic protocol reference (//)
		wp_enqueue_style( 'reset-css-doubleslash', '//yui.yahooapis.com/2.8.1/build/reset/reset-min.css' );
		$expected  .= "<link rel='stylesheet' id='reset-css-doubleslash-css'  href='//yui.yahooapis.com/2.8.1/build/reset/reset-min.css?ver=$ver' type='text/css' media='all' />\n";

		// Try with a local resource and an automatic protocol reference (//)
		$url = '//my_plugin/style.css';
		wp_enqueue_style( 'plugin-style', $url );
		$expected  .= "<link rel='stylesheet' id='plugin-style-css'  href='$url?ver=$ver' type='text/css' media='all' />\n";

		// Try with a bad protocol
		wp_enqueue_style( 'reset-css-ftp', 'ftp://yui.yahooapis.com/2.8.1/build/reset/reset-min.css' );
		$expected  .= "<link rel='stylesheet' id='reset-css-ftp-css'  href='{$wp_styles->base_url}ftp://yui.yahooapis.com/2.8.1/build/reset/reset-min.css?ver=$ver' type='text/css' media='all' />\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );

		// No styles left to print
		$this->assertEquals( '', get_echo( 'wp_print_styles' ) );

		// Cleanup
		$wp_styles->base_url = $base_url_backup;
	}
}
