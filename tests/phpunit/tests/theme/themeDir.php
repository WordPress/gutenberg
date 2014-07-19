<?php

/**
 * Test functions that fetch stuff from the theme directory
 *
 * @group themes
 */
class Tests_Theme_ThemeDir extends WP_UnitTestCase {

	function setUp() {
		parent::setUp();
		$this->theme_root = DIR_TESTDATA . '/themedir1';

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

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

	/**
	 * @expectedDeprecated get_theme
	 * @expectedDeprecated get_themes
	 */
	function test_theme_default() {
		$themes = get_themes();
		$theme = get_theme('WordPress Default');
		$this->assertEquals( $themes['WordPress Default'], $theme );

		$this->assertFalse( empty($theme) );

		#echo gen_tests_array('theme', $theme);

		$this->assertEquals( 'WordPress Default', $theme['Name'] );
		$this->assertEquals( 'WordPress Default', $theme['Title'] );
		$this->assertEquals( 'The default WordPress theme based on the famous <a href="http://binarybonsai.com/kubrick/">Kubrick</a>.', $theme['Description'] );
		$this->assertEquals( '<a href="http://binarybonsai.com/">Michael Heilemann</a>', $theme['Author'] );
		$this->assertEquals( '1.6', $theme['Version'] );
		$this->assertEquals( 'default', $theme['Template'] );
		$this->assertEquals( 'default', $theme['Stylesheet'] );

		$this->assertContains( $this->theme_root . '/default/functions.php', $theme['Template Files'] );
		$this->assertContains( $this->theme_root . '/default/index.php', $theme['Template Files'] );
		$this->assertContains( $this->theme_root . '/default/style.css', $theme['Stylesheet Files'] );

		$this->assertEquals( $this->theme_root.'/default', $theme['Template Dir'] );
		$this->assertEquals( $this->theme_root.'/default', $theme['Stylesheet Dir'] );
		$this->assertEquals( 'publish', $theme['Status'] );
		$this->assertEquals( '', $theme['Parent Theme'] );
	}

	/**
	 * @expectedDeprecated get_theme
	 * @expectedDeprecated get_themes
	 */
	function test_theme_sandbox() {
		$theme = get_theme('Sandbox');

		$this->assertFalse( empty($theme) );

		#echo gen_tests_array('theme', $theme);

		$this->assertEquals( 'Sandbox', $theme['Name'] );
		$this->assertEquals( 'Sandbox', $theme['Title'] );
		$this->assertEquals( 'A theme with powerful, semantic CSS selectors and the ability to add new skins.', $theme['Description'] );
		$this->assertEquals( '<a href="http://andy.wordpress.com/">Andy Skelton</a> &amp; <a href="http://www.plaintxt.org/">Scott Allan Wallick</a>', $theme['Author'] );
		$this->assertEquals( '0.6.1-wpcom', $theme['Version'] );
		$this->assertEquals( 'sandbox', $theme['Template'] );
		$this->assertEquals( 'sandbox', $theme['Stylesheet'] );

		$template_files = $theme['Template Files'];

		$this->assertEquals( $this->theme_root.'/sandbox/functions.php', reset( $template_files ) );
		$this->assertEquals( $this->theme_root.'/sandbox/index.php', next( $template_files ) );

		$stylesheet_files = $theme['Stylesheet Files'];

		$this->assertEquals( $this->theme_root.'/sandbox/style.css', reset( $stylesheet_files ) );

		$this->assertEquals( $this->theme_root.'/sandbox', $theme['Template Dir'] );
		$this->assertEquals( $this->theme_root.'/sandbox', $theme['Stylesheet Dir'] );
		$this->assertEquals( 'publish', $theme['Status'] );
		$this->assertEquals( '', $theme['Parent Theme'] );

	}

	/**
	 * A CSS-only theme
	 *
	 * @expectedDeprecated get_themes
	 */
	function test_theme_stylesheet_only() {
		$themes = get_themes();

		$theme = $themes['Stylesheet Only'];
		$this->assertFalse( empty($theme) );

		#echo gen_tests_array('theme', $theme);

		$this->assertEquals( 'Stylesheet Only', $theme['Name'] );
		$this->assertEquals( 'Stylesheet Only', $theme['Title'] );
		$this->assertEquals( 'A three-column widget-ready theme in dark blue.', $theme['Description'] );
		$this->assertEquals( '<a href="http://www.example.com/">Henry Crun</a>', $theme['Author'] );
		$this->assertEquals( '1.0', $theme['Version'] );
		$this->assertEquals( 'sandbox', $theme['Template'] );
		$this->assertEquals( 'stylesheetonly', $theme['Stylesheet'] );
		$this->assertContains( $this->theme_root.'/sandbox/functions.php', $theme['Template Files'] );
		$this->assertContains( $this->theme_root.'/sandbox/index.php', $theme['Template Files'] );

		$this->assertContains( $this->theme_root.'/stylesheetonly/style.css', $theme['Stylesheet Files']);

		$this->assertEquals( $this->theme_root.'/sandbox', $theme['Template Dir'] );
		$this->assertEquals( $this->theme_root.'/stylesheetonly', $theme['Stylesheet Dir'] );
		$this->assertEquals( 'publish', $theme['Status'] );
		$this->assertEquals( 'Sandbox', $theme['Parent Theme'] );

	}

	/**
	 * @expectedDeprecated get_themes
	 */
	function test_theme_list() {
		$themes = get_themes();

		// Ignore themes in the default /themes directory.
		foreach ( $themes as $theme_name => $theme ) {
			if ( $theme->get_theme_root() != $this->theme_root )
				unset( $themes[ $theme_name ] );
		}

		$theme_names = array_keys($themes);
		$expected = array(
			'WordPress Default',
			'Sandbox',
			'Stylesheet Only',
			'My Theme',
			'My Theme/theme1', // duplicate theme should be given a unique name
			'My Subdir Theme',// theme in a subdirectory should work
			'Page Template Theme', // theme with page templates for other test code
			'Theme with Spaces in the Directory',
		);

		sort($theme_names);
		sort($expected);

		$this->assertEquals($expected, $theme_names);
	}

	/**
	 * @expectedDeprecated get_themes
	 * @expectedDeprecated get_broken_themes
	 */
	function test_broken_themes() {
		$themes = get_themes();
		$expected = array('broken-theme' => array('Name' => 'broken-theme', 'Title' => 'broken-theme', 'Description' => __('Stylesheet is missing.')));

		$this->assertEquals($expected, get_broken_themes() );
	}

	function test_wp_get_theme_with_non_default_theme_root() {
		$this->assertFalse( wp_get_theme( 'sandbox', $this->theme_root )->errors() );
		$this->assertFalse( wp_get_theme( 'sandbox' )->errors() );
	}

	/**
	 * @expectedDeprecated get_themes
	 */
	function test_page_templates() {
		$themes = get_themes();

		$theme = $themes['Page Template Theme'];
		$this->assertFalse( empty($theme) );

		$templates = $theme['Template Files'];
		$this->assertTrue( in_array( $this->theme_root . '/page-templates/template-top-level.php', $templates));
	}

	/**
	 * @expectedDeprecated get_theme_data
	 */
	function test_get_theme_data_top_level() {
		$theme_data = get_theme_data( DIR_TESTDATA . '/themedir1/theme1/style.css' );

		$this->assertEquals( 'My Theme', $theme_data['Name'] );
		$this->assertEquals( 'http://example.org/', $theme_data['URI'] );
		$this->assertEquals( 'An example theme', $theme_data['Description'] );
		$this->assertEquals( '<a href="http://example.com/">Minnie Bannister</a>', $theme_data['Author'] );
		$this->assertEquals( 'http://example.com/', $theme_data['AuthorURI'] );
		$this->assertEquals( '1.3', $theme_data['Version'] );
		$this->assertEquals( '', $theme_data['Template'] );
		$this->assertEquals( 'publish', $theme_data['Status'] );
		$this->assertEquals( array(), $theme_data['Tags'] );
		$this->assertEquals( 'My Theme', $theme_data['Title'] );
		$this->assertEquals( 'Minnie Bannister', $theme_data['AuthorName'] );
	}

	/**
	 * @expectedDeprecated get_theme_data
	 */
	function test_get_theme_data_subdir() {
		$theme_data = get_theme_data( $this->theme_root . '/subdir/theme2/style.css' );

		$this->assertEquals( 'My Subdir Theme', $theme_data['Name'] );
		$this->assertEquals( 'http://example.org/', $theme_data['URI'] );
		$this->assertEquals( 'An example theme in a sub directory', $theme_data['Description'] );
		$this->assertEquals( '<a href="http://wordpress.org/">Mr. WordPress</a>', $theme_data['Author'] );
		$this->assertEquals( 'http://wordpress.org/', $theme_data['AuthorURI'] );
		$this->assertEquals( '0.1', $theme_data['Version'] );
		$this->assertEquals( '', $theme_data['Template'] );
		$this->assertEquals( 'publish', $theme_data['Status'] );
		$this->assertEquals( array(), $theme_data['Tags'] );
		$this->assertEquals( 'My Subdir Theme', $theme_data['Title'] );
		$this->assertEquals( 'Mr. WordPress', $theme_data['AuthorName'] );
	}

	/**
	 * @ticket 28662
	 */
	function test_theme_dir_slashes() {
		$size = count( $GLOBALS['wp_theme_directories'] );

		@mkdir( WP_CONTENT_DIR . '/themes/foo' );
		@mkdir( WP_CONTENT_DIR . '/themes/foo-themes' );

		$this->assertTrue( file_exists( WP_CONTENT_DIR . '/themes/foo' ) );
		$this->assertTrue( file_exists( WP_CONTENT_DIR . '/themes/foo-themes') );

		register_theme_directory( '/' );

		$this->assertCount( $size, $GLOBALS['wp_theme_directories'] );

		register_theme_directory( 'themes/' );

		$this->assertCount( $size, $GLOBALS['wp_theme_directories'] );

		register_theme_directory( '/foo/' );

		$this->assertCount( $size, $GLOBALS['wp_theme_directories'] );

		register_theme_directory( 'foo/' );

		$this->assertCount( $size, $GLOBALS['wp_theme_directories'] );

		register_theme_directory( 'themes/foo/' );

		$this->assertCount( $size + 1, $GLOBALS['wp_theme_directories'] );

		register_theme_directory( WP_CONTENT_DIR . '/foo-themes/' );

		$this->assertCount( $size + 1, $GLOBALS['wp_theme_directories'] );

		foreach ( $GLOBALS['wp_theme_directories'] as $dir ) {
			$this->assertNotEquals( '/', substr( $dir, -1 ) );
		}

		rmdir( WP_CONTENT_DIR . '/themes/foo' );
		rmdir( WP_CONTENT_DIR . '/themes/foo-themes' );
	}
}
