<?php

/**
 * @group themes
 */
class Tests_Theme_ThemeDirLarge extends WP_UnitTestCase {
	function setUp() {
		parent::setUp();
		$this->theme_root = DIR_TESTDATA . '/wpcom-themes';

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter('theme_root', array(&$this, '_theme_root'));

		// clear caches
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	function tearDown() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		remove_filter('theme_root', array(&$this, '_theme_root'));
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tearDown();
	}

	// replace the normal theme root dir with our premade test dir
	function _theme_root($dir) {
		return $this->theme_root;
	}

	function _filter_out_themes_not_in_root( &$themes ) {
		foreach ( $themes as $key => $theme ) {
			if ( $theme->get_theme_root() != $this->theme_root )
				unset( $themes[ $key ] );
		}
	}

	function test_theme_list() {
		$themes = get_themes();
		$this->_filter_out_themes_not_in_root( $themes );
		$theme_names = array_keys( $themes );
		$this->assertEquals(87, count( $theme_names ) );
		$length = strlen( serialize( $themes ) );

		//2.9 pre [12226]
		$this->assertLessThanOrEqual(387283, $length );
		//2.8.5
		$this->assertLessThanOrEqual(368319, $length );
		//2.9 post [12226]
		$this->assertLessThanOrEqual(261998, $length );
		//3.4 post [20029], #20103
		$this->assertLessThanOrEqual(100000, $length );
	}

	/**
	 * Reducing in-memory size further.
	 *
	 * @ticket 11214
	 */
	function test_smaller_storage() {
		$themes = get_themes();
		$this->_filter_out_themes_not_in_root( $themes );
		$theme_names = array_keys($themes);
		$this->assertEquals(87, count($theme_names));
		$this->assertLessThanOrEqual(136342, strlen(serialize($themes)));
	}
}
