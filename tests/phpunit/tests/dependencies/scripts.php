<?php
/**
 * @group dependencies
 * @group scripts
 */
class Tests_Dependencies_Scripts extends WP_UnitTestCase {
	var $old_wp_scripts;

	function setUp() {
		parent::setUp();
		$this->old_wp_scripts = isset( $GLOBALS['wp_scripts'] ) ? $GLOBALS['wp_scripts'] : null;
		remove_action( 'wp_default_scripts', 'wp_default_scripts' );
		$GLOBALS['wp_scripts'] = new WP_Scripts();
		$GLOBALS['wp_scripts']->default_version = get_bloginfo( 'version' );
	}

	function tearDown() {
		$GLOBALS['wp_scripts'] = $this->old_wp_scripts;
		add_action( 'wp_default_scripts', 'wp_default_scripts' );
		parent::tearDown();
	}

	/**
	 * Test versioning
	 * @ticket 11315
	 */
	function test_wp_enqueue_script() {
		wp_enqueue_script('no-deps-no-version', 'example.com', array());
		wp_enqueue_script('empty-deps-no-version', 'example.com' );
		wp_enqueue_script('empty-deps-version', 'example.com', array(), 1.2);
		wp_enqueue_script('empty-deps-null-version', 'example.com', array(), null);
		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='http://example.com?ver=$ver'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com?ver=$ver'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com?ver=1.2'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";

		$this->assertEquals($expected, get_echo('wp_print_scripts'));

		// No scripts left to print
		$this->assertEquals("", get_echo('wp_print_scripts'));
	}

	/**
	 * Test the different protocol references in wp_enqueue_script
	 * @global WP_Scripts $wp_scripts
	 * @ticket 16560
	 */
	public function test_protocols() {
		// Init
		global $wp_scripts;
		$base_url_backup = $wp_scripts->base_url;
		$wp_scripts->base_url = 'http://example.com/wordpress';
		$expected = '';
		$ver = get_bloginfo( 'version' );

		// Try with an HTTP reference
		wp_enqueue_script( 'jquery-http', 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js' );
		$expected  .= "<script type='text/javascript' src='http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js?ver=$ver'></script>\n";

		// Try with an HTTPS reference
		wp_enqueue_script( 'jquery-https', 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js' );
		$expected  .= "<script type='text/javascript' src='https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js?ver=$ver'></script>\n";

		// Try with an automatic protocol reference (//)
		wp_enqueue_script( 'jquery-doubleslash', '//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js' );
		$expected  .= "<script type='text/javascript' src='//ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js?ver=$ver'></script>\n";

		// Try with a local resource and an automatic protocol reference (//)
		$url = '//my_plugin/script.js';
		wp_enqueue_script( 'plugin-script', $url );
		$expected  .= "<script type='text/javascript' src='$url?ver=$ver'></script>\n";

		// Try with a bad protocol
		wp_enqueue_script( 'jquery-ftp', 'ftp://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js' );
		$expected  .= "<script type='text/javascript' src='{$wp_scripts->base_url}ftp://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js?ver=$ver'></script>\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );

		// No scripts left to print
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );

		// Cleanup
		$wp_scripts->base_url = $base_url_backup;
	}

	/**
	 * Testing `wp_script_add_data` with the data key.
	 * @ticket 16024
	 */
	function test_wp_script_add_data_with_data_key() {
		// Enqueue & add data
		wp_enqueue_script( 'test-only-data', 'example.com', array(), null );
		wp_script_add_data( 'test-only-data', 'data', 'testing' );
		$expected = "<script type='text/javascript'>\n/* <![CDATA[ */\ntesting\n/* ]]> */\n</script>\n";
		$expected.= "<script type='text/javascript' src='http://example.com'></script>\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );

		// No scripts left to print
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * Testing `wp_script_add_data` with the conditional key.
	 * @ticket 16024
	 */
	function test_wp_script_add_data_with_conditional_key() {
		// Enqueue & add conditional comments
		wp_enqueue_script( 'test-only-conditional', 'example.com', array(), null );
		wp_script_add_data( 'test-only-conditional', 'conditional', 'gt IE 7' );
		$expected = "<!--[if gt IE 7]>\n<script type='text/javascript' src='http://example.com'></script>\n<![endif]-->\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );

		// No scripts left to print
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * Testing `wp_script_add_data` with both the data & conditional keys.
	 * @ticket 16024
	 */
	function test_wp_script_add_data_with_data_and_conditional_keys() {
		// Enqueue & add data plus conditional comments for both
		wp_enqueue_script( 'test-conditional-with-data', 'example.com', array(), null );
		wp_script_add_data( 'test-conditional-with-data', 'data', 'testing' );
		wp_script_add_data( 'test-conditional-with-data', 'conditional', 'lt IE 9' );
		$expected = "<!--[if lt IE 9]>\n<script type='text/javascript'>\n/* <![CDATA[ */\ntesting\n/* ]]> */\n</script>\n<![endif]-->\n";
		$expected.= "<!--[if lt IE 9]>\n<script type='text/javascript' src='http://example.com'></script>\n<![endif]-->\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );

		// No scripts left to print
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * Testing `wp_script_add_data` with an anvalid key.
	 * @ticket 16024
	 */
	function test_wp_script_add_data_with_invalid_key() {
		// Enqueue & add an invalid key
		wp_enqueue_script( 'test-invalid', 'example.com', array(), null );
		wp_script_add_data( 'test-invalid', 'invalid', 'testing' );
		$expected = "<script type='text/javascript' src='http://example.com'></script>\n";

		// Go!
		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );

		// No scripts left to print
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );
	}

    /**
     * Testing 'wp_register_script' return boolean success/failure value.
     *
     * @ticket 31126
     */
    function test_wp_register_script() {
        $this->assertTrue( wp_register_script( 'duplicate-handler', 'http://example.com' ) );
        $this->assertFalse( wp_register_script( 'duplicate-handler', 'http://example.com' ) );
    }

}
