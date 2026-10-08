<?php

/**
 * Test the block WP_Navigation_Block_Renderer class.
 *
 * @package gutenberg
 */

class WP_Navigation_Block_Renderer_Test extends WP_UnitTestCase {

	/**
	 * Test that navigation links are wrapped in list items to preserve accessible markup
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_default_block_is_enclosed_in_li_tags() {

		$parsed_blocks         = parse_blocks(
			'<!-- wp:navigation-link {"label":"Sample Page","type":"page","kind":"post-type","url":"/hello-world"} /-->'
		);
		$parsed_block          = $parsed_blocks[0];
		$context               = array();
		$navigation_link_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		// Invoke the private method.
		$result = $method->invoke( $reflection, $navigation_link_block );

		$expected = '<li class="wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="/hello-world"><span class="wp-block-navigation-item__label">Sample Page</span></a></li>';
		$this->assertEqualHTML( $expected, $result );
	}

	/**
	 * Test that the site-title block is wrapped in a list item to preserve accessible markup
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_get_markup_for_inner_block_site_title() {

		// We are testing the site title block because we manually add list items around it.
		$parsed_blocks    = parse_blocks(
			'<!-- wp:site-title /-->'
		);
		$parsed_block     = $parsed_blocks[0];
		$context          = array();
		$site_title_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		// Invoke the private method.
		$result = $method->invoke( $reflection, $site_title_block );

		$expected = '<li class="wp-block-navigation-item"><h1 class="wp-block-site-title"><a href="http://' . WP_TESTS_DOMAIN . '" target="_self" rel="home">Test Blog</a></h1></li>';
		$this->assertEquals( $expected, $result );
	}

	/**
	 * Test that a given block will not be automatically wrapped in a list item by default.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_block_not_automatically_wrapped_with_li_tag() {

		register_block_type(
			'testsuite/sample-block',
			array(
				'api_version'     => 2,
				'render_callback' => function ( $attributes ) {
					return '<div class="wp-block-testsuite-sample-block">' . $attributes['content'] . '</div>';
				},
			)
		);

		// We are testing the site title block because we manually add list items around it.
		$parsed_blocks = parse_blocks(
			'<!-- wp:testsuite/sample-block {"content":"Hello World"} /-->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$heading_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		// Invoke the private method.
		$result = $method->invoke( $reflection, $heading_block );

		$expected = '<div class="wp-block-testsuite-sample-block">Hello World</div>';
		$this->assertEquals( $expected, $result );

		unregister_block_type( 'testsuite/sample-block' );
	}

	/**
	 * Test that a block can be added to the list of blocks which require a wrapping list item.
	 * This allows extenders to opt in to the rendering behavior of the Navigation block
	 * which helps to preserve accessible markup.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_markup_for_inner_block
	 */
	public function test_gutenberg_block_is_automatically_wrapped_with_li_tag_when_filtered() {

		register_block_type(
			'testsuite/sample-block',
			array(
				'api_version'     => 2,
				'render_callback' => function ( $attributes ) {
					return '<div class="wp-block-testsuite-sample-block">' . $attributes['content'] . '</div>';
				},
			)
		);

		$filter_needs_list_item_wrapper_function = static function ( $needs_list_item_wrapper ) {
			$needs_list_item_wrapper[] = 'testsuite/sample-block';
			return $needs_list_item_wrapper;
		};

		add_filter(
			'block_core_navigation_listable_blocks',
			$filter_needs_list_item_wrapper_function,
			10,
			1
		);

		// We are testing the site title block because we manually add list items around it.
		$parsed_blocks = parse_blocks(
			'<!-- wp:testsuite/sample-block {"content":"Hello World"} /-->'
		);
		$parsed_block  = $parsed_blocks[0];
		$context       = array();
		$heading_block = new WP_Block( $parsed_block, $context );

		// Setup an empty testing instance of `WP_Navigation_Block_Renderer` and save the original.
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_markup_for_inner_block' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		// Invoke the private method.
		$result = $method->invoke( $reflection, $heading_block );

		$expected = '<li class="wp-block-navigation-item"><div class="wp-block-testsuite-sample-block">Hello World</div></li>';
		$this->assertEquals( $expected, $result );

		remove_filter( 'block_core_navigation_listable_blocks', $filter_needs_list_item_wrapper_function, 10, 1 );

		unregister_block_type( 'testsuite/sample-block' );
	}

