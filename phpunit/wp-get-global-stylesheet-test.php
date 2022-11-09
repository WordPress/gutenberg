<?php
/**
 * Tests wp_get_global_stylesheet().
 *
 * @package Gutenberg
 */

class WP_Get_Global_Stylesheet_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		$this->theme_root = realpath( __DIR__ . '/data/themedir1' );

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		$this->queries = array();
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
	}

	public function tear_down() {
		$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	public function test_global_styles_changes_invalidates_cache() {
		switch_theme( 'block-theme' );

		$user_cpt = WP_Theme_JSON_Resolver_Gutenberg::get_user_data_from_wp_global_styles( wp_get_theme(), true );

		$config     = json_decode( $user_cpt['post_content'], true );
		$config['styles']['color']['background'] = 'hotpink';
		$user_cpt['post_content'] = wp_json_encode( $config );

		wp_update_post( $user_cpt, true, false );

		$styles = gutenberg_get_global_stylesheet();
		$this->assertStringContainsString( '.button{background-color: hotpink;}', $styles );
	}
}
