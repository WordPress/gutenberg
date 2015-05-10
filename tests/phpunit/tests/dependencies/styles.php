<?php
/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies_Styles extends WP_UnitTestCase {
	var $old_wp_styles;

	function setUp() {
		parent::setUp();
		if ( empty( $GLOBALS['wp_styles'] ) )
			$GLOBALS['wp_styles'] = null;
		$this->old_wp_styles = $GLOBALS['wp_styles'];
		remove_action( 'wp_default_styles', 'wp_default_styles' );
		remove_action( 'wp_print_styles', 'print_emoji_styles' );
		$GLOBALS['wp_styles'] = new WP_Styles();
		$GLOBALS['wp_styles']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		$GLOBALS['wp_styles'] = $this->old_wp_styles;
		add_action( 'wp_default_styles', 'wp_default_styles' );
		add_action( 'wp_print_styles', 'print_emoji_styles' );
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

	/**
	 * Test if inline styles work
	 * @ticket 24813
	 */
	public function test_inline_styles() {

		$style  = ".thing {\n";
		$style .= "\tbackground: red;\n";
		$style .= "}";

		$expected  = "<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />\n";
		$expected .= "<style id='handle-inline-css' type='text/css'>\n";
		$expected .= "$style\n";
		$expected .= "</style>\n";

		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );
		wp_add_inline_style( 'handle', $style );

		// No styles left to print
		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );
	}

	/**
	 * Test if inline styles work with concatination
	 * @global WP_Styles $wp_styles
	 * @ticket 24813
	 */
	public function test_inline_styles_concat() {

		global $wp_styles;

		$wp_styles->do_concat = true;
		$wp_styles->default_dirs = array( '/wp-admin/', '/wp-includes/css/' ); // Default dirs as in wp-includes/script-loader.php

		$style  = ".thing {\n";
		$style .= "\tbackground: red;\n";
		$style .= "}";

		$expected  = "<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />\n";
		$expected .= "<style id='handle-inline-css' type='text/css'>\n";
		$expected .= "$style\n";
		$expected .= "</style>\n";

		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );
		wp_add_inline_style( 'handle', $style );

		wp_print_styles();
		$this->assertEquals( $expected, $wp_styles->print_html );

	}

	/**
	 * Test if multiple inline styles work
	 * @ticket 24813
	 */
	public function test_multiple_inline_styles() {

		$style1  = ".thing1 {\n";
		$style1 .= "\tbackground: red;\n";
		$style1 .= "}";

		$style2  = ".thing2 {\n";
		$style2 .= "\tbackground: blue;\n";
		$style2 .= "}";

		$expected  = "<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />\n";
		$expected .= "<style id='handle-inline-css' type='text/css'>\n";
		$expected .= "$style1\n";
		$expected .= "$style2\n";
		$expected .= "</style>\n";

		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );
		wp_add_inline_style( 'handle', $style1 );
		wp_add_inline_style( 'handle', $style2 );

		// No styles left to print
		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );

	}

	/**
	 * Test if a plugin doing it the wrong way still works
	 *
	 * @expectedIncorrectUsage wp_add_inline_style
	 * @ticket 24813
	 */
	public function test_plugin_doing_inline_styles_wrong() {

		$style  = "<style id='handle-inline-css' type='text/css'>\n";
		$style .= ".thing {\n";
		$style .= "\tbackground: red;\n";
		$style .= "}\n";
		$style .= "</style>";

		$expected  = "<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />\n";
		$expected .= "$style\n";

		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );

		wp_add_inline_style( 'handle', $style );

		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );

	}

	/**
	 * Test to make sure <style> tags aren't output if there are no inline styles.
	 * @ticket 24813
	 */
	public function test_unnecessary_style_tags() {

		$expected  = "<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />\n";

		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );

		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );

	}

	/**
	 * Test to make sure that inline styles attached to conditional
	 * stylesheets are also conditional.
	 */
	public function test_conditional_inline_styles_are_also_conditional() {
		$expected = <<<CSS
<!--[if IE]>
<link rel='stylesheet' id='handle-css'  href='http://example.com?ver=1' type='text/css' media='all' />
<style id='handle-inline-css' type='text/css'>
a { color: blue; }
</style>
<![endif]-->

CSS;
		wp_enqueue_style( 'handle', 'http://example.com', array(), 1 );
		wp_style_add_data( 'handle', 'conditional', 'IE' );
		wp_add_inline_style( 'handle', 'a { color: blue; }' );

		$this->assertEquals( $expected, get_echo( 'wp_print_styles' ) );
	}

    /**
     * Testing 'wp_register_style' return boolean success/failure value.
     *
     * @ticket 31126
     */
    function test_wp_register_style(){
        $this->assertTrue( wp_register_style( 'duplicate-handler', 'http://example.com' ) );
        $this->assertFalse( wp_register_style( 'duplicate-handler', 'http://example.com' ) );
    }

}
