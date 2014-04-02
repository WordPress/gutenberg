<?php
/**
 * @group themes
 */
class Tests_Theme_WPTheme extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->theme_root = realpath( DIR_TESTDATA . '/themedir1' );

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories'] = array( $this->theme_root );

		add_filter('theme_root', array($this, '_theme_root'));
		add_filter( 'stylesheet_root', array($this, '_theme_root') );
		add_filter( 'template_root', array($this, '_theme_root') );
		// clear caches
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	function tearDown() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		remove_filter('theme_root', array($this, '_theme_root'));
		remove_filter( 'stylesheet_root', array($this, '_theme_root') );
		remove_filter( 'template_root', array($this, '_theme_root') );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tearDown();
	}

	// replace the normal theme root dir with our premade test dir
	function _theme_root($dir) {
		return $this->theme_root;
	}
	function test_new_WP_Theme_top_level() {
		$theme = new WP_Theme( 'theme1', $this->theme_root );

		//Meta
		$this->assertEquals( 'My Theme', $theme->get('Name') );
		$this->assertEquals( 'http://example.org/',$theme->get('ThemeURI') );
		$this->assertEquals( 'An example theme', $theme->get('Description') );
		$this->assertEquals( 'Minnie Bannister', $theme->get('Author') );
		$this->assertEquals( 'http://example.com/', $theme->get('AuthorURI') );
		$this->assertEquals( '1.3', $theme->get('Version') );
		$this->assertEquals( '', $theme->get('Template') );
		$this->assertEquals( 'publish', $theme->get('Status') );
		$this->assertEquals( array(), $theme->get('Tags') );

		//Important
		$this->assertEquals( 'theme1', $theme->get_stylesheet() );
		$this->assertEquals( 'theme1', $theme->get_template() );
	}

	function test_new_WP_Theme_subdir() {
		$theme = new WP_Theme( 'subdir/theme2', $this->theme_root );

		//Meta
		$this->assertEquals( 'My Subdir Theme', $theme->get('Name') );
		$this->assertEquals( 'http://example.org/',$theme->get('ThemeURI') );
		$this->assertEquals( 'An example theme in a sub directory', $theme->get('Description') );
		$this->assertEquals( 'Mr. WordPress', $theme->get('Author') );
		$this->assertEquals( 'http://wordpress.org/', $theme->get('AuthorURI') );
		$this->assertEquals( '0.1', $theme->get('Version') );
		$this->assertEquals( '', $theme->get('Template') );
		$this->assertEquals( 'publish', $theme->get('Status') );
		$this->assertEquals( array(), $theme->get('Tags') );

		//Important
		$this->assertEquals( 'subdir/theme2', $theme->get_stylesheet() );
		$this->assertEquals( 'subdir/theme2', $theme->get_template() );
	}

	/**
	 * @ticket 20313
	 */
	function test_new_WP_Theme_subdir_bad_root() {
		// This is what get_theme_data() does when you pass it a style.css file for a theme in a subdir.
		$theme = new WP_Theme( 'theme2', $this->theme_root . '/subdir' );

		//Meta
		$this->assertEquals( 'My Subdir Theme', $theme->get('Name') );
		$this->assertEquals( 'http://example.org/',$theme->get('ThemeURI') );
		$this->assertEquals( 'An example theme in a sub directory', $theme->get('Description') );
		$this->assertEquals( 'Mr. WordPress', $theme->get('Author') );
		$this->assertEquals( 'http://wordpress.org/', $theme->get('AuthorURI') );
		$this->assertEquals( '0.1', $theme->get('Version') );
		$this->assertEquals( '', $theme->get('Template') );
		$this->assertEquals( 'publish', $theme->get('Status') );
		$this->assertEquals( array(), $theme->get('Tags') );

		//Important
		$this->assertEquals( 'subdir/theme2', $theme->get_stylesheet() );
		$this->assertEquals( 'subdir/theme2', $theme->get_template() );
	}

	/**
	 * @ticket 21749
	 */
	function test_wp_theme_uris_with_spaces() {
		$theme = new WP_Theme( 'theme with spaces', $this->theme_root . '/subdir' );
		// Make sure subdir/ is considered part of the stylesheet, as we must avoid encoding /'s.
		$this->assertEquals( 'subdir/theme with spaces', $theme->get_stylesheet() );

		// Check that in a URI path, we have raw url encoding (spaces become %20)
		// Don't try to verify the complete URI path. get_theme_root_uri() breaks down quickly.
		$this->assertEquals( 'theme%20with%20spaces', basename( $theme->get_stylesheet_directory_uri() ) );
		$this->assertEquals( 'theme%20with%20spaces', basename( $theme->get_template_directory_uri()   ) );

		// Check that wp_customize_url() uses url encoding, as it is a query arg (spaces become +)
		$this->assertEquals( admin_url( 'customize.php?theme=theme+with+spaces' ), wp_customize_url( 'theme with spaces' ) );
	}

	/**
	 * @ticket 21969
	 */
	function test_theme_uris_with_spaces() {
		$callback = array( $this, 'filter_theme_with_spaces' );
		add_filter( 'stylesheet', $callback );
		add_filter( 'template', $callback );

		$this->assertEquals( get_theme_root_uri() . '/subdir/theme%20with%20spaces', get_stylesheet_directory_uri() );
		$this->assertEquals( get_theme_root_uri() . '/subdir/theme%20with%20spaces', get_template_directory_uri() );

		remove_filter( 'stylesheet', $callback );
		remove_filter( 'template', $callback );
	}

	function filter_theme_with_spaces() {
		return 'subdir/theme with spaces';
	}

	/**
	 * @ticket 26873
	 */
	function test_display_method_on_get_method_failure() {
		$theme = new WP_Theme( 'nonexistent', $this->theme_root );
		$this->assertEquals( 'nonexistent', $theme->get( 'Name' ) );
		$this->assertFalse( $theme->get( 'AuthorURI' ) );
		$this->assertFalse( $theme->get( 'Tags' ) );
		$this->assertFalse( $theme->display( 'Tags' ) );
	}
}
