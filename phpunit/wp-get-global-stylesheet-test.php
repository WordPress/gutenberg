<?php
/**
 * Tests wp_get_global_stylesheet().
 *
 * @package Gutenberg
 */

class WP_Get_Global_Stylesheet_Test extends WP_UnitTestCase {

	/**
	 * Theme root directory.
	 *
	 * @var string
	 */
	private $theme_root;

	/**
	 * Original theme directory.
	 *
	 * @var string
	 */
	private $orig_theme_dir;

	public function set_up() {
		parent::set_up();

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];
		$this->theme_root     = realpath( DIR_TESTDATA . '/themedir1' );

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		// Set up the new root.
		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;

		// Clear up the filters to modify the theme root.
		remove_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		remove_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		parent::tear_down();
	}

	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_styles;
		parent::clean_up_global_scope();
		$wp_styles = null;
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	public function test_global_styles_changes_invalidates_cache() {
		switch_theme( 'block-theme' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );

		$config     = json_decode( $user_cpt['post_content'], true );
		$config['styles']['elements']['button']['color']['background'] = 'hotpink';
		$user_cpt['post_content'] = wp_json_encode( $config );

		wp_update_post( $user_cpt, true, false );

		$styles = gutenberg_get_global_stylesheet();
		$this->assertStringContainsString( '.button{background-color: hotpink;}', $styles );
	}
}
