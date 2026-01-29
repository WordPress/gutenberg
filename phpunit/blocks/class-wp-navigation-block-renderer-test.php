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
		$method->setAccessible( true );
		// Invoke the private method.
		$result = $method->invoke( $reflection, $navigation_link_block );

		$expected = '<li class=" wp-block-navigation-item wp-block-navigation-link"><a class="wp-block-navigation-item__content"  href="/hello-world"><span class="wp-block-navigation-item__label">Sample Page</span></a></li>';
		$this->assertEquals( $expected, $result );
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
		$method->setAccessible( true );
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
		$method->setAccessible( true );
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
		$method->setAccessible( true );
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
		$method->setAccessible( true );
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
}
