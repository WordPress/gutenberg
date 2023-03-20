<?php
/**
 * Test preloading of template parts for the Site Editor.
 *
 * @package Gutenberg
 */

class Block_Template_Part_Preloading_Test extends WP_UnitTestCase {


	private static $theme_slug = 'block-theme-child-with-template-parts';

	public function set_up() {
		parent::set_up();

		$this->theme_root = realpath( __DIR__ . '/data/themedir1' );

		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		switch_theme( self::$theme_slug );
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

	public function test_should_not_preload_when_not_in_site_editor_context() {
		$context       = new stdClass();
		$context->name = 'core/post-editor';

		$preload_paths = gutenberg_preload_template_parts( array(), $context );

		$this->assertEquals( array(), $preload_paths, 'Preloading paths populated when should be empty.' );
	}

	public function test_should_preload_template_parts_defined_in_theme_json() {

		$context       = new stdClass();
		$context->name = 'core/edit-site';

		$preload_paths = gutenberg_preload_template_parts( array(), $context );

		$template_parts_rest_route = rest_get_route_for_post_type_items(
			'wp_template_part'
		);

		$this->assertEquals( $template_parts_rest_route . '/' . self::$theme_slug . '//' . 'header' . '?context=edit', $preload_paths[0][0], 'Preloading URL for "header" template part was incorrect.' );
		$this->assertEquals( $template_parts_rest_route . '/' . self::$theme_slug . '//' . 'footer' . '?context=edit', $preload_paths[1][0], 'Preloading URL for "footer" template part was incorrect.' );
	}
}
