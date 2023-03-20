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

		// This Theme contains known template parts which we assert against in the tests.
		// See phpunit/data/themedir1/block-theme-child-with-template-parts/theme.json.
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

		$expected_template_part_slugs = array(
			'header',
			'header-large',
		);

		$paths = array_map(
			function( $path ) {
				return $path[0];
			},
			$preload_paths
		);

		// loop over $paths and assert $expected_template_part_slugs are in $paths.
		foreach ( $expected_template_part_slugs as $expected_template_part_slug ) {
			$this->assertContains( $template_parts_rest_route . '/' . self::$theme_slug . '//' . $expected_template_part_slug . '?context=edit', $paths, 'Preloading URL for "' . $expected_template_part_slug . '" template part was incorrect.' );
		}

		// assert that $paths does not contain a "footer" template part.
		$this->assertNotContains( $template_parts_rest_route . '/' . self::$theme_slug . '//' . 'footer' . '?context=edit', $paths, '"footer" template part which is not in the "header" area was incorrectly loaded.' );

	}
}
