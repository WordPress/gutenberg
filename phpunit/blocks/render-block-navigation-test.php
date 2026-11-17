<?php
/**
 * Navigation block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for the Navigation block.
 *
 * @group blocks
 */
class Render_Block_Navigation_Test extends WP_UnitTestCase {
	/**
	 * Theme root directory used by tests that need a block theme.
	 *
	 * @var string|null
	 */
	private $theme_root;

	/**
	 * Original theme directories, restored after tests that switch themes.
	 *
	 * @var array|null
	 */
	private $orig_theme_dir;

	/**
	 * Original text direction, restored after tests that switch to RTL.
	 *
	 * @var string|null
	 */
	private $orig_text_direction;

	/**
	 * Theme data filter that overrides the viewport settings, if set.
	 *
	 * @var callable|null
	 */
	private $viewport_settings_filter;

	/**
	 * Callbacks added to `block_core_navigation_overlay_viewports`, removed
	 * after each test.
	 *
	 * @var callable[]
	 */
	private $overlay_viewports_filters = array();

	public function set_up() {
		parent::set_up();
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
	}

	public function tear_down() {
		WP_Style_Engine_CSS_Rules_Store_Gutenberg::remove_all_stores();
		foreach ( $this->overlay_viewports_filters as $callback ) {
			remove_filter( 'block_core_navigation_overlay_viewports', $callback );
		}
		$this->overlay_viewports_filters = array();
		if ( null !== $this->orig_text_direction ) {
			$GLOBALS['wp_locale']->text_direction = $this->orig_text_direction;
			$this->orig_text_direction            = null;
		}
		if ( null !== $this->viewport_settings_filter ) {
			remove_filter( 'wp_theme_json_data_theme', $this->viewport_settings_filter );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
			$this->viewport_settings_filter = null;
		}
		if ( null !== $this->theme_root ) {
			remove_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
			remove_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
			remove_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );
			$GLOBALS['wp_theme_directories'] = $this->orig_theme_dir;
			wp_clean_themes_cache();
			unset( $GLOBALS['wp_themes'] );
			_gutenberg_clean_theme_json_caches();
			$this->theme_root = null;
		}
		parent::tear_down();
	}

	public function filter_set_theme_root() {
		return $this->theme_root;
	}

	/**
	 * Switches to the `block-theme` test theme from `phpunit/data/themedir1`.
	 */
	private function switch_to_block_theme() {
		$this->theme_root     = realpath( dirname( __DIR__ ) . '/data/themedir1' );
		$this->orig_theme_dir = $GLOBALS['wp_theme_directories'];

		// /themes is necessary as theme.php functions assume /themes is the root if there is only one root.
		$GLOBALS['wp_theme_directories'] = array( WP_CONTENT_DIR . '/themes', $this->theme_root );

		add_filter( 'theme_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'stylesheet_root', array( $this, 'filter_set_theme_root' ) );
		add_filter( 'template_root', array( $this, 'filter_set_theme_root' ) );

		wp_clean_themes_cache();
		unset( $GLOBALS['wp_themes'] );

		switch_theme( 'block-theme' );
	}

	/**
	 * Overrides the theme's `settings.viewport` until the test tears down.
	 *
	 * @param array $viewport_settings Viewport settings.
	 */
	private function set_viewport_settings( $viewport_settings ) {
		$this->viewport_settings_filter = static function ( $theme_json ) use ( $viewport_settings ) {
			return $theme_json->update_with(
				array(
					'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
					'settings' => array(
						'viewport' => $viewport_settings,
					),
				)
			);
		};
		add_filter( 'wp_theme_json_data_theme', $this->viewport_settings_filter );
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
	}

	/**
	 * Renders a Navigation block with two links.
	 *
	 * @param array $attributes Navigation block attributes.
	 * @return string Rendered markup.
	 */
	private function render_navigation_block( $attributes ) {
		return do_blocks(
			'<!-- wp:navigation ' . wp_json_encode( (object) $attributes ) . ' -->' .
			'<!-- wp:navigation-link {"label":"Home","url":"/","kind":"custom"} /-->' .
			'<!-- wp:navigation-link {"label":"About","url":"/about","kind":"custom"} /-->' .
			'<!-- /wp:navigation -->'
		);
	}

	/**
	 * Adds a callback to `block_core_navigation_overlay_viewports` until the
	 * test tears down.
	 *
	 * @param callable $callback Filter callback.
	 */
	private function add_overlay_viewports_filter( $callback ) {
		$this->overlay_viewports_filters[] = $callback;
		add_filter( 'block_core_navigation_overlay_viewports', $callback, 10, 3 );
	}

	/**
	 * Asserts that the rendered Navigation block shows the overlay up to the
	 * theme's tablet breakpoint and the links inline above it, with classes and
	 * rules that agree.
	 *
	 * @param string $markup Rendered markup.
	 */
	private function assert_tablet_overlay_markup( $markup ) {
		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertTrue( $processor->has_class( 'is-responsive' ), 'is-responsive class' );
		$this->assertTrue( $processor->has_class( 'has-overlay-viewports' ), 'The wrapper must opt out of the static breakpoint.' );
		$this->assertTrue(
			$processor->next_tag( array( 'class_name' => 'wp-block-navigation__responsive-container-open' ) ),
			'Overlay open button'
		);

		$overlay_class = $this->get_overlay_viewports_class( $markup );
		$this->assertNotNull( $overlay_class, 'The wrapper must have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $overlay_class, '@media (width > 782px)' ) as $rule ) {
			$this->assertStringContainsString( $rule, $stylesheet );
		}
		$this->assertSame( 4, substr_count( $stylesheet, $overlay_class ), 'The stylesheet must contain only the Tablet rules.' );
	}

	/**
	 * Returns the block-supports stylesheet generated so far.
	 *
	 * @return string Stylesheet.
	 */
	private function get_block_supports_stylesheet() {
		return gutenberg_style_engine_get_stylesheet_from_context(
			'block-supports',
			array( 'prettify' => false )
		);
	}

	/**
	 * Returns the hashed overlay class on the rendered Navigation wrapper.
	 *
	 * @param string $markup Rendered markup.
	 * @return string|null The class, or null if the wrapper has none.
	 */
	private function get_overlay_viewports_class( $markup ) {
		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		foreach ( $processor->class_list() as $class_name ) {
			if ( preg_match( '/^wp-navigation-overlay-[a-f0-9]{8}$/', $class_name ) ) {
				return $class_name;
			}
		}
		return null;
	}

	/**
	 * Returns the four rules that show the Navigation links inline for one
	 * media query, as the style engine prints them.
	 *
	 * @param string $overlay_class Unique overlay class.
	 * @param string $media_query   Media query.
	 * @param string $submenu_start Physical side where open submenus start.
	 * @return string[] Rules.
	 */
	private function get_expected_inline_rules( $overlay_class, $media_query, $submenu_start = 'left' ) {
		$base      = ".wp-block-navigation.{$overlay_class}";
		$container = "{$base} .wp-block-navigation__responsive-container";
		$inline    = "{$container}:not(.hidden-by-default):not(.is-menu-open)";
		$submenu   = '.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container';

		return array(
			"{$media_query}{{$inline}{display:block;width:100%;position:relative;z-index:auto;background-color:inherit;}}",
			"{$media_query}{{$inline} .wp-block-navigation__responsive-container-close{display:none;}}",
			"{$media_query}{{$container}.is-menu-open {$submenu}{{$submenu_start}:0;}}",
			"{$media_query}{{$base} .wp-block-navigation__responsive-container-open:not(.always-shown){display:none;}}",
		);
	}

	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation-link {"label":"Sample Page","type":"page","kind":"post-type","id":755,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=755"} /-->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSets( array( 755 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block_nested() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:group -->
					<!-- wp:navigation-link {"label":"Sample Page","type":"page","id":20,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=20","kind":"post-type","isTopLevelLink":true} /-->
					<!-- wp:navigation-link {"label":"Hello world!","type":"post","id":10,"url":"http://' . WP_TESTS_DOMAIN . '/?p=10","kind":"post-type","isTopLevelLink":true} /-->
					<!-- wp:navigation-submenu {"label":"Uncategorized","type":"category","id":1,"url":"http://' . WP_TESTS_DOMAIN . '/?cat=1","kind":"taxonomy","isTopLevelItem":true} -->
					<!-- wp:navigation-link {"label":"Sample Page","type":"page","id":30,"url":"http://' . WP_TESTS_DOMAIN . '/?page_id=30","kind":"post-type","isTopLevelLink":false} /-->
					<!-- wp:navigation-submenu {"label":"Hello world!","type":"post","id":40,"url":"http://' . WP_TESTS_DOMAIN . '/?p=40","kind":"post-type","isTopLevelItem":false} -->
					<!-- wp:navigation-link {"label":"Uncategorized","type":"category","id":5,"url":"http://' . WP_TESTS_DOMAIN . '/?cat=5","kind":"taxonomy","isTopLevelLink":false} /-->
					<!-- wp:navigation-link {"label":"Hello world!","type":"post","id":60,"url":"http:/' . WP_TESTS_DOMAIN . '/?p=60","kind":"post-type","isTopLevelLink":false} /-->
					<!-- /wp:navigation-submenu -->
					<!-- /wp:navigation-submenu -->
					<!-- /wp:group -->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSets( array( 40, 60, 10, 20, 30 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_from_block_get_post_ids
	 */
	public function test_block_core_navigation_get_post_ids_from_block_with_submenu() {
		$parsed_blocks = parse_blocks( '<!-- wp:navigation-submenu {"label":"Test","type":"post","id":789,"url":"http://' . WP_TESTS_DOMAIN . '/blog/test-3","kind":"post-type","isTopLevelItem":true} -->\n<!-- wp:navigation-link {"label":"(no title)","type":"post","id":755,"url":"http://' . WP_TESTS_DOMAIN . '/blog/755","kind":"post-type","isTopLevelLink":false} /-->\n<!-- /wp:navigation-submenu -->' );
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$block         = new WP_Block( $parsed_block, $context );

		$post_ids = gutenberg_block_core_navigation_from_block_get_post_ids( $block );
		$this->assertSameSetsWithIndex( array( 755, 789 ), $post_ids );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:navigation /-->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation_deep() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- /wp:group --><!-- wp:group --><!-- wp:group --><!-- wp:navigation /--><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertTrue( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_block_core_navigation_block_contains_core_navigation_no_navigation() {
		$parsed_blocks = parse_blocks( '<!-- wp:group --><!-- wp:group --><!-- /wp:group --><!-- /wp:group -->' );
		$inner_blocks  = new WP_Block_List( $parsed_blocks );
		$this->assertFalse( gutenberg_block_core_navigation_block_tree_has_block_type( $inner_blocks, 'core/navigation' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_adds_low_priority() {
		$html   = '<div><img src="example.jpg" width="300" height="300" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
		$this->assertNull( $tags->get_attribute( 'loading' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_overrides_high_priority() {
		$html   = '<div><img src="example.jpg" fetchpriority="high" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_multiple_images() {
		$html   = '<div><img src="a.jpg" /><img src="b.jpg" /></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$tags   = new WP_HTML_Tag_Processor( $result );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
		$this->assertTrue( $tags->next_tag( 'IMG' ) );
		$this->assertSame( 'low', $tags->get_attribute( 'fetchpriority' ) );
	}

	/**
	 * @covers ::block_core_navigation_set_overlay_image_fetch_priority
	 */
	public function test_block_core_navigation_set_overlay_image_fetch_priority_no_images() {
		$html   = '<div><p>No images here</p></div>';
		$result = gutenberg_block_core_navigation_set_overlay_image_fetch_priority( $html );
		$this->assertSame( $html, $result );
	}

	/**
	 * Test that original markup is returned when there are no state classes.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_no_state_class_preserves_block_markup() {
		$block_content = '<nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that Navigation state classes are copied to inner list containers.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_state_class_is_added_to_inner_list_container() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Item</li></ul></nav>',
			$actual
		);
	}

	/**
	 * Test that non-Navigation blocks are unchanged.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_state_class_is_not_added_to_non_navigation_blocks() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/group' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that existing inner state classes are preserved.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_existing_inner_state_class_is_preserved() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Item</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame( $block_content, $actual );
	}

	/**
	 * Test that Navigation state classes are copied to multiple inner list containers.
	 *
	 * Navigation can emit more than one list container when listable menu items
	 * are separated by non-listable blocks.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_state_class_is_added_to_multiple_inner_list_containers() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Two</li></ul></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Two</li></ul></nav>',
			$actual
		);
	}

	/**
	 * Test that Navigation state classes are not copied to nested Navigation blocks.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_state_class_is_not_added_to_nested_navigation_containers() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>',
			$actual
		);
	}

	/**
	 * Test that nested Navigation blocks preserve their own state classes.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_nested_navigation_preserves_its_own_state_class() {
		$block_content = '<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation wp-states-abcd1234"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>';
		$block         = array( 'blockName' => 'core/navigation' );

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container( $block_content, $block );

		$this->assertSame(
			'<nav class="wp-block-navigation wp-states-1234abcd"><ul class="wp-block-navigation__container wp-block-navigation wp-states-1234abcd"><li class="wp-block-navigation-item">Parent</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation wp-states-abcd1234"><ul class="wp-block-navigation__container wp-block-navigation wp-states-abcd1234"><li class="wp-block-navigation-item">Nested</li></ul></nav></div></nav>',
			$actual
		);
	}

	/**
	 * Test that layout values are converted to the Navigation custom properties.
	 *
	 * @covers ::gutenberg_block_core_navigation_get_layout_custom_property_declarations
	 */
	public function test_get_layout_custom_property_declarations() {
		$actual = gutenberg_block_core_navigation_get_layout_custom_property_declarations(
			array(
				'orientation'    => 'vertical',
				'justifyContent' => 'right',
				'flexWrap'       => 'nowrap',
			)
		);

		$this->assertSame(
			array(
				'--navigation-layout-justification-setting' => 'flex-end',
				'--navigation-layout-direction' => 'column',
				'--navigation-layout-wrap'      => 'nowrap',
				'--navigation-layout-justify'   => 'flex-end',
				'--navigation-layout-align'     => 'flex-end',
			),
			$actual
		);
	}

	/**
	 * Test responsive layout styles and classes on local Navigation containers.
	 *
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_add_layout_custom_properties_updates_navigation_containers_only() {
		$block_content = '<nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation items-justified-right"><li>One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation items-justified-right"><li>Two</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li>Nested</li></ul></nav></div></nav>';
		$attributes    = array(
			'layout' => array(
				'justifyContent' => 'right',
				'flexWrap'       => 'nowrap',
			),
			'style'  => array(
				'@mobile' => array(
					'layout' => array( 'orientation' => 'vertical' ),
				),
			),
		);

		$actual = gutenberg_block_core_navigation_add_support_classes_to_container(
			$block_content,
			array(
				'blockName' => 'core/navigation',
				'attrs'     => $attributes,
			)
		);
		$this->assertMatchesRegularExpression( '/\bwp-block-navigation-(\d+)\b/', $actual );
		preg_match( '/\bwp-block-navigation-(\d+)\b/', $actual, $matches );
		$responsive_class = $matches[0];

		$this->assertSame(
			'<nav class="wp-block-navigation ' . $responsive_class . '"><ul class="wp-block-navigation__container wp-block-navigation items-justified-right ' . $responsive_class . '"><li>One</li></ul><div>Separator</div><ul class="wp-block-navigation__container wp-block-navigation items-justified-right ' . $responsive_class . '"><li>Two</li></ul><div class="wp-block-navigation__overlay-container"><nav class="wp-block-navigation"><ul class="wp-block-navigation__container wp-block-navigation"><li>Nested</li></ul></nav></div></nav>',
			$actual
		);
	}

	/**
	 * @covers ::gutenberg_block_core_navigation_add_support_classes_to_container
	 */
	public function test_custom_css_targets_only_the_navigation_wrapper() {
		$markup = do_blocks( '<!-- wp:navigation {"overlayMenu":"never","style":{"css":"border: 1px solid pink; padding: 10px;"}} --><!-- wp:navigation-link {"label":"Home","url":"/","kind":"custom"} /--><!-- /wp:navigation -->' );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ) );
		$this->assertSame( 1, preg_match( '/\bwp-custom-css-[a-f0-9]+\b/', $processor->get_attribute( 'class' ), $matches ) );

		$this->assertTrue( $processor->next_tag( 'ul' ) );
		$this->assertFalse( $processor->has_class( $matches[0] ), 'The Navigation block custom CSS must not also target its inner list.' );
	}

	/**
	 * @covers WP_Theme_JSON_Gutenberg::get_styles_for_block
	 */
	public function test_global_styles_custom_css_targets_only_the_navigation_wrapper() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version' => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'styles'  => array(
					'blocks' => array(
						'core/navigation' => array(
							'css' => 'border: 1px solid pink;',
						),
					),
				),
			)
		);

		$this->assertStringContainsString(
			':root :where(.wp-block-navigation:not(.wp-block-navigation__container)){border: 1px solid pink;}',
			$theme_json->get_stylesheet( array( 'styles' ) ),
			'Global Styles custom CSS for Navigation must not also target its inner list.'
		);
	}

	/**
	 * Tests that block style variations applied to blocks inside a navigation
	 * menu post are generated on the frontend.
	 *
	 * @ticket 85833
	 *
	 * @covers ::gutenberg_block_core_navigation_filter_block_data
	 */
	public function test_block_style_variation_is_rendered_for_blocks_inside_a_navigation_menu() {
		$this->switch_to_block_theme();
		$original_styles = clone wp_styles();
		register_block_style(
			'core/navigation-link',
			array(
				'name'       => 'pill',
				'style_data' => array(
					'color' => array(
						'text' => '#123456',
					),
				),
			)
		);
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();

		try {
			wp_deregister_style( 'block-style-variation-styles' );
			$navigation_id = self::factory()->post->create(
				array(
					'post_type'    => 'wp_navigation',
					'post_status'  => 'publish',
					'post_content' => '<!-- wp:navigation-link {"label":"Home","url":"https://example.org","className":"is-style-pill"} /-->',
				)
			);

			$html       = do_blocks( '<!-- wp:navigation {"overlayMenu":"never","ref":' . $navigation_id . '} /-->' );
			$styles     = wp_styles()->get_data( 'block-style-variation-styles', 'after' );
			$stylesheet = is_array( $styles ) ? implode( '', $styles ) : '';

			$this->assertStringContainsString( 'is-style-pill--', $html );
			$this->assertStringContainsString( 'color: #123456', $stylesheet );
		} finally {
			unregister_block_style( 'core/navigation-link', 'pill' );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
			$GLOBALS['wp_styles'] = $original_styles;
		}
	}

	/**
	 * Tests that referenced submenu variations precede their children's styles.
	 *
	 * @ticket 85833
	 *
	 * @covers ::gutenberg_block_core_navigation_filter_block_data
	 */
	public function test_referenced_navigation_variation_styles_preserve_nested_order() {
		$this->switch_to_block_theme();
		$original_styles = clone wp_styles();
		register_block_style(
			'core/navigation-submenu',
			array(
				'name'       => 'navigation-parent-test',
				'style_data' => array(
					'blocks' => array(
						'core/navigation-link' => array(
							'color' => array(
								'text' => '#ff0000',
							),
						),
					),
				),
			)
		);
		register_block_style(
			'core/navigation-link',
			array(
				'name'       => 'navigation-child-test',
				'style_data' => array(
					'color' => array(
						'text' => '#0000ff',
					),
				),
			)
		);
		WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();

		try {
			wp_deregister_style( 'block-style-variation-styles' );
			$navigation_id = self::factory()->post->create(
				array(
					'post_type'    => 'wp_navigation',
					'post_status'  => 'publish',
					'post_content' => '<!-- wp:navigation-submenu {"label":"Parent","className":"is-style-navigation-parent-test"} --><!-- wp:navigation-link {"label":"Child","url":"https://example.org/child","kind":"custom","className":"is-style-navigation-child-test"} /--><!-- /wp:navigation-submenu -->',
				)
			);
			$html          = do_blocks( '<!-- wp:navigation {"overlayMenu":"never","ref":' . $navigation_id . '} /-->' );
			$styles        = wp_styles()->get_data( 'block-style-variation-styles', 'after' );
			$stylesheet    = is_array( $styles ) ? implode( '', $styles ) : '';
			$parent_rule   = strpos( $stylesheet, 'color: #ff0000' );
			$child_rule    = strpos( $stylesheet, 'color: #0000ff' );

			$this->assertStringContainsString( 'is-style-navigation-parent-test--', $html );
			$this->assertStringContainsString( 'is-style-navigation-child-test--', $html );
			$this->assertNotFalse( $parent_rule );
			$this->assertNotFalse( $child_rule );
			$this->assertLessThan( $child_rule, $parent_rule, 'The child variation must be able to override its parent.' );
		} finally {
			unregister_block_style( 'core/navigation-submenu', 'navigation-parent-test' );
			unregister_block_style( 'core/navigation-link', 'navigation-child-test' );
			WP_Theme_JSON_Resolver_Gutenberg::clean_cached_data();
			$GLOBALS['wp_styles'] = $original_styles;
		}
	}

	/**
	 * Test that the overlay attributes are resolved to a viewport map.
	 *
	 * @dataProvider data_overlay_viewports
	 * @covers ::gutenberg_block_core_navigation_get_overlay_viewports
	 *
	 * @param array      $attributes Block attributes.
	 * @param array|null $expected   Expected viewport map.
	 */
	public function test_block_core_navigation_get_overlay_viewports( $attributes, $expected ) {
		$this->assertSame( $expected, gutenberg_block_core_navigation_get_overlay_viewports( $attributes ) );
	}

	/**
	 * Data provider for test_block_core_navigation_get_overlay_viewports().
	 *
	 * @return array[]
	 */
	public function data_overlay_viewports() {
		return array(
			'never'                   => array(
				array( 'overlayMenu' => 'never' ),
				array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
				),
			),
			'never with isResponsive' => array(
				array(
					'overlayMenu'  => 'never',
					'isResponsive' => true,
				),
				null,
			),
			'always'                  => array(
				array( 'overlayMenu' => 'always' ),
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				),
			),
			'tablet'                  => array(
				array( 'overlayMenu' => 'tablet' ),
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				),
			),
			'mobile'                  => array( array( 'overlayMenu' => 'mobile' ), null ),
			'missing'                 => array( array(), null ),
			'array value'             => array( array( 'overlayMenu' => array( 'tablet' ) ), null ),
			'integer value'           => array( array( 'overlayMenu' => 0 ), null ),
			'injection attempt'       => array( array( 'overlayMenu' => 'tablet}body{display:none' ), null ),
		);
	}

	/**
	 * Test whether the overlay is shown in at least one viewport.
	 *
	 * @covers ::gutenberg_block_core_navigation_is_overlay_responsive
	 */
	public function test_block_core_navigation_is_overlay_responsive() {
		$this->assertTrue( gutenberg_block_core_navigation_is_overlay_responsive( null ) );
		$this->assertTrue(
			gutenberg_block_core_navigation_is_overlay_responsive(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				)
			)
		);
		$this->assertFalse(
			gutenberg_block_core_navigation_is_overlay_responsive(
				array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
				)
			)
		);
	}

	/**
	 * Test whether the overlay is shown in every viewport.
	 *
	 * @covers ::gutenberg_block_core_navigation_is_overlay_always_shown
	 */
	public function test_block_core_navigation_is_overlay_always_shown() {
		$this->assertTrue(
			gutenberg_block_core_navigation_is_overlay_always_shown(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				)
			)
		);
		$this->assertFalse(
			gutenberg_block_core_navigation_is_overlay_always_shown(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				)
			)
		);
		$this->assertFalse( gutenberg_block_core_navigation_is_overlay_always_shown( null ) );
	}

	/**
	 * Test the list of viewports where the links are inline.
	 *
	 * @dataProvider data_inline_viewports
	 * @covers ::gutenberg_block_core_navigation_get_inline_viewports
	 *
	 * @param array|null $overlay_viewports Viewport map.
	 * @param string[]   $expected          Expected inline viewports.
	 */
	public function test_block_core_navigation_get_inline_viewports( $overlay_viewports, $expected ) {
		$this->assertSame( $expected, gutenberg_block_core_navigation_get_inline_viewports( $overlay_viewports ) );
	}

	/**
	 * Data provider for test_block_core_navigation_get_inline_viewports().
	 *
	 * @return array[]
	 */
	public function data_inline_viewports() {
		return array(
			'tablet'         => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				),
				array( 'desktop' ),
			),
			'default mobile' => array( null, array() ),
			'never'          => array(
				array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
				),
				array(),
			),
			'always'         => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				),
				array(),
			),
			'non-contiguous' => array(
				array(
					'mobile'  => false,
					'tablet'  => true,
					'desktop' => true,
				),
				array( 'mobile' ),
			),
		);
	}

	/**
	 * Test that the overlay viewport helpers read only the canonical keys, and
	 * treat a viewport as overlay only when strictly `true` and as inline only
	 * when strictly `false`. The JS helpers are tested with the same cases.
	 *
	 * @dataProvider data_overlay_viewport_helpers_canonical_keys
	 * @covers ::gutenberg_block_core_navigation_is_overlay_responsive
	 * @covers ::gutenberg_block_core_navigation_is_overlay_always_shown
	 * @covers ::gutenberg_block_core_navigation_get_inline_viewports
	 *
	 * @param array    $overlay_viewports Viewport map.
	 * @param bool     $is_responsive     Expected is_overlay_responsive() result.
	 * @param bool     $is_always_shown   Expected is_overlay_always_shown() result.
	 * @param string[] $inline_viewports  Expected get_inline_viewports() result.
	 */
	public function test_overlay_viewport_helpers_read_only_canonical_keys( $overlay_viewports, $is_responsive, $is_always_shown, $inline_viewports ) {
		$this->assertSame( $is_responsive, gutenberg_block_core_navigation_is_overlay_responsive( $overlay_viewports ), 'is_overlay_responsive' );
		$this->assertSame( $is_always_shown, gutenberg_block_core_navigation_is_overlay_always_shown( $overlay_viewports ), 'is_overlay_always_shown' );
		$this->assertSame( $inline_viewports, gutenberg_block_core_navigation_get_inline_viewports( $overlay_viewports ), 'get_inline_viewports' );
	}

	/**
	 * Data provider for test_overlay_viewport_helpers_read_only_canonical_keys().
	 *
	 * @return array[]
	 */
	public function data_overlay_viewport_helpers_canonical_keys() {
		return array(
			'empty array'                 => array( array(), false, false, array() ),
			'partial map'                 => array(
				array(
					'mobile' => true,
					'tablet' => true,
				),
				true,
				false,
				array(),
			),
			'reordered keys'              => array(
				array(
					'desktop' => false,
					'tablet'  => true,
					'mobile'  => true,
				),
				true,
				false,
				array( 'desktop' ),
			),
			'reordered non-contiguous'    => array(
				array(
					'desktop' => true,
					'tablet'  => true,
					'mobile'  => false,
				),
				true,
				false,
				array( 'mobile' ),
			),
			'extra key with tablet'       => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
					'wide'    => false,
				),
				true,
				false,
				array( 'desktop' ),
			),
			'extra false key with always' => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
					'wide'    => false,
				),
				true,
				true,
				array(),
			),
			'extra true key with never'   => array(
				array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
					'wide'    => true,
				),
				false,
				false,
				array(),
			),
		);
	}

	/**
	 * Tests that the overlay setting decides whether the rendered markup is
	 * responsive and whether the overlay is always shown.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 *
	 * @dataProvider data_overlay_menu_markup
	 *
	 * @param array $attributes      Navigation block attributes.
	 * @param bool  $is_responsive   Whether the markup is expected to be responsive.
	 * @param bool  $is_always_shown Whether the overlay is expected to be always shown.
	 */
	public function test_overlay_menu_markup( $attributes, $is_responsive, $is_always_shown ) {
		$markup = $this->render_navigation_block( $attributes );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertSame( $is_responsive, $processor->has_class( 'is-responsive' ), 'is-responsive class' );

		$has_open_button = $processor->next_tag( array( 'class_name' => 'wp-block-navigation__responsive-container-open' ) );
		$this->assertSame( $is_responsive, $has_open_button, 'Overlay open button' );
		if ( ! $is_responsive ) {
			return;
		}
		$this->assertSame( $is_always_shown, $processor->has_class( 'always-shown' ), 'always-shown class' );

		$this->assertTrue(
			$processor->next_tag( array( 'class_name' => 'wp-block-navigation__responsive-container' ) ),
			'Responsive navigation must render the overlay container.'
		);
		$this->assertSame( $is_always_shown, $processor->has_class( 'hidden-by-default' ), 'hidden-by-default class' );
	}

	/**
	 * Data provider for test_overlay_menu_markup().
	 *
	 * @return array[]
	 */
	public function data_overlay_menu_markup() {
		return array(
			'default (block.json mobile)'     => array( array(), true, false ),
			'mobile'                          => array( array( 'overlayMenu' => 'mobile' ), true, false ),
			'tablet'                          => array( array( 'overlayMenu' => 'tablet' ), true, false ),
			'always'                          => array( array( 'overlayMenu' => 'always' ), true, true ),
			'never'                           => array( array( 'overlayMenu' => 'never' ), false, false ),
			'never with legacy isResponsive'  => array(
				array(
					'overlayMenu'  => 'never',
					'isResponsive' => true,
				),
				true,
				false,
			),
			'always with legacy isResponsive' => array(
				array(
					'overlayMenu'  => 'always',
					'isResponsive' => true,
				),
				true,
				true,
			),
			// An invalid type reverts to the block.json default, `mobile`.
			'invalid type'                    => array( array( 'overlayMenu' => true ), true, false ),
		);
	}

	/**
	 * Tests that a Tablet overlay shows its links inline above the theme's
	 * tablet breakpoint, through rules scoped to the block.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_tablet_overlay_shows_links_inline_on_desktop() {
		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertTrue( $processor->has_class( 'has-overlay-viewports' ), 'The wrapper must opt out of the static breakpoint.' );

		$overlay_class = $this->get_overlay_viewports_class( $markup );
		$this->assertNotNull( $overlay_class, 'The wrapper must have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $overlay_class, '@media (width > 782px)' ) as $rule ) {
			$this->assertStringContainsString( $rule, $stylesheet );
		}
		$this->assertStringNotContainsString( '@media (width <= 480px)', $stylesheet, 'The overlay is shown on mobile.' );
		$this->assertStringNotContainsString( '@media (480px < width <= 782px)', $stylesheet, 'The overlay is shown on tablet.' );
	}

	/**
	 * Tests that a Tablet overlay starts open submenus on the right in
	 * right-to-left languages, matching the flipped static styles.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_tablet_overlay_positions_open_submenus_for_rtl() {
		$this->orig_text_direction            = $GLOBALS['wp_locale']->text_direction;
		$GLOBALS['wp_locale']->text_direction = 'rtl';

		$markup        = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );
		$overlay_class = $this->get_overlay_viewports_class( $markup );
		$this->assertNotNull( $overlay_class, 'The wrapper must have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $overlay_class, '@media (width > 782px)', 'right' ) as $rule ) {
			$this->assertStringContainsString( $rule, $stylesheet );
		}
		$this->assertStringNotContainsString( 'left:0', $stylesheet, 'Open submenus must not start on the left.' );
	}

	/**
	 * Tests that Tablet overlays with the same rules share one class, and that
	 * the stylesheet contains each rule once.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_tablet_overlays_share_one_class() {
		$first_class  = $this->get_overlay_viewports_class( $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) ) );
		$second_class = $this->get_overlay_viewports_class( $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) ) );

		$this->assertNotNull( $first_class, 'The wrapper must have an overlay class.' );
		$this->assertSame( $first_class, $second_class, 'Tablet overlays with the same rules must share one class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $first_class, '@media (width > 782px)' ) as $rule ) {
			$this->assertSame( 1, substr_count( $stylesheet, $rule ), 'Each rule must be printed once.' );
		}
		$this->assertSame( 4, substr_count( $stylesheet, $first_class ), 'The stylesheet must contain the four rules once.' );
	}

	/**
	 * Tests that a Tablet overlay follows the theme's tablet breakpoint.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_tablet_overlay_follows_custom_tablet_breakpoint() {
		$this->set_viewport_settings(
			array(
				'mobile' => '30em',
				'tablet' => '60em',
			)
		);

		$markup        = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );
		$overlay_class = $this->get_overlay_viewports_class( $markup );
		$this->assertNotNull( $overlay_class, 'The wrapper must have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $overlay_class, '@media (width > 60em)' ) as $rule ) {
			$this->assertStringContainsString( $rule, $stylesheet );
		}
		$this->assertStringNotContainsString( '782px', $stylesheet, 'The default tablet breakpoint must not be used.' );
	}

	/**
	 * Tests that a Tablet overlay collapses at the mobile breakpoint when the
	 * theme has no valid tablet breakpoint.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_tablet_overlay_uses_mobile_breakpoint_without_tablet_breakpoint() {
		$this->set_viewport_settings(
			array(
				'mobile' => '30em',
				'tablet' => 'invalid',
			)
		);

		$markup        = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );
		$overlay_class = $this->get_overlay_viewports_class( $markup );
		$this->assertNotNull( $overlay_class, 'The wrapper must have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		foreach ( $this->get_expected_inline_rules( $overlay_class, '@media (width > 30em)' ) as $rule ) {
			$this->assertStringContainsString( $rule, $stylesheet );
		}
	}

	/**
	 * Tests that overlay settings that don't follow the viewports keep the
	 * static breakpoint and add no overlay rules.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 *
	 * @dataProvider data_overlay_menu_without_viewport_rules
	 *
	 * @param mixed $overlay_menu The overlayMenu attribute value, or null to omit it.
	 */
	public function test_overlay_menu_without_viewport_rules( $overlay_menu ) {
		$attributes = null === $overlay_menu ? array() : array( 'overlayMenu' => $overlay_menu );
		$markup     = $this->render_navigation_block( $attributes );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertFalse( $processor->has_class( 'has-overlay-viewports' ), 'The wrapper must keep the static breakpoint.' );
		$this->assertNull( $this->get_overlay_viewports_class( $markup ), 'The wrapper must not have an overlay class.' );

		$stylesheet = $this->get_block_supports_stylesheet();
		$this->assertStringNotContainsString( 'has-overlay-viewports', $stylesheet );
		$this->assertStringNotContainsString( 'responsive-container', $stylesheet );

		if ( is_string( $overlay_menu ) && ! in_array( $overlay_menu, array( 'mobile', 'always', 'never' ), true ) ) {
			$this->assertStringNotContainsString( $overlay_menu, $markup, 'The attribute value must not be printed.' );
			$this->assertStringNotContainsString( '<script>', $markup );
			$this->assertStringNotContainsString( 'alert(1)', $stylesheet );
		}
	}

	/**
	 * Data provider for test_overlay_menu_without_viewport_rules().
	 *
	 * @return array[]
	 */
	public function data_overlay_menu_without_viewport_rules() {
		return array(
			'default (block.json mobile)' => array( null ),
			'mobile'                      => array( 'mobile' ),
			'always'                      => array( 'always' ),
			'never'                       => array( 'never' ),
			'tablet with closing style'   => array( 'tablet</style><script>alert(1)</script>' ),
			'tablet in an array'          => array( array( 'tablet' ) ),
			'tablet with closing brace'   => array( 'tablet; }' ),
		);
	}

	/**
	 * Tests that the filtered viewports are the unfiltered viewports when no
	 * filter is added.
	 *
	 * @dataProvider data_overlay_viewports
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 *
	 * @param array      $attributes Block attributes.
	 * @param array|null $expected   Expected viewport map.
	 */
	public function test_filtered_overlay_viewports_without_a_filter( $attributes, $expected ) {
		$this->assertSame( $expected, gutenberg_block_core_navigation_get_filtered_overlay_viewports( $attributes ) );
	}

	/**
	 * Tests that the overlay viewports filter receives the unfiltered viewports,
	 * the block attributes including `ref`, and the block instance.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 */
	public function test_overlay_viewports_filter_receives_the_viewports_attributes_and_block() {
		$navigation_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_navigation',
				'post_status'  => 'publish',
				'post_content' => '<!-- wp:navigation-link {"label":"Home","url":"/","kind":"custom"} /-->',
			)
		);
		$calls         = array();
		$this->add_overlay_viewports_filter(
			static function ( $overlay_viewports, $attributes, $block ) use ( &$calls ) {
				$calls[] = array( $overlay_viewports, $attributes, $block );
				return $overlay_viewports;
			}
		);

		do_blocks( '<!-- wp:navigation {"overlayMenu":"tablet","ref":' . $navigation_id . '} /-->' );

		$this->assertCount( 1, $calls, 'The filter must be applied once.' );
		list( $overlay_viewports, $attributes, $block ) = $calls[0];
		$this->assertSame(
			array(
				'mobile'  => true,
				'tablet'  => true,
				'desktop' => false,
			),
			$overlay_viewports
		);
		$this->assertSame( 'tablet', $attributes['overlayMenu'] );
		$this->assertSame( $navigation_id, $attributes['ref'] );
		$this->assertInstanceOf( WP_Block::class, $block );
		$this->assertSame( 'core/navigation', $block->name );
		$this->assertSame( $attributes, $block->attributes, 'The filter must receive the attributes of the block it is given.' );
	}

	/**
	 * Tests that the overlay viewports filter receives null for the default
	 * `mobile` behavior, and null for the block when none is passed.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 */
	public function test_overlay_viewports_filter_receives_null_for_the_default_behavior() {
		$calls = array();
		$this->add_overlay_viewports_filter(
			static function ( $overlay_viewports, $attributes, $block ) use ( &$calls ) {
				$calls[] = array( $overlay_viewports, $attributes, $block );
				return $overlay_viewports;
			}
		);

		$this->render_navigation_block( array() );
		gutenberg_block_core_navigation_get_filtered_overlay_viewports( array( 'overlayMenu' => 'never' ) );

		$this->assertCount( 2, $calls );
		$this->assertNull( $calls[0][0], 'The default behavior must be passed as null.' );
		$this->assertSame( 'mobile', $calls[0][1]['overlayMenu'] );
		$this->assertInstanceOf( WP_Block::class, $calls[0][2] );
		$this->assertNull( $calls[1][2], 'The block must default to null.' );
	}

	/**
	 * Tests that a filter can make a `mobile` overlay collapse at the theme's
	 * tablet breakpoint.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_can_show_a_mobile_overlay_on_tablet() {
		$this->add_overlay_viewports_filter(
			static function () {
				return array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				);
			}
		);

		$this->assert_tablet_overlay_markup( $this->render_navigation_block( array( 'overlayMenu' => 'mobile' ) ) );
	}

	/**
	 * Tests that a filter can return null for the default `mobile` behavior.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_can_return_the_default_behavior() {
		$this->add_overlay_viewports_filter( '__return_null' );

		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertTrue( $processor->has_class( 'is-responsive' ), 'is-responsive class' );
		$this->assertFalse( $processor->has_class( 'has-overlay-viewports' ), 'The wrapper must keep the static breakpoint.' );
		$this->assertNull( $this->get_overlay_viewports_class( $markup ), 'The wrapper must not have an overlay class.' );
		$this->assertStringNotContainsString( 'responsive-container', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that a filter can show the overlay for a block whose overlay is
	 * never shown.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_can_show_the_overlay_for_never() {
		$this->add_overlay_viewports_filter(
			static function () {
				return array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => false,
				);
			}
		);

		$this->assert_tablet_overlay_markup( $this->render_navigation_block( array( 'overlayMenu' => 'never' ) ) );
	}

	/**
	 * Tests that a filter can hide the overlay in every viewport.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_can_hide_the_overlay() {
		$this->add_overlay_viewports_filter(
			static function () {
				return array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
				);
			}
		);

		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'always' ) );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ), 'The Navigation block must render a nav element.' );
		$this->assertFalse( $processor->has_class( 'is-responsive' ), 'is-responsive class' );
		$this->assertFalse(
			$processor->next_tag( array( 'class_name' => 'wp-block-navigation__responsive-container-open' ) ),
			'Overlay open button'
		);
	}

	/**
	 * Tests that an invalid filter result is ignored, and that nothing it
	 * returns is printed.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 *
	 * @dataProvider data_invalid_overlay_viewports_filter_results
	 *
	 * @param mixed $filtered Value returned by the filter.
	 */
	public function test_overlay_viewports_filter_ignores_invalid_results( $filtered ) {
		$this->add_overlay_viewports_filter(
			static function () use ( $filtered ) {
				return $filtered;
			}
		);

		$this->assertSame(
			array(
				'mobile'  => true,
				'tablet'  => true,
				'desktop' => false,
			),
			gutenberg_block_core_navigation_get_filtered_overlay_viewports( array( 'overlayMenu' => 'tablet' ) )
		);
		$this->assertNull(
			gutenberg_block_core_navigation_get_filtered_overlay_viewports( array( 'overlayMenu' => 'mobile' ) ),
			'An invalid result must keep the default behavior.'
		);

		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'tablet' ) );
		$this->assert_tablet_overlay_markup( $markup );

		$stylesheet = $this->get_block_supports_stylesheet();
		$this->assertStringNotContainsString( '900px', $markup );
		$this->assertStringNotContainsString( '900px', $stylesheet );
		$this->assertStringNotContainsString( 'display:none}', $stylesheet );
		$this->assertStringNotContainsString( 'body', $stylesheet );
	}

	/**
	 * Data provider for test_overlay_viewports_filter_ignores_invalid_results().
	 *
	 * @return array[]
	 */
	public function data_invalid_overlay_viewports_filter_results() {
		$hostile = '900px; } body { display:none';

		return array(
			'a string'              => array( $hostile ),
			'a partial map'         => array(
				array(
					'mobile' => true,
					'tablet' => true,
				),
			),
			'integer values'        => array(
				array(
					'mobile'  => 1,
					'tablet'  => 1,
					'desktop' => 0,
				),
			),
			'string values'         => array(
				array(
					'mobile'  => 'yes',
					'tablet'  => 'yes',
					'desktop' => false,
				),
			),
			'a string viewport'     => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => $hostile,
				),
			),
			'a list'                => array( array( true, true, false ) ),
			'false'                 => array( false ),
			'an object'             => array(
				(object) array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				),
			),
			'a map with null value' => array(
				array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => null,
				),
			),
		);
	}

	/**
	 * Tests that only the `mobile`, `tablet` and `desktop` keys are copied from
	 * the map a filter returns, in that order.
	 *
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 */
	public function test_overlay_viewports_filter_keeps_only_the_known_viewports() {
		$this->add_overlay_viewports_filter(
			static function () {
				return array(
					'desktop' => false,
					'wide'    => '</style><script>alert(1)</script>',
					'tablet'  => true,
					'mobile'  => true,
				);
			}
		);

		$this->assertSame(
			array(
				'mobile'  => true,
				'tablet'  => true,
				'desktop' => false,
			),
			gutenberg_block_core_navigation_get_filtered_overlay_viewports( array( 'overlayMenu' => 'never' ) )
		);

		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'never' ) );
		$this->assert_tablet_overlay_markup( $markup );
		$this->assertStringNotContainsString( 'alert(1)', $markup );
		$this->assertStringNotContainsString( 'alert(1)', $this->get_block_supports_stylesheet() );
	}

	/**
	 * Tests that the filter is not applied to a Navigation block inside an
	 * overlay template part, which never shows an overlay of its own.
	 *
	 * @covers ::gutenberg_block_core_navigation_get_filtered_overlay_viewports
	 */
	public function test_overlay_viewports_filter_is_skipped_inside_an_overlay() {
		$calls = 0;
		$this->add_overlay_viewports_filter(
			static function () use ( &$calls ) {
				++$calls;
				return array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				);
			}
		);

		$never = array(
			'mobile'  => false,
			'tablet'  => false,
			'desktop' => false,
		);
		$this->assertSame(
			$never,
			gutenberg_block_core_navigation_get_filtered_overlay_viewports(
				array(
					'overlayMenu'                  => 'never',
					'_isWithinOverlayTemplatePart' => true,
				)
			)
		);
		$this->assertSame(
			$never,
			gutenberg_block_core_navigation_get_filtered_overlay_viewports(
				array(
					'overlayMenu'                  => 'never',
					'isResponsive'                 => true,
					'_isWithinOverlayTemplatePart' => true,
				)
			),
			'The legacy isResponsive attribute must not give a nested block an overlay.'
		);
		$this->assertSame( 0, $calls, 'The filter must not be applied.' );
	}

	/**
	 * Tests that a Navigation block rendered inside an overlay template part
	 * is not responsive, and that the filter is applied only to the outer block.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_is_skipped_for_a_nested_navigation() {
		$template_part_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_name'    => 'navigation-overlay-viewports-test',
				'post_content' => '<!-- wp:navigation {"overlayMenu":"always","className":"nested-navigation"} --><!-- wp:navigation-link {"label":"Nested","url":"/nested","kind":"custom"} /--><!-- /wp:navigation -->',
			)
		);
		wp_set_post_terms( $template_part_id, get_stylesheet(), 'wp_theme' );

		$calls = array();
		$this->add_overlay_viewports_filter(
			static function ( $overlay_viewports, $attributes ) use ( &$calls ) {
				$calls[] = $attributes;
				return array(
					'mobile'  => true,
					'tablet'  => true,
					'desktop' => true,
				);
			}
		);

		$markup = $this->render_navigation_block( array( 'overlay' => 'navigation-overlay-viewports-test' ) );

		$this->assertCount( 1, $calls, 'The filter must be applied to the outer block only.' );
		$this->assertArrayNotHasKey( '_isWithinOverlayTemplatePart', $calls[0] );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'wp-block-navigation__overlay-container' ) ), 'The overlay template part must be rendered.' );
		$this->assertTrue( $processor->next_tag( array( 'class_name' => 'nested-navigation' ) ), 'The nested Navigation block must be rendered.' );
		$this->assertSame( 'DIV', $processor->get_tag() );
		$this->assertFalse( $processor->has_class( 'is-responsive' ), 'The nested Navigation block must not be responsive.' );
		$this->assertFalse(
			$processor->next_tag( array( 'class_name' => 'wp-block-navigation__responsive-container-open' ) ),
			'The nested Navigation block must not have an open button.'
		);
	}

	/**
	 * Tests that the filter is applied once per render, so a filter that
	 * returns a different map each time cannot make the classes, the markup
	 * and the rules disagree.
	 *
	 * @covers WP_Navigation_Block_Renderer_Gutenberg::render
	 */
	public function test_overlay_viewports_filter_is_applied_once_per_render() {
		$calls = 0;
		$this->add_overlay_viewports_filter(
			static function () use ( &$calls ) {
				++$calls;
				if ( 1 === $calls ) {
					return array(
						'mobile'  => true,
						'tablet'  => true,
						'desktop' => false,
					);
				}
				return array(
					'mobile'  => false,
					'tablet'  => false,
					'desktop' => false,
				);
			}
		);

		$markup = $this->render_navigation_block( array( 'overlayMenu' => 'always' ) );

		$this->assertSame( 1, $calls, 'The filter must be applied once per render.' );
		$this->assert_tablet_overlay_markup( $markup );

		$this->render_navigation_block( array( 'overlayMenu' => 'always' ) );
		$this->assertSame( 2, $calls, 'The filter must be applied again on the next render.' );
	}
}
