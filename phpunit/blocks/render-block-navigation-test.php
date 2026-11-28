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

	public function tear_down() {
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
	 * @covers ::gutenberg_render_block_core_navigation
	 */
	public function test_min_sizes_apply_only_to_the_navigation_wrapper() {
		$markup = do_blocks( '<!-- wp:navigation {"overlayMenu":"mobile","style":{"dimensions":{"minWidth":"560px","minHeight":"340px"}}} --><!-- wp:navigation-link {"label":"Home","url":"/","kind":"custom"} /--><!-- /wp:navigation -->' );

		$processor = new WP_HTML_Tag_Processor( $markup );
		$this->assertTrue( $processor->next_tag( 'nav' ) );
		$this->assertStringContainsString( 'min-height:340px', $processor->get_attribute( 'style' ) );
		$this->assertStringContainsString( 'min-width:560px', $processor->get_attribute( 'style' ) );

		while ( $processor->next_tag() ) {
			$this->assertStringNotContainsString(
				'min-',
				(string) $processor->get_attribute( 'style' ),
				'The Navigation block min sizes must not reach its inner list or overlay.'
			);
		}
	}

	/**
	 * @covers WP_Theme_JSON_Gutenberg::get_styles_for_block
	 */
	public function test_global_styles_min_sizes_target_only_the_navigation_wrapper() {
		$theme_json = new WP_Theme_JSON_Gutenberg(
			array(
				'version'  => WP_Theme_JSON_Gutenberg::LATEST_SCHEMA,
				'settings' => array(
					'viewport' => array(
						'mobile' => '480px',
					),
				),
				'styles'   => array(
					'blocks' => array(
						'core/navigation' => array(
							'dimensions' => array(
								'minWidth' => '560px',
							),
							'@mobile'    => array(
								'dimensions' => array(
									'minWidth' => '200px',
								),
							),
						),
					),
				),
			)
		);
		$stylesheet = $theme_json->get_stylesheet( array( 'styles' ) );

		$this->assertStringContainsString(
			':root :where(.wp-block-navigation:not(.wp-block-navigation__container):not(.wp-block-navigation__responsive-container.is-menu-open *)){min-width: 560px;}',
			$stylesheet
		);
		$this->assertStringContainsString(
			'@media (width <= 480px){:root :where(.wp-block-navigation:not(.wp-block-navigation__container):not(.wp-block-navigation__responsive-container.is-menu-open *)){min-width: 200px;}}',
			$stylesheet
		);
		$this->assertStringNotContainsString( ':root :where(.wp-block-navigation){min-width', $stylesheet );
	}

	/**
	 * @covers ::gutenberg_get_block_state_style_rules
	 */
	public function test_mobile_min_sizes_target_only_the_navigation_wrapper() {
		$rules = gutenberg_get_block_state_style_rules(
			array( '' => array( 'dimensions' => array( 'minWidth' => '200px' ) ) ),
			WP_Block_Type_Registry::get_instance()->get_registered( 'core/navigation' ),
			'@media (width <= 480px)'
		);

		$this->assertCount( 1, $rules );
		$this->assertSame( '.wp-block-navigation:not(.wp-block-navigation__container):not(.wp-block-navigation__responsive-container.is-menu-open *)', $rules[0]['selector'] );
	}
}
