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
	 * Test script concatenation.
	 */
	public function test_script_concatenation() {
		global $wp_scripts;

		$wp_scripts->do_concat = true;
		$wp_scripts->default_dirs = array( '/directory/' );

		wp_enqueue_script( 'one', '/directory/script.js' );
		wp_enqueue_script( 'two', '/directory/script.js' );
		wp_enqueue_script( 'three', '/directory/script.js' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$ver = get_bloginfo( 'version' );
		$expected = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=one,two,three&amp;ver={$ver}'></script>\n";

		$this->assertEquals( $expected, $print_scripts );
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

	/**
	 * @ticket 35229
	 */
	function test_wp_register_script_with_handle_without_source() {
		$expected  = "<script type='text/javascript' src='http://example.com?ver=1'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com?ver=2'></script>\n";

		wp_register_script( 'handle-one', 'http://example.com', array(), 1 );
		wp_register_script( 'handle-two', 'http://example.com', array(), 2 );
		wp_register_script( 'handle-three', false, array( 'handle-one', 'handle-two' ) );

		wp_enqueue_script( 'handle-three' );

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 35643
	 */
	function test_wp_enqueue_script_footer_alias() {
		wp_register_script( 'foo', false, array( 'bar', 'baz' ), '1.0', true );
		wp_register_script( 'bar', home_url( 'bar.js' ), array(), '1.0', true );
		wp_register_script( 'baz', home_url( 'baz.js' ), array(), '1.0', true );

		wp_enqueue_script( 'foo' );

		$header = get_echo( 'wp_print_head_scripts' );
		$footer = get_echo( 'wp_print_footer_scripts' );

		$this->assertEmpty( $header );
		$this->assertContains( home_url( 'bar.js' ), $footer );
		$this->assertContains( home_url( 'baz.js' ), $footer );
	}

	/**
	 * Test mismatch of groups in dependencies outputs all scripts in right order.
	 *
	 * @ticket 35873
	 */
	public function test_group_mismatch_in_deps() {
		$scripts = new WP_Scripts;
		$scripts->add( 'one', 'one', array(), 'v1', 1 );
		$scripts->add( 'two', 'two', array( 'one' ) );
		$scripts->add( 'three', 'three', array( 'two' ), 'v1', 1 );

		$scripts->enqueue( array( 'three' ) );

		$this->expectOutputRegex( '/^(?:<script[^>]+><\/script>\\n){7}$/' );

		$scripts->do_items( false, 0 );
		$this->assertContains( 'one', $scripts->done );
		$this->assertContains( 'two', $scripts->done );
		$this->assertNotContains( 'three', $scripts->done );

		$scripts->do_items( false, 1 );
		$this->assertContains( 'one', $scripts->done );
		$this->assertContains( 'two', $scripts->done );
		$this->assertContains( 'three', $scripts->done );

		$scripts = new WP_Scripts;
		$scripts->add( 'one', 'one', array(), 'v1', 1 );
		$scripts->add( 'two', 'two', array( 'one' ), 'v1', 1 );
		$scripts->add( 'three', 'three', array( 'one' ) );
		$scripts->add( 'four', 'four', array( 'two', 'three' ), 'v1', 1 );

		$scripts->enqueue( array( 'four' ) );

		$scripts->do_items( false, 0 );
		$this->assertContains( 'one', $scripts->done );
		$this->assertNotContains( 'two', $scripts->done );
		$this->assertContains( 'three', $scripts->done );
		$this->assertNotContains( 'four', $scripts->done );

		$scripts->do_items( false, 1 );
		$this->assertContains( 'one', $scripts->done );
		$this->assertContains( 'two', $scripts->done );
		$this->assertContains( 'three', $scripts->done );
		$this->assertContains( 'four', $scripts->done );
	}

	/**
	 * @ticket 35873
	 */
	function test_wp_register_script_with_dependencies_in_head_and_footer() {
		wp_register_script( 'parent', '/parent.js', array( 'child-head' ), null, true ); // in footer
		wp_register_script( 'child-head', '/child-head.js', array( 'child-footer' ), null, false ); // in head
		wp_register_script( 'child-footer', '/child-footer.js', array(), null, true ); // in footer

		wp_enqueue_script( 'parent' );

		$header = get_echo( 'wp_print_head_scripts' );
		$footer = get_echo( 'wp_print_footer_scripts' );

		$expected_header  = "<script type='text/javascript' src='/child-footer.js'></script>\n";
		$expected_header .= "<script type='text/javascript' src='/child-head.js'></script>\n";
		$expected_footer  = "<script type='text/javascript' src='/parent.js'></script>\n";

		$this->assertEquals( $expected_header, $header );
		$this->assertEquals( $expected_footer, $footer );
	}

	/**
	 * @ticket 35956
	 */
	function test_wp_register_script_with_dependencies_in_head_and_footer_in_reversed_order() {
		wp_register_script( 'child-head', '/child-head.js', array(), null, false ); // in head
		wp_register_script( 'child-footer', '/child-footer.js', array(), null, true ); // in footer
		wp_register_script( 'parent', '/parent.js', array( 'child-head', 'child-footer' ), null, true ); // in footer

		wp_enqueue_script( 'parent' );

		$header = get_echo( 'wp_print_head_scripts' );
		$footer = get_echo( 'wp_print_footer_scripts' );

		$expected_header  = "<script type='text/javascript' src='/child-head.js'></script>\n";
		$expected_footer  = "<script type='text/javascript' src='/child-footer.js'></script>\n";
		$expected_footer .= "<script type='text/javascript' src='/parent.js'></script>\n";

		$this->assertEquals( $expected_header, $header );
		$this->assertEquals( $expected_footer, $footer );
	}

	/**
	 * @ticket 35956
	 */
	function test_wp_register_script_with_dependencies_in_head_and_footer_in_reversed_order_and_two_parent_scripts() {
		wp_register_script( 'grandchild-head', '/grandchild-head.js', array(), null, false ); // in head
		wp_register_script( 'child-head', '/child-head.js', array(), null, false ); // in head
		wp_register_script( 'child-footer', '/child-footer.js', array( 'grandchild-head' ), null, true ); // in footer
		wp_register_script( 'child2-head', '/child2-head.js', array(), null, false ); // in head
		wp_register_script( 'child2-footer', '/child2-footer.js', array(), null, true ); // in footer
		wp_register_script( 'parent-footer', '/parent-footer.js', array( 'child-head', 'child-footer', 'child2-head', 'child2-footer' ), null, true ); // in footer
		wp_register_script( 'parent-header', '/parent-header.js', array( 'child-head' ), null, false ); // in head

		wp_enqueue_script( 'parent-footer' );
		wp_enqueue_script( 'parent-header' );

		$header = get_echo( 'wp_print_head_scripts' );
		$footer = get_echo( 'wp_print_footer_scripts' );

		$expected_header  = "<script type='text/javascript' src='/child-head.js'></script>\n";
		$expected_header .= "<script type='text/javascript' src='/grandchild-head.js'></script>\n";
		$expected_header .= "<script type='text/javascript' src='/child2-head.js'></script>\n";
		$expected_header .= "<script type='text/javascript' src='/parent-header.js'></script>\n";

		$expected_footer  = "<script type='text/javascript' src='/child-footer.js'></script>\n";
		$expected_footer .= "<script type='text/javascript' src='/child2-footer.js'></script>\n";
		$expected_footer .= "<script type='text/javascript' src='/parent-footer.js'></script>\n";

		$this->assertEquals( $expected_header, $header );
		$this->assertEquals( $expected_footer, $footer );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_returns_bool() {
		$this->assertFalse( wp_add_inline_script( 'test-example', 'console.log("before");', 'before' ) );
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		$this->assertTrue( wp_add_inline_script( 'test-example', 'console.log("before");', 'before' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_unknown_handle() {
		$this->assertFalse( wp_add_inline_script( 'test-invalid', 'console.log("before");', 'before' ) );
		$this->assertEquals( '', get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_before() {
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );

		$expected  = "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_after() {
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_add_inline_script( 'test-example', 'console.log("after");' );

		$expected  = "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_before_and_after() {
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_add_inline_script( 'test-example', 'console.log("after");' );

		$expected  = "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_multiple() {
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_add_inline_script( 'test-example', 'console.log("after");' );
		wp_add_inline_script( 'test-example', 'console.log("after");' );

		$expected  = "<script type='text/javascript'>\nconsole.log(\"before\");\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\nconsole.log(\"after\");\n</script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	function test_wp_add_inline_script_localized_data_is_added_first() {
		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_localize_script( 'test-example', 'testExample', array( 'foo' => 'bar' ) );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_add_inline_script( 'test-example', 'console.log("after");' );

		$expected  = "<script type='text/javascript'>\n/* <![CDATA[ */\nvar testExample = {\"foo\":\"bar\"};\n/* ]]> */\n</script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	public function test_wp_add_inline_script_before_with_concat() {
		global $wp_scripts;

		$wp_scripts->do_concat = true;
		$wp_scripts->default_dirs = array( '/directory/' );

		wp_enqueue_script( 'one', '/directory/one.js' );
		wp_enqueue_script( 'two', '/directory/two.js' );
		wp_enqueue_script( 'three', '/directory/three.js' );

		wp_add_inline_script( 'one', 'console.log("before one");', 'before' );
		wp_add_inline_script( 'two', 'console.log("before two");', 'before' );

		$ver = get_bloginfo( 'version' );
		$expected = "<script type='text/javascript'>\nconsole.log(\"before one\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/directory/one.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before two\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/directory/two.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/directory/three.js?ver={$ver}'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	public function test_wp_add_inline_script_before_with_concat2() {
		global $wp_scripts;

		$wp_scripts->do_concat = true;
		$wp_scripts->default_dirs = array( '/directory/' );

		wp_enqueue_script( 'one', '/directory/one.js' );
		wp_enqueue_script( 'two', '/directory/two.js' );
		wp_enqueue_script( 'three', '/directory/three.js' );

		wp_add_inline_script( 'one', 'console.log("before one");', 'before' );

		$ver = get_bloginfo( 'version' );
		$expected = "<script type='text/javascript'>\nconsole.log(\"before one\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/directory/one.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/directory/two.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/directory/three.js?ver={$ver}'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	public function test_wp_add_inline_script_after_with_concat() {
		global $wp_scripts;

		$wp_scripts->do_concat = true;
		$wp_scripts->default_dirs = array( '/directory/' );

		wp_enqueue_script( 'one', '/directory/one.js' );
		wp_enqueue_script( 'two', '/directory/two.js' );
		wp_enqueue_script( 'three', '/directory/three.js' );
		wp_enqueue_script( 'four', '/directory/four.js' );

		wp_add_inline_script( 'two', 'console.log("after two");' );
		wp_add_inline_script( 'three', 'console.log("after three");' );

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=one&amp;ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/directory/two.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after two\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/directory/three.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after three\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/directory/four.js?ver={$ver}'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 14853
	 */
	public function test_wp_add_inline_script_after_and_before_with_concat_and_conditional() {
		global $wp_scripts;

		$wp_scripts->do_concat = true;
		$wp_scripts->default_dirs = array('/wp-admin/js/', '/wp-includes/js/'); // Default dirs as in wp-includes/script-loader.php

		$expected_localized = "<!--[if gte IE 9]>\n";
		$expected_localized .= "<script type='text/javascript'>\n/* <![CDATA[ */\nvar testExample = {\"foo\":\"bar\"};\n/* ]]> */\n</script>\n";
		$expected_localized .= "<![endif]-->\n";

		$expected  = "<!--[if gte IE 9]>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";
		$expected .= "<![endif]-->\n";

		wp_enqueue_script( 'test-example', 'example.com', array(), null );
		wp_localize_script( 'test-example', 'testExample', array( 'foo' => 'bar' ) );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_add_inline_script( 'test-example', 'console.log("after");' );
		wp_script_add_data( 'test-example', 'conditional', 'gte IE 9' );

		$this->assertEquals( $expected_localized, get_echo( 'wp_print_scripts' ) );
		$this->assertEquals( $expected, $wp_scripts->print_html );
		$this->assertTrue( $wp_scripts->do_concat );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_after_with_concat_and_core_dependency() {
		global $wp_scripts;

		wp_default_scripts( $wp_scripts );

		$wp_scripts->base_url  = '';
		$wp_scripts->do_concat = true;

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=jquery-core,jquery-migrate&amp;ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";

		wp_enqueue_script( 'test-example', 'http://example.com', array( 'jquery' ), null );
		wp_add_inline_script( 'test-example', 'console.log("after");' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$this->assertEquals( $expected, $print_scripts );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_after_with_concat_and_conditional_and_core_dependency() {
		global $wp_scripts;

		wp_default_scripts( $wp_scripts );

		$wp_scripts->base_url  = '';
		$wp_scripts->do_concat = true;

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=jquery-core,jquery-migrate&amp;ver={$ver}'></script>\n";
		$expected .= "<!--[if gte IE 9]>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";
		$expected .= "<![endif]-->\n";

		wp_enqueue_script( 'test-example', 'http://example.com', array( 'jquery' ), null );
		wp_add_inline_script( 'test-example', 'console.log("after");' );
		wp_script_add_data( 'test-example', 'conditional', 'gte IE 9' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$this->assertEquals( $expected, $print_scripts );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_before_with_concat_and_core_dependency() {
		global $wp_scripts;

		wp_default_scripts( $wp_scripts );

		$wp_scripts->base_url  = '';
		$wp_scripts->do_concat = true;

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=jquery-core,jquery-migrate&amp;ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";

		wp_enqueue_script( 'test-example', 'http://example.com', array( 'jquery' ), null );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$this->assertEquals( $expected, $print_scripts );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_before_after_concat_with_core_dependency() {
		global $wp_scripts;

		wp_default_scripts( $wp_scripts );

		$wp_scripts->base_url  = '';
		$wp_scripts->do_concat = true;

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=jquery-core,jquery-migrate,wp-a11y&amp;ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='http://example.com'></script>\n";
		$expected .= "<script type='text/javascript' src='http://example2.com'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after\");\n</script>\n";

		wp_enqueue_script( 'test-example', 'http://example.com', array( 'jquery' ), null );
		wp_add_inline_script( 'test-example', 'console.log("before");', 'before' );
		wp_enqueue_script( 'test-example2', 'http://example2.com', array( 'wp-a11y' ), null );
		wp_add_inline_script( 'test-example2', 'console.log("after");', 'after' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$this->assertEquals( $expected, $print_scripts );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_customize_dependency() {
		global $wp_scripts;

		wp_default_scripts( $wp_scripts );

		$wp_scripts->base_url  = '';
		$wp_scripts->do_concat = true;

		$expected_tail = "<![endif]-->\n";
		$expected_tail .= "<script type='text/javascript' src='/customize-dependency.js'></script>\n";
		$expected_tail .= "<script type='text/javascript'>\n";
		$expected_tail .= "tryCustomizeDependency()\n";
		$expected_tail .= "</script>\n";

		$handle = 'customize-dependency';
		wp_enqueue_script( $handle, '/customize-dependency.js', array( 'customize-controls' ), null );
		wp_add_inline_script( $handle, 'tryCustomizeDependency()' );

		wp_print_scripts();
		$print_scripts = get_echo( '_print_scripts' );

		$tail = substr( $print_scripts, strrpos( $print_scripts, "<![endif]-->" ) );
		$this->assertEquals( $expected_tail, $tail );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_after_for_core_scripts_with_concat_is_limited_and_falls_back_to_no_concat() {
		global $wp_scripts;

		$wp_scripts->do_concat    = true;
		$wp_scripts->default_dirs = array( '/wp-admin/js/', '/wp-includes/js/' ); // Default dirs as in wp-includes/script-loader.php

		wp_enqueue_script( 'one', '/wp-includes/js/script.js' );
		wp_enqueue_script( 'two', '/wp-includes/js/script2.js', array( 'one' ) );
		wp_add_inline_script( 'one', 'console.log("after one");', 'after' );
		wp_enqueue_script( 'three', '/wp-includes/js/script3.js' );
		wp_enqueue_script( 'four', '/wp-includes/js/script4.js' );

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-includes/js/script.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"after one\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/wp-includes/js/script2.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/wp-includes/js/script3.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/wp-includes/js/script4.js?ver={$ver}'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}

	/**
	 * @ticket 36392
	 */
	public function test_wp_add_inline_script_before_third_core_script_prints_two_concat_scripts() {
		global $wp_scripts;

		$wp_scripts->do_concat    = true;
		$wp_scripts->default_dirs = array( '/wp-admin/js/', '/wp-includes/js/' ); // Default dirs as in wp-includes/script-loader.php

		wp_enqueue_script( 'one', '/wp-includes/js/script.js' );
		wp_enqueue_script( 'two', '/wp-includes/js/script2.js', array( 'one' ) );
		wp_enqueue_script( 'three', '/wp-includes/js/script3.js' );
		wp_add_inline_script( 'three', 'console.log("before three");', 'before' );
		wp_enqueue_script( 'four', '/wp-includes/js/script4.js' );

		$ver = get_bloginfo( 'version' );
		$expected  = "<script type='text/javascript' src='/wp-admin/load-scripts.php?c=0&amp;load%5B%5D=one,two&amp;ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript'>\nconsole.log(\"before three\");\n</script>\n";
		$expected .= "<script type='text/javascript' src='/wp-includes/js/script3.js?ver={$ver}'></script>\n";
		$expected .= "<script type='text/javascript' src='/wp-includes/js/script4.js?ver={$ver}'></script>\n";

		$this->assertEquals( $expected, get_echo( 'wp_print_scripts' ) );
	}
}
