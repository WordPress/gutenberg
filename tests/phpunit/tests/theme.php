<?php

/**
 * test wp-includes/theme.php
 *
 * @group themes
 */
class Tests_Theme extends WP_UnitTestCase {
	protected $theme_slug = 'twentyeleven';
	protected $theme_name = 'Twenty Eleven';
	protected $default_themes = array(
		'twentyten', 'twentyeleven', 'twentytwelve', 'twentythirteen',
		'twentyfourteen', 'twentyfifteen',
	);

	function setUp() {
		parent::setUp();
		add_filter( 'extra_theme_headers', array( $this, '_theme_data_extra_headers' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	function tearDown() {
		remove_filter( 'extra_theme_headers', array( $this, '_theme_data_extra_headers' ) );
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tearDown();
	}

	function test_wp_get_themes_default() {
		$themes = wp_get_themes();
		$this->assertInstanceOf( 'WP_Theme', $themes[ $this->theme_slug ] );
		$this->assertEquals( $this->theme_name, $themes[ $this->theme_slug ]->get('Name') );

		$single_theme = wp_get_theme( $this->theme_slug );
		$this->assertEquals( $single_theme->get('Name'), $themes[ $this->theme_slug ]->get('Name') );
		$this->assertEquals( $themes[ $this->theme_slug ], $single_theme );
	}

	/**
	 * @expectedDeprecated get_theme
	 * @expectedDeprecated get_themes
	 */
	function test_get_themes_default() {
		$themes = get_themes();
		$this->assertInstanceOf( 'WP_Theme', $themes[ $this->theme_name ] );
		$this->assertEquals( $themes[ $this->theme_name ], get_theme( $this->theme_name ) );

		$this->assertEquals( $this->theme_name, $themes[ $this->theme_name ]['Name'] );
		$this->assertEquals( $this->theme_name, $themes[ $this->theme_name ]->Name );
		$this->assertEquals( $this->theme_name, $themes[ $this->theme_name ]->name );
	}

	/**
	 * @expectedDeprecated get_theme
	 * @expectedDeprecated get_themes
	 */
	function test_get_theme() {
		$themes = get_themes();
		foreach (array_keys($themes) as $name) {
			$theme = get_theme($name);
			// WP_Theme implements ArrayAccess. Even ArrayObject returns false for is_array().
			$this->assertFalse( is_array( $theme ) );
			$this->assertInstanceOf( 'WP_Theme', $theme );
			$this->assertEquals($theme, $themes[$name]);
		}
	}

	function test_wp_get_theme() {
		$themes = wp_get_themes();
		foreach ( $themes as $theme ) {
			$this->assertInstanceOf( 'WP_Theme', $theme );
			$this->assertFalse( $theme->errors() );
			$_theme = wp_get_theme( $theme->get_stylesheet() );
			// This primes internal WP_Theme caches for the next assertion (headers_sanitized, textdomain_loaded)
			$this->assertEquals( $theme->get('Name'), $_theme->get('Name') );
			$this->assertEquals( $theme, $_theme );
		}
	}

	/**
	 * @expectedDeprecated get_themes
	 */
	function test_get_themes_contents() {
		$themes = get_themes();
		// Generic tests that should hold true for any theme
		foreach ( $themes as $k => $theme ) {
			$this->assertEquals( $theme['Name'], $k );
			$this->assertNotEmpty( $theme['Title'] );

			// important attributes should all be set
			$default_headers = array(
				'Title' => 'Theme Title',
				'Version' => 'Version',
				'Parent Theme' => 'Parent Theme',
				'Template Dir' => 'Template Dir',
				'Stylesheet Dir' => 'Stylesheet Dir',
				'Template' => 'Template',
				'Stylesheet' => 'Stylesheet',
				'Screenshot' => 'Screenshot',
				'Description' => 'Description',
				'Author' => 'Author',
				'Tags' => 'Tags',
				// Introduced in WordPress 2.9
				'Theme Root' => 'Theme Root',
				'Theme Root URI' => 'Theme Root URI'
			);
			foreach ($default_headers as $name => $value) {
				$this->assertTrue(isset($theme[$name]));
			}

			// Make the tests work both for WordPress 2.8.5 and WordPress 2.9-rare
			$dir = isset($theme['Theme Root']) ? '' : WP_CONTENT_DIR;

			// important attributes should all not be empty as well
			$this->assertNotEmpty( $theme['Description'] );
			$this->assertNotEmpty( $theme['Author'] );
			$this->assertTrue(version_compare($theme['Version'], 0) > 0);
			$this->assertNotEmpty( $theme['Template'] );
			$this->assertNotEmpty( $theme['Stylesheet'] );

			// template files should all exist
			$this->assertTrue(is_array($theme['Template Files']));
			$this->assertTrue(count($theme['Template Files']) > 0);
			foreach ($theme['Template Files'] as $file) {
				$this->assertTrue(is_file($dir . $file));
				$this->assertTrue(is_readable($dir . $file));
			}

			// css files should all exist
			$this->assertTrue(is_array($theme['Stylesheet Files']));
			$this->assertTrue(count($theme['Stylesheet Files']) > 0);
			foreach ($theme['Stylesheet Files'] as $file) {
				$this->assertTrue(is_file($dir . $file));
				$this->assertTrue(is_readable($dir . $file));
			}

			$this->assertTrue(is_dir($dir . $theme['Template Dir']));
			$this->assertTrue(is_dir($dir . $theme['Stylesheet Dir']));

			$this->assertEquals('publish', $theme['Status']);

			$this->assertTrue(is_file($dir . $theme['Stylesheet Dir'] . '/' . $theme['Screenshot']));
			$this->assertTrue(is_readable($dir . $theme['Stylesheet Dir'] . '/' . $theme['Screenshot']));
		}
	}

	function test_wp_get_theme_contents() {
		$theme = wp_get_theme( $this->theme_slug );

		$this->assertEquals( $this->theme_name, $theme->get( 'Name' ) );
		$this->assertNotEmpty( $theme->get( 'Description' ) );
		$this->assertNotEmpty( $theme->get( 'Author' ) );
		$this->assertNotEmpty( $theme->get( 'Version' ) );
		$this->assertNotEmpty( $theme->get( 'AuthorURI' ) );
		$this->assertNotEmpty( $theme->get( 'ThemeURI' ) );
		$this->assertEquals( $this->theme_slug, $theme->get_stylesheet() );
		$this->assertEquals( $this->theme_slug, $theme->get_template() );

		$this->assertEquals('publish', $theme->get( 'Status' ) );

		$this->assertEquals( WP_CONTENT_DIR . '/themes/' . $this->theme_slug, $theme->get_stylesheet_directory(), 'get_stylesheet_directory' );
		$this->assertEquals( WP_CONTENT_DIR . '/themes/' . $this->theme_slug, $theme->get_template_directory(), 'get_template_directory' );
		$this->assertEquals( content_url( 'themes/' . $this->theme_slug ), $theme->get_stylesheet_directory_uri(), 'get_stylesheet_directory_uri' );
		$this->assertEquals( content_url( 'themes/' . $this->theme_slug ), $theme->get_template_directory_uri(), 'get_template_directory_uri' );
	}

	/**
	 * Make sure we update the default theme list to include the latest default theme.
	 *
	 * @ticket 29925
	 */
	function test_default_theme_in_default_theme_list() {
		if ( 'twenty' === substr( WP_DEFAULT_THEME, 0, 6 ) ) {
			$this->assertContains( WP_DEFAULT_THEME, $this->default_themes );
		}
	}

	function test_default_themes_have_textdomain() {
		foreach ( $this->default_themes as $theme ) {
			$this->assertEquals( $theme, wp_get_theme( $theme )->get( 'TextDomain' ) );
		}
	}

	/**
	 * @ticket 20897
	 * @expectedDeprecated get_theme_data
	 */
	function test_extra_theme_headers() {
		$wp_theme = wp_get_theme( $this->theme_slug );
		$this->assertNotEmpty( $wp_theme->get('License') );
		$path_to_style_css = $wp_theme->get_theme_root() . '/' . $wp_theme->get_stylesheet() . '/style.css';
		$this->assertTrue( file_exists( $path_to_style_css ) );
		$theme_data = get_theme_data( $path_to_style_css );
		$this->assertArrayHasKey( 'License', $theme_data );
		$this->assertArrayNotHasKey( 'Not a Valid Key', $theme_data );
		$this->assertNotEmpty( $theme_data['License'] );
		$this->assertSame( $theme_data['License'], $wp_theme->get('License') );
	}

	function _theme_data_extra_headers() {
		return array( 'License' );
	}

	/**
	 * @expectedDeprecated get_themes
	 * @expectedDeprecated get_current_theme
	 */
	function test_switch_theme() {
		$themes = get_themes();

		// Switch to each theme in sequence.
		// Do it twice to make sure we switch to the first theme, even if it's our starting theme.
		// Do it a third time to ensure switch_theme() works with one argument.

		for ( $i = 0; $i < 3; $i++ ) {
			foreach ( $themes as $name => $theme ) {
				// switch to this theme
				if ( $i === 2 )
					switch_theme( $theme['Template'], $theme['Stylesheet'] );
				else
					switch_theme( $theme['Stylesheet'] );

				$this->assertEquals($name, get_current_theme());

				// make sure the various get_* functions return the correct values
				$this->assertEquals($theme['Template'], get_template());
				$this->assertEquals($theme['Stylesheet'], get_stylesheet());

				$root_fs = get_theme_root();
				$this->assertTrue(is_dir($root_fs));

				$root_uri = get_theme_root_uri();
				$this->assertTrue(!empty($root_uri));

				$this->assertEquals($root_fs . '/' . get_stylesheet(), get_stylesheet_directory());
				$this->assertEquals($root_uri . '/' . get_stylesheet(), get_stylesheet_directory_uri());
				$this->assertEquals($root_uri . '/' . get_stylesheet() . '/style.css', get_stylesheet_uri());
#				$this->assertEquals($root_uri . '/' . get_stylesheet(), get_locale_stylesheet_uri());

				$this->assertEquals($root_fs . '/' . get_template(), get_template_directory());
				$this->assertEquals($root_uri . '/' . get_template(), get_template_directory_uri());

				//get_query_template

				// template file that doesn't exist
				$this->assertEquals('', get_query_template(rand_str()));

				// template files that do exist
				//foreach ($theme['Template Files'] as $path) {
				//$file = basename($path, '.php');
				// FIXME: untestable because get_query_template uses TEMPLATEPATH
				//$this->assertEquals('', get_query_template($file));
				//}

				// these are kind of tautologies but at least exercise the code
				$this->assertEquals(get_404_template(), get_query_template('404'));
				$this->assertEquals(get_archive_template(), get_query_template('archive'));
				$this->assertEquals(get_author_template(), get_query_template('author'));
				$this->assertEquals(get_category_template(), get_query_template('category'));
				$this->assertEquals(get_date_template(), get_query_template('date'));
				$this->assertEquals(get_home_template(), get_query_template('home', array('home.php','index.php')));
				$this->assertEquals(get_page_template(), get_query_template('page'));
				$this->assertEquals(get_paged_template(), get_query_template('paged'));
				$this->assertEquals(get_search_template(), get_query_template('search'));
				$this->assertEquals(get_single_template(), get_query_template('single'));
				$this->assertEquals(get_attachment_template(), get_query_template('attachment'));

				// this one doesn't behave like the others
				if (get_query_template('comments-popup'))
					$this->assertEquals(get_comments_popup_template(), get_query_template('comments-popup'));
				else
					$this->assertEquals(get_comments_popup_template(), ABSPATH.'wp-includes/theme-compat/comments-popup.php');

				$this->assertEquals(get_tag_template(), get_query_template('tag'));

				// nb: this probably doesn't run because WP_INSTALLING is defined
				$this->assertTrue(validate_current_theme());
			}
		}
	}

	function test_switch_theme_bogus() {
		// try switching to a theme that doesn't exist
		$template = rand_str();
		$style = rand_str();
		update_option('template', $template);
		update_option('stylesheet', $style);

		$theme = wp_get_theme();
		$this->assertEquals( $style, (string) $theme );
		$this->assertNotSame( false, $theme->errors() );
		$this->assertFalse( $theme->exists() );

		// these return the bogus name - perhaps not ideal behaviour?
		$this->assertEquals($template, get_template());
		$this->assertEquals($style, get_stylesheet());
	}
}
