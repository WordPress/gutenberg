<?php
/**
 * @group blocks
 * @group block-templates
 *
 * @covers ::get_block_templates
 */
class Tests_Blocks_GetBlockTemplates extends WP_UnitTestCase {

	const TEST_THEME = 'block-theme';

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
		$this->theme_root     = realpath( __DIR__ . '/../data/themedir1' );
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
		// Clear caches.
		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );
		switch_theme( self::TEST_THEME );
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

	/**
	 * Gets the template IDs from the given array.
	 *
	 * @param object[] $templates Array of template objects to parse.
	 * @return string[] The template IDs.
	 */
	private function get_template_ids( $templates ) {
		return array_map(
			static function ( $template ) {
				return $template->id;
			},
			$templates
		);
	}

	/**
	 * @dataProvider data_get_block_templates_should_respect_posttypes_property
	 * @ticket 55881
	 *
	 * @param string $post_type Post type for query.
	 * @param array  $expected  Expected template IDs.
	 */
	public function test_get_block_templates_should_respect_posttypes_property( $post_type, $expected ) {
		$templates = gutenberg_get_block_templates( array( 'post_type' => $post_type ) );

		$this->assertSameSets(
			$expected,
			$this->get_template_ids( $templates )
		);
	}

	/**
	 * Data provider.
	 *
	 * @return array
	 */
	public function data_get_block_templates_should_respect_posttypes_property() {
		// @code-merge: This code will go into Core's tests/phpunit/tests/blocks/getBlockTemplates.php.
		return array(
			'post' => array(
				'post_type' => 'post',
				'expected'  => array(
					'block-theme//custom-hero-template',
					'block-theme//custom-single-post-template',
				),
			),
			'page' => array(
				'post_type' => 'page',
				'expected'  => array(
					'block-theme//custom-hero-template',
					'block-theme//page-home',
				),
			),
		);
	}
}