	/**
	 * Test that the `get_inner_blocks_from_navigation_post` method returns an empty block list for a non-existent post.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_inner_blocks_from_navigation_post
	 */
	public function test_gutenberg_get_inner_blocks_from_navigation_post_returns_empty_block_list() {
		$reflection = new ReflectionClass( 'WP_Navigation_Block_Renderer_Gutenberg' );
		$method     = $reflection->getMethod( 'get_inner_blocks_from_navigation_post' );
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}
		$attributes = array( 'ref' => 0 );

		$actual   = $method->invoke( $reflection, $attributes );
		$expected = new WP_Block_List( array(), $attributes );
		$this->assertEquals( $actual, $expected );
		$this->assertCount( 0, $actual );
	}

	/**
	 * Test that gutenberg_block_core_navigation_block_tree_has_block_type finds a block at the top level.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_gutenberg_block_core_navigation_block_tree_has_block_type_finds_top_level_block() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph --><!-- wp:navigation-overlay-close /-->'
		);
		$blocks        = new WP_Block_List( $parsed_blocks, array() );

		$result = gutenberg_block_core_navigation_block_tree_has_block_type(
			$blocks,
			'core/navigation-overlay-close'
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_block_tree_has_block_type finds a deeply nested block.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_gutenberg_block_core_navigation_block_tree_has_block_type_finds_nested_block() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:group -->
			<div class="wp-block-group">
				<!-- wp:columns -->
				<div class="wp-block-columns">
					<!-- wp:column -->
					<div class="wp-block-column">
						<!-- wp:navigation-overlay-close /-->
					</div>
					<!-- /wp:column -->
				</div>
				<!-- /wp:columns -->
			</div>
			<!-- /wp:group -->'
		);
		$blocks        = new WP_Block_List( $parsed_blocks, array() );

		$result = gutenberg_block_core_navigation_block_tree_has_block_type(
			$blocks,
			'core/navigation-overlay-close'
		);

		$this->assertTrue( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_block_tree_has_block_type returns false when block is not found.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_gutenberg_block_core_navigation_block_tree_has_block_type_returns_false_when_not_found() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:paragraph --><p>Test</p><!-- /wp:paragraph --><!-- wp:heading --><h2>Title</h2><!-- /wp:heading -->'
		);
		$blocks        = new WP_Block_List( $parsed_blocks, array() );

		$result = gutenberg_block_core_navigation_block_tree_has_block_type(
			$blocks,
			'core/navigation-overlay-close'
		);

		$this->assertFalse( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_overlay_html_has_close_block returns true when HTML contains the close button element.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_overlay_html_has_close_block
	 */
	public function test_gutenberg_block_core_navigation_overlay_html_has_close_block_returns_true_when_close_button_present() {
		$html   = '<div class="wp-block-group"><button class="wp-block-navigation-overlay-close" type="button">Close</button></div>';
		$result = gutenberg_block_core_navigation_overlay_html_has_close_block( $html );
		$this->assertTrue( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_overlay_html_has_close_block returns false when HTML does not contain the close button.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_overlay_html_has_close_block
	 */
	public function test_gutenberg_block_core_navigation_overlay_html_has_close_block_returns_false_when_absent() {
		$html   = '<div class="wp-block-group"><p>No close button here</p></div>';
		$result = gutenberg_block_core_navigation_overlay_html_has_close_block( $html );
		$this->assertFalse( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_overlay_html_has_close_block returns false when class string appears only in text content.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_overlay_html_has_close_block
	 */
	public function test_gutenberg_block_core_navigation_overlay_html_has_close_block_returns_false_when_class_in_text_only() {
		$html   = '<p>Use the wp-block-navigation-overlay-close button to close</p>';
		$result = gutenberg_block_core_navigation_overlay_html_has_close_block( $html );
		$this->assertFalse( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_overlay_html_has_close_block finds nested close button.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_overlay_html_has_close_block
	 */
	public function test_block_core_navigation_overlay_html_has_close_block_finds_nested_close_button() {
		$html   = '<div class="wp-block-group"><div class="wp-block-group"><button class="wp-block-navigation-overlay-close" type="button" aria-label="Close"><svg>...</svg></button></div></div>';
		$result = gutenberg_block_core_navigation_overlay_html_has_close_block( $html );
		$this->assertTrue( $result );
	}

	/**
	 * Test that gutenberg_block_core_navigation_overlay_html_has_close_block detects close block when overlay content is a pattern.
	 *
	 * Simulates the bug scenario: template part contains wp:pattern, pattern renders its content including the close block.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_overlay_html_has_close_block
	 */
	public function test_block_core_navigation_overlay_html_has_close_block_detects_close_in_pattern_output() {
		register_block_pattern(
			'test/navigation-overlay-pattern',
			array(
				'title'       => 'Navigation Overlay Pattern',
				'content'     => '<!-- wp:group --><div class="wp-block-group"><!-- wp:navigation-overlay-close /--></div><!-- /wp:group -->',
				'description' => 'Pattern containing navigation-overlay-close (simulates overlay template part using pattern).',
				'categories'  => array( 'navigation' ),
			)
		);

		try {
			// Simulate overlay template part content: just a pattern block (unresolved in block tree).
			$parsed_blocks = parse_blocks( '<!-- wp:pattern {"slug":"test/navigation-overlay-pattern"} /-->' );
			$blocks        = new WP_Block_List( $parsed_blocks, array() );

			// Render blocks (pattern block's render_callback outputs pattern content).
			$html = '';
			foreach ( $blocks as $block ) {
				$html .= $block->render();
			}

			$this->assertTrue(
				gutenberg_block_core_navigation_overlay_html_has_close_block( $html ),
				'Close block should be detected in rendered pattern output (fixes #76567).'
			);
		} finally {
			unregister_block_pattern( 'test/navigation-overlay-pattern' );
		}
	}

	/**
	 * Test that gutenberg_block_core_navigation_block_tree_has_block_type skips searching inside specified block types.
	 *
	 * @group navigation-renderer
	 *
	 * @covers ::gutenberg_block_core_navigation_block_tree_has_block_type
	 */
	public function test_gutenberg_block_core_navigation_block_tree_has_block_type_skips_specified_blocks() {
		$parsed_blocks = parse_blocks(
			'<!-- wp:navigation -->
			<nav class="wp-block-navigation">
				<!-- wp:navigation-link /-->
			</nav>
			<!-- /wp:navigation -->'
		);
		$blocks        = new WP_Block_List( $parsed_blocks, array() );

		// Should NOT find the block because it's inside a navigation block which we're skipping
		$result = gutenberg_block_core_navigation_block_tree_has_block_type(
			$blocks,
			'core/navigation-link',
			array( 'core/navigation' )
		);

		$this->assertFalse( $result );
	}

	/**
	 * Test that shortcodes inside a Navigation Overlay template part are expanded
	 * rather than output as raw shortcode tokens.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/77510
	 */
	public function test_shortcode_block_in_navigation_overlay_is_rendered() {
		add_shortcode(
			'gb_test_overlay_shortcode',
			static function () {
				return 'Hello, World!';
			}
		);

		$current_theme = get_stylesheet();
		$slug          = 'test-overlay-with-shortcode';

		$template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Test Overlay With Shortcode',
				'post_name'    => $slug,
				'post_content' => '<!-- wp:shortcode -->[gb_test_overlay_shortcode]<!-- /wp:shortcode -->',
			),
			true
		);
		$this->assertNotWPError( $template_part_id );

		wp_set_post_terms( $template_part_id, array( $current_theme ), 'wp_theme' );
		wp_set_post_terms( $template_part_id, array( 'navigation-overlay' ), 'wp_template_part_area' );

		$output = do_blocks(
			'<!-- wp:navigation {"overlay":"' . $slug . '","overlayMenu":"always"} /-->'
		);

		$this->assertStringContainsString( 'Hello, World!', $output, 'Shortcode inside the navigation overlay should be expanded.' );
		$this->assertStringNotContainsString( '[gb_test_overlay_shortcode]', $output, 'Raw shortcode token should not appear in the overlay output.' );
	}

	/**
	 * Creates a Navigation Overlay template part for the active theme.
	 *
	 * @param string $slug    The template part slug.
	 * @param string $content The template part content.
	 * @return int The template part post ID.
	 */
	private function create_navigation_overlay_template_part( $slug, $content ) {
		$template_part_id = wp_insert_post(
			array(
				'post_type'    => 'wp_template_part',
				'post_status'  => 'publish',
				'post_title'   => 'Test Overlay',
				'post_name'    => $slug,
				'post_content' => $content,
			),
			true
		);
		$this->assertNotWPError( $template_part_id );

		wp_set_post_terms( $template_part_id, array( get_stylesheet() ), 'wp_theme' );
		wp_set_post_terms( $template_part_id, array( 'navigation-overlay' ), 'wp_template_part_area' );

		return $template_part_id;
	}

	/**
	 * Test that a Navigation block inside a custom overlay inherits text and
	 * typography styles from the parent Navigation block when it does not set
	 * its own values.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 */
	public function test_navigation_block_in_custom_overlay_inherits_parent_text_and_typography_styles() {
		$slug = 'test-overlay-with-navigation-styles';
		$this->create_navigation_overlay_template_part(
			$slug,
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical"}} --><!-- wp:navigation-link {"label":"About","url":"/about"} /--><!-- /wp:navigation --></div><!-- /wp:group -->'
		);

		$output = do_blocks(
			'<!-- wp:navigation {"overlay":"' . $slug . '","overlayMenu":"always","customTextColor":"#123456","customFontSize":32,"fontFamily":"heading","style":{"typography":{"fontStyle":"italic","fontWeight":"700","lineHeight":"1.2","textTransform":"uppercase","letterSpacing":"0.08em","textDecoration":"underline"}}} /-->'
		);

		$tags = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue(
			$tags->next_tag(
				array(
					'tag_name'   => 'DIV',
					'class_name' => 'wp-block-navigation',
				)
			),
			'Nested Navigation block should render as a div inside the custom overlay.'
		);

		$style = $tags->get_attribute( 'style' );
		$class = $tags->get_attribute( 'class' );

		$this->assertStringContainsString( 'has-text-color', $class );
		$this->assertStringContainsString( 'has-heading-font-family', $class );
		$this->assertStringContainsString( 'has-text-decoration-underline', $class );
		$this->assertStringContainsString( 'color: #123456;', $style );
		$this->assertStringContainsString( 'font-size: 32px', $style );
		$this->assertStringContainsString( 'font-style:italic', $style );
		$this->assertStringContainsString( 'font-weight:700', $style );
		$this->assertStringContainsString( 'line-height:1.2', $style );
		$this->assertStringContainsString( 'text-transform:uppercase', $style );
		$this->assertStringContainsString( 'letter-spacing:0.08em', $style );
	}

	/**
	 * Test that explicit styles on a Navigation block inside a custom overlay
	 * are preserved instead of being replaced by parent Navigation styles.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 */
	public function test_navigation_block_in_custom_overlay_preserves_explicit_text_and_typography_styles() {
		$slug = 'test-overlay-with-explicit-navigation-styles';
		$this->create_navigation_overlay_template_part(
			$slug,
			'<!-- wp:group --><div class="wp-block-group"><!-- wp:navigation {"customTextColor":"#654321","customFontSize":20,"fontFamily":"body","style":{"typography":{"fontWeight":"400"}},"layout":{"type":"flex","orientation":"vertical"}} --><!-- wp:navigation-link {"label":"About","url":"/about"} /--><!-- /wp:navigation --></div><!-- /wp:group -->'
		);

		$output = do_blocks(
			'<!-- wp:navigation {"overlay":"' . $slug . '","overlayMenu":"always","customTextColor":"#123456","customFontSize":32,"fontFamily":"heading","style":{"typography":{"fontWeight":"700","textTransform":"uppercase"}}} /-->'
		);

		$tags = new WP_HTML_Tag_Processor( $output );
		$this->assertTrue(
			$tags->next_tag(
				array(
					'tag_name'   => 'DIV',
					'class_name' => 'wp-block-navigation',
				)
			),
			'Nested Navigation block should render as a div inside the custom overlay.'
		);

		$style = $tags->get_attribute( 'style' );
		$class = $tags->get_attribute( 'class' );

		$this->assertStringContainsString( 'has-body-font-family', $class );
		$this->assertStringNotContainsString( 'has-heading-font-family', $class );
		$this->assertStringContainsString( 'color: #654321;', $style );
		$this->assertStringContainsString( 'font-size: 20px', $style );
		$this->assertStringContainsString( 'font-weight:400', $style );
		$this->assertStringContainsString( 'text-transform:uppercase', $style );
		$this->assertStringNotContainsString( 'color: #123456;', $style );
		$this->assertStringNotContainsString( 'font-size: 32px', $style );
		$this->assertStringNotContainsString( 'font-weight:700', $style );
	}

	/**
	 * The default overlay expands every submenu it contains through the styles
	 * scoped to `:not(.disable-default-overlay)`, so the context must not claim
	 * a custom overlay when none is rendered.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 */
	public function test_default_overlay_does_not_flag_the_context_as_a_custom_overlay() {
		$output = do_blocks( '<!-- wp:navigation {"overlayMenu":"always"} /-->' );

		$this->assertStringNotContainsString( 'disable-default-overlay', $output, 'The default overlay should not disable the default overlay styles.' );
		$this->assertStringNotContainsString( '"hasCustomOverlay":true', $output, 'The default overlay should not flag the context as a custom overlay.' );
	}

	/**
	 * A custom overlay opts out of the styles that expand every submenu, so the
	 * context must tell submenus they are not inside the default overlay.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 */
	public function test_custom_overlay_flags_the_context_as_a_custom_overlay() {
		$slug = 'test-overlay-with-content';
		$this->create_navigation_overlay_template_part( $slug, '<!-- wp:paragraph --><p>Overlay content</p><!-- /wp:paragraph -->' );

		$output = do_blocks( '<!-- wp:navigation {"overlay":"' . $slug . '","overlayMenu":"always"} /-->' );

		$this->assertStringContainsString( 'disable-default-overlay', $output, 'A custom overlay should disable the default overlay styles.' );
		$this->assertStringContainsString( '"hasCustomOverlay":true', $output, 'A custom overlay should flag the context as a custom overlay.' );
	}

	/**
	 * An overlay template part that renders nothing - it was deleted, or it
	 * belongs to a theme that is no longer active - falls back to the default
	 * overlay, so the context has to fall back with it.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::get_responsive_container_markup
	 */
	public function test_overlay_template_part_that_renders_nothing_falls_back_to_the_default_overlay() {
		$output = do_blocks( '<!-- wp:navigation {"overlay":"test-overlay-that-does-not-exist","overlayMenu":"always"} /-->' );

		$this->assertStringNotContainsString( 'disable-default-overlay', $output, 'An overlay that renders nothing should keep the default overlay styles.' );
		$this->assertStringNotContainsString( '"hasCustomOverlay":true', $output, 'An overlay that renders nothing should not flag the context as a custom overlay.' );
	}

	/**
	 * Test that the submenu detection of one navigation block is not reused for the
	 * next navigation block rendered in the same request.
	 *
	 * @group navigation-renderer
	 *
	 * @covers WP_Navigation_Block_Renderer::render
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/82288
	 */
	public function test_submenu_detection_is_not_shared_between_navigation_blocks() {
		$view_module = '@wordpress/block-library/navigation/view';
		wp_dequeue_script_module( $view_module );

		// A navigation with a submenu that is not interactive by itself.
		do_blocks(
			'<!-- wp:navigation {"showSubmenuIcon":false,"openSubmenusOnClick":false,"overlayMenu":"never"} -->' .
			'<!-- wp:navigation-submenu {"label":"More","url":"/more"} --><!-- wp:navigation-link {"label":"Deep","url":"/deep"} /--><!-- /wp:navigation-submenu -->' .
			'<!-- /wp:navigation -->'
		);
		$this->assertNotContains( $view_module, wp_script_modules()->get_queue(), 'A non-interactive navigation with a submenu should not enqueue the view module.' );

		// A navigation without submenus rendered afterwards in the same request.
		do_blocks(
			'<!-- wp:navigation {"showSubmenuIcon":true,"overlayMenu":"never"} -->' .
			'<!-- wp:navigation-link {"label":"Home","url":"/"} /-->' .
			'<!-- /wp:navigation -->'
		);
		$this->assertNotContains( $view_module, wp_script_modules()->get_queue(), 'A navigation without submenus should not enqueue the view module because a previous navigation had a submenu.' );
	}
}
