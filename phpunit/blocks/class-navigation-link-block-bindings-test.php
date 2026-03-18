<?php
/**
 * Tests for Navigation Link block bindings integration.
 *
 * @package Gutenberg
 * @subpackage block-library
 */

/**
 * Tests for Navigation Link block with various binding sources.
 *
 * @group blocks
 */
class Navigation_Link_Block_Bindings_Test extends WP_UnitTestCase {

	private static $published_page;
	private static $draft_page;
	private static $category;
	private static $tag;

	/**
	 * Set up test fixtures.
	 */
	public static function wpSetUpBeforeClass() {
		// Create published page.
		self::$published_page = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'publish',
				'post_title'  => 'Published Page',
				'post_name'   => 'published-page',
			)
		);

		// Create draft page.
		self::$draft_page = self::factory()->post->create_and_get(
			array(
				'post_type'   => 'page',
				'post_status' => 'draft',
				'post_title'  => 'Draft Page',
				'post_name'   => 'draft-page',
			)
		);

		// Create category.
		self::$category = self::factory()->category->create_and_get(
			array(
				'name' => 'Test Category',
				'slug' => 'test-category',
			)
		);

		// Create tag.
		self::$tag = self::factory()->tag->create_and_get(
			array(
				'name' => 'Test Tag',
				'slug' => 'test-tag',
			)
		);
	}

	/**
	 * Clean up test fixtures.
	 */
	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$published_page->ID, true );
		wp_delete_post( self::$draft_page->ID, true );
		wp_delete_term( self::$category->term_id, 'category' );
		wp_delete_term( self::$tag->term_id, 'post_tag' );
	}

	/**
	 * Test legacy WP 6.9 format navigation link with core/post-data binding (no id/type in args).
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_legacy_format_post_data_binding_without_args() {
		$page_id = self::$published_page->ID;

		// WP 6.9 format: no id/type in args, only field.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		$this->assertStringContainsString( $expected_url, $result, 'Legacy format should resolve URL from block attributes.' );
		$this->assertStringContainsString( 'Test Link', $result, 'Label should be rendered.' );
	}

	/**
	 * Test new WP 7.0+ format navigation link with core/post-data binding (id/type in args).
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_new_format_post_data_binding_with_args() {
		$page_id = self::$published_page->ID;

		// WP 7.0+ format: id and type in args.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link","id":{$page_id},"type":"page"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		$this->assertStringContainsString( $expected_url, $result, 'New format should resolve URL from args.' );
		$this->assertStringContainsString( 'Test Link', $result, 'Label should be rendered.' );
	}

	/**
	 * Test legacy WP 6.9 format navigation link with core/term-data binding.
	 *
	 * @covers gutenberg_block_bindings_term_data_get_value
	 */
	public function test_legacy_format_term_data_binding_without_args() {
		$term_id = self::$category->term_id;

		// WP 6.9 format: no id/type in args.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Category","type":"category","kind":"taxonomy","id":{$term_id},"metadata":{"bindings":{"url":{"source":"core/term-data","args":{"field":"link"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_term_link( $term_id, 'category' );

		$this->assertStringContainsString( $expected_url, $result, 'Legacy term format should resolve URL from block attributes.' );
		$this->assertStringContainsString( 'Test Category', $result, 'Label should be rendered.' );
	}

	/**
	 * Test new WP 7.0+ format navigation link with core/term-data binding (id/type in args).
	 *
	 * @covers gutenberg_block_bindings_term_data_get_value
	 */
	public function test_new_format_term_data_binding_with_args() {
		$term_id = self::$category->term_id;

		// WP 7.0+ format: id and type in args.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Category","type":"category","kind":"taxonomy","id":{$term_id},"metadata":{"bindings":{"url":{"source":"core/term-data","args":{"field":"link","id":{$term_id},"type":"category"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_term_link( $term_id, 'category' );

		$this->assertStringContainsString( $expected_url, $result, 'New term format should resolve URL from args.' );
		$this->assertStringContainsString( 'Test Category', $result, 'Label should be rendered.' );
	}

	/**
	 * Test tag type is correctly mapped to post_tag taxonomy.
	 *
	 * @covers gutenberg_block_bindings_term_data_get_value
	 */
	public function test_tag_type_mapping_in_args() {
		$term_id = self::$tag->term_id;

		// New format with tag type (should map to post_tag taxonomy).
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Tag","type":"tag","kind":"taxonomy","id":{$term_id},"metadata":{"bindings":{"url":{"source":"core/term-data","args":{"field":"link","id":{$term_id},"type":"tag"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_term_link( $term_id, 'post_tag' );

		$this->assertStringContainsString( $expected_url, $result, 'Tag type should be mapped to post_tag taxonomy.' );
	}

	/**
	 * Test mixed formats on same page (both old and new format links).
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_mixed_formats_coexist() {
		$page_id = self::$published_page->ID;

		// Multiple links: one legacy, one new format.
		$block_content = <<<HTML
<!-- wp:navigation -->
<!-- wp:navigation-link {"label":"Legacy Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
<!-- wp:navigation-link {"label":"New Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link","id":{$page_id},"type":"page"}}}}} /-->
<!-- /wp:navigation -->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		$this->assertStringContainsString( 'Legacy Link', $result, 'Legacy format link should render.' );
		$this->assertStringContainsString( 'New Link', $result, 'New format link should render.' );

		// Both should have the correct URL.
		$this->assertEquals( 2, substr_count( $result, $expected_url ), 'Both links should have correct URL.' );
	}

	/**
	 * Test custom binding source can bind url attribute.
	 *
	 * @covers gutenberg_process_block_bindings
	 */
	public function test_custom_source_binding_url() {
		$page_id = self::$published_page->ID;

		// Register custom source.
		register_block_bindings_source(
			'test/custom-source',
			array(
				'label'              => 'Test Custom Source',
				'get_value_callback' => function ( $source_args ) use ( $page_id ) {
					if ( 'url' === $source_args['field'] ) {
						return get_permalink( $page_id );
					}
					return null;
				},
			)
		);

		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Custom Source Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"test/custom-source","args":{"field":"url"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		$this->assertStringContainsString( $expected_url, $result, 'Custom source should be able to bind url.' );
		$this->assertStringContainsString( 'Custom Source Link', $result, 'Label should be rendered.' );

		unregister_block_bindings_source( 'test/custom-source' );
	}

	/**
	 * Test custom binding source can bind both url and id attributes.
	 *
	 * @covers gutenberg_process_block_bindings
	 */
	public function test_custom_source_binding_url_and_id() {
		$page_id = self::$published_page->ID;

		// Register custom source that returns both url and id.
		register_block_bindings_source(
			'test/policy-pages',
			array(
				'label'              => 'Test Policy Pages',
				'get_value_callback' => function ( $source_args, $block_instance, $attribute_name ) use ( $page_id ) {
					if ( 'url' === $attribute_name ) {
						return get_permalink( $page_id );
					}
					if ( 'id' === $attribute_name ) {
						return $page_id;
					}
					return null;
				},
			)
		);

		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Policy Link","type":"page","kind":"post-type","metadata":{"bindings":{"url":{"source":"test/policy-pages","args":{"key":"privacy"}},"id":{"source":"test/policy-pages","args":{"key":"privacy"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		$this->assertStringContainsString( $expected_url, $result, 'Custom source should bind url.' );
		$this->assertEquals( $page_id, $block->attributes['id'], 'Custom source should bind id attribute.' );

		unregister_block_bindings_source( 'test/policy-pages' );
	}

	/**
	 * Test draft post doesn't render with legacy format (privacy check).
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_legacy_format_draft_post_privacy() {
		$page_id = self::$draft_page->ID;

		// Legacy format with draft post.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Draft Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		// Draft posts should not render for non-authenticated users.
		$this->assertEmpty( trim( $result ), 'Draft post should not render in legacy format.' );
	}

	/**
	 * Test draft post doesn't render with new format (privacy check).
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_new_format_draft_post_privacy() {
		$page_id = self::$draft_page->ID;

		// New format with draft post.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Draft Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link","id":{$page_id},"type":"page"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		// Draft posts should not render for non-authenticated users.
		$this->assertEmpty( trim( $result ), 'Draft post should not render in new format.' );
	}

	/**
	 * Test plain navigation link without binding still works.
	 *
	 * @covers gutenberg_render_block_core_navigation_link
	 */
	public function test_plain_navigation_link_without_binding() {
		$page_id = self::$published_page->ID;
		$url     = get_permalink( $page_id );

		// Plain link with no binding.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Plain Link","type":"page","kind":"post-type","id":{$page_id},"url":"{$url}"} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$this->assertStringContainsString( $url, $result, 'Plain link without binding should still work.' );
		$this->assertStringContainsString( 'Plain Link', $result, 'Label should be rendered.' );
	}

	/**
	 * Test navigation link with missing id attribute and binding.
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_navigation_link_binding_without_block_id_attribute() {
		// Binding present but no id attribute on block (edge case).
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"No ID Link","type":"page","kind":"post-type","metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		// Without an ID, the binding returns null for URL, but block still renders with label (no href).
		// This is consistent with existing navigation link behavior.
		$this->assertStringContainsString( 'No ID Link', $result, 'Navigation link should render label even without URL.' );
		$this->assertStringNotContainsString( 'href=', $result, 'Navigation link without id should not have href attribute.' );
	}

	/**
	 * Test WP 6.9 navigation links continue to work without args in binding.
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_wp_69_links_backward_compatibility() {
		$page_id = self::$published_page->ID;

		// WP 6.9 format navigation link (already tested above, but confirming one more time).
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		$expected_url = get_permalink( $page_id );

		// WP 6.9 format should continue to work.
		$this->assertStringContainsString( $expected_url, $result, 'WP 6.9 format should continue to work.' );
	}

	/**
	 * Test 'id' attribute is in supported attributes for navigation-link.
	 *
	 * @covers gutenberg_get_block_bindings_supported_attributes
	 */
	public function test_id_attribute_supported_for_navigation_link() {
		$supported_attributes = gutenberg_get_block_bindings_supported_attributes( 'core/navigation-link' );

		$this->assertContains( 'url', $supported_attributes, 'url should be supported for navigation-link.' );
		$this->assertContains( 'id', $supported_attributes, 'id should be supported for navigation-link.' );
	}

	/**
	 * Test 'id' attribute is in supported attributes for navigation-submenu.
	 *
	 * @covers gutenberg_get_block_bindings_supported_attributes
	 */
	public function test_id_attribute_supported_for_navigation_submenu() {
		$supported_attributes = gutenberg_get_block_bindings_supported_attributes( 'core/navigation-submenu' );

		$this->assertContains( 'url', $supported_attributes, 'url should be supported for navigation-submenu.' );
		$this->assertContains( 'id', $supported_attributes, 'id should be supported for navigation-submenu.' );
	}

	/**
	 * Test partial args (id without type) falls back to context or attributes.
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_partial_args_id_without_type() {
		$page_id = self::$published_page->ID;

		// Args with id but no type.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Test Link","type":"page","kind":"post-type","id":{$page_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link","id":{$page_id}}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );

		// Should still render because type can be inferred from block attributes or context.
		$result = $block->render();

		$this->assertNotEmpty( trim( $result ), 'Partial args should still work with type fallback.' );
	}

	/**
	 * Test navigation link with deleted entity ID in args.
	 *
	 * @covers gutenberg_block_bindings_post_data_get_value
	 */
	public function test_deleted_entity_in_args() {
		$invalid_id = 99999999;

		// New format with non-existent post ID.
		$block_content = <<<HTML
<!-- wp:navigation-link {"label":"Deleted Link","type":"page","kind":"post-type","id":{$invalid_id},"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link","id":{$invalid_id},"type":"page"}}}}} /-->
HTML;

		$parsed_blocks = parse_blocks( $block_content );
		$block         = new WP_Block( $parsed_blocks[0] );
		$result        = $block->render();

		// Should not render because post doesn't exist.
		$this->assertEmpty( trim( $result ), 'Navigation link with deleted entity should not render.' );
	}
}
