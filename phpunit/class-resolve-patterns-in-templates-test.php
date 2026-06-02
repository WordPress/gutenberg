<?php
/**
 * Tests for pattern block resolution in templates via REST API.
 *
 * @package gutenberg
 *
 * @group rest-api
 * @covers ::gutenberg_parse_pattern_blocks_in_block_template
 * @covers ::gutenberg_parse_pattern_blocks_in_block_templates
 */
class Tests_Resolve_Patterns_In_Templates extends WP_Test_REST_Controller_Testcase {

	/**
	 * @var int
	 */
	protected static $admin_id;

	/**
	 * Set up before class.
	 *
	 * @param WP_UnitTest_Factory $factory Helper that lets us create fake data.
	 */
	public static function wpSetupBeforeClass( $factory ) {
		self::$admin_id = $factory->user->create(
			array(
				'role' => 'administrator',
			)
		);
	}

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		// Register test patterns.
		register_block_pattern(
			'test/single-root',
			array(
				'title'       => 'Single Root Pattern',
				'content'     => '<!-- wp:paragraph -->Single root content<!-- /wp:paragraph -->',
				'description' => 'A single root pattern.',
				'categories'  => array( 'text' ),
			)
		);

		register_block_pattern(
			'test/nested-pattern',
			array(
				'title'       => 'Nested Pattern',
				'content'     => '<!-- wp:group --><!-- wp:paragraph -->Nested content<!-- /wp:paragraph --><!-- wp:pattern {"slug":"test/single-root"} /--><!-- /wp:group -->',
				'description' => 'A nested pattern.',
				'categories'  => array( 'featured' ),
			)
		);

		register_block_pattern(
			'test/multiple-blocks',
			array(
				'title'       => 'Multiple Blocks Pattern',
				'content'     => '<!-- wp:paragraph -->First paragraph<!-- /wp:paragraph --><!-- wp:paragraph -->Second paragraph<!-- /wp:paragraph -->',
				'description' => 'A pattern with multiple blocks.',
			)
		);

		// Switch to a block theme for template support.
		switch_theme( 'emptytheme' );
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		unregister_block_pattern( 'test/single-root' );
		unregister_block_pattern( 'test/nested-pattern' );
		unregister_block_pattern( 'test/multiple-blocks' );

		// Clean up registered templates.
		$templates = get_block_templates( array(), 'wp_template' );
		foreach ( $templates as $template ) {
			if ( isset( $template->wp_id ) && $template->wp_id ) {
				wp_delete_post( $template->wp_id, true );
			}
		}

		parent::tear_down();
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_register_routes() {
		// We are testing filters, not controller routes.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_context_param() {
		// We are testing filters, not controller context.
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_items() {
		// We are testing filters, not controller get_items().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item() {
		// We are testing filters, not controller get_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_create_item() {
		// We are testing filters, not controller create_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_update_item() {
		// We are testing filters, not controller update_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_delete_item() {
		// We are testing filters, not controller delete_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_prepare_item() {
		// We are testing filters, not controller prepare_item().
	}

	/**
	 * @doesNotPerformAssertions
	 */
	public function test_get_item_schema() {
		// We are testing filters, not controller schema.
	}

	/**
	 * Test that pattern blocks are resolved when fetching a single template via REST API.
	 */
	public function test_get_template_resolves_pattern_blocks() {
		wp_set_current_user( self::$admin_id );

		// Register a template with a pattern block.
		$template_name = 'test-plugin//test-template-with-pattern';
		register_block_template(
			$template_name,
			array(
				'title'   => 'Test Template With Pattern',
				'content' => '<!-- wp:paragraph -->Before pattern<!-- /wp:paragraph --><!-- wp:pattern {"slug":"test/single-root"} /--><!-- wp:paragraph -->After pattern<!-- /wp:paragraph -->',
			)
		);

		// Get template via REST API (use theme slug format for registered templates).
		$current_theme = get_stylesheet();
		$request       = new WP_REST_Request( 'GET', '/wp/v2/templates/' . $current_theme . '//test-template-with-pattern' );
		$response      = rest_get_server()->dispatch( $request );
		$data          = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertArrayHasKey( 'content', $data );

		// Verify pattern block is resolved.
		$blocks = parse_blocks( $data['content']['raw'] );
		$this->assertNotEmpty( $blocks );
		$this->assertGreaterThanOrEqual( 3, count( $blocks ), 'Template should have at least 3 blocks after pattern resolution.' );

		// Block structure after resolution:
		// blocks[0] = "Before pattern" paragraph
		// blocks[1] = Resolved pattern content (single paragraph with metadata)
		// blocks[2] = "After pattern" paragraph

		// Verify the resolved pattern block (should be at index 1).
		$resolved_block = $blocks[1];
		$this->assertSame( 'core/paragraph', $resolved_block['blockName'], 'Resolved pattern should be a paragraph block.' );
		$this->assertStringContainsString( 'Single root content', $resolved_block['innerHTML'] ?? '', 'Resolved pattern should contain expected content.' );

		// Verify metadata is present on single-root pattern.
		$this->assertArrayHasKey( 'metadata', $resolved_block['attrs'], 'Resolved pattern block should have metadata.' );
		$metadata = $resolved_block['attrs']['metadata'];
		$this->assertSame( 'test/single-root', $metadata['patternName'], 'Pattern name should match.' );
		$this->assertArrayHasKey( 'name', $metadata, 'Pattern name should be in metadata.' );
		$this->assertArrayHasKey( 'description', $metadata, 'Pattern description should be in metadata.' );
		$this->assertArrayHasKey( 'categories', $metadata, 'Pattern categories should be in metadata.' );
		$this->assertSame( 'Single Root Pattern', $metadata['name'], 'Pattern name should match.' );
		$this->assertSame( 'A single root pattern.', $metadata['description'], 'Pattern description should match.' );
		$this->assertSame( array( 'text' ), $metadata['categories'], 'Pattern categories should match.' );

		// Verify no pattern blocks remain.
		foreach ( $blocks as $block ) {
			$this->assertNotSame( 'core/pattern', $block['blockName'], 'Pattern block should be resolved and not present in the content.' );
		}

		unregister_block_template( $template_name );
	}

	/**
	 * Test that pattern blocks are resolved when fetching multiple templates via REST API.
	 */
	public function test_get_templates_resolves_pattern_blocks() {
		wp_set_current_user( self::$admin_id );

		// Register templates with pattern blocks.
		$template_name_1 = 'test-plugin//test-template-1';
		register_block_template(
			$template_name_1,
			array(
				'title'   => 'Test Template 1',
				'content' => '<!-- wp:pattern {"slug":"test/single-root"} /-->',
			)
		);

		$template_name_2 = 'test-plugin//test-template-2';
		register_block_template(
			$template_name_2,
			array(
				'title'   => 'Test Template 2',
				'content' => '<!-- wp:pattern {"slug":"test/multiple-blocks"} /-->',
			)
		);

		// Get templates via REST API.
		$request  = new WP_REST_Request( 'GET', '/wp/v2/templates' );
		$response = rest_get_server()->dispatch( $request );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertIsArray( $data );

		// Find our test templates by slug (REST API may normalize IDs to theme slug format).
		$template_1 = null;
		$template_2 = null;
		foreach ( $data as $template ) {
			if ( isset( $template['slug'] ) && 'test-template-1' === $template['slug'] ) {
				$template_1 = $template;
			}
			if ( isset( $template['slug'] ) && 'test-template-2' === $template['slug'] ) {
				$template_2 = $template;
			}
		}

		$this->assertNotNull( $template_1, 'Template 1 should be found. Available template IDs: ' . implode( ', ', wp_list_pluck( $data, 'id' ) ) );
		$this->assertNotNull( $template_2, 'Template 2 should be found. Available template IDs: ' . implode( ', ', wp_list_pluck( $data, 'id' ) ) );

		// Verify pattern blocks are resolved in template 1.
		$blocks = parse_blocks( $template_1['content']['raw'] );
		$this->assertNotEmpty( $blocks, 'Template 1 should have at least one block after pattern resolution.' );

		// Block structure after resolution:
		// blocks[0] = Resolved pattern content (single paragraph with metadata)

		// Verify the resolved pattern block (should be at index 0).
		$resolved_block = $blocks[0];
		$this->assertSame( 'core/paragraph', $resolved_block['blockName'], 'Resolved pattern should be a paragraph block.' );

		// Verify metadata is present on single-root pattern.
		$this->assertArrayHasKey( 'metadata', $resolved_block['attrs'], 'Resolved pattern block should have metadata.' );
		$metadata = $resolved_block['attrs']['metadata'];
		$this->assertSame( 'test/single-root', $metadata['patternName'], 'Pattern name should match.' );
		$this->assertArrayHasKey( 'name', $metadata, 'Pattern name should be in metadata.' );
		$this->assertArrayHasKey( 'description', $metadata, 'Pattern description should be in metadata.' );
		$this->assertArrayHasKey( 'categories', $metadata, 'Pattern categories should be in metadata.' );

		// Verify no pattern blocks remain.
		foreach ( $blocks as $block ) {
			$this->assertNotSame( 'core/pattern', $block['blockName'], 'Pattern block should be resolved in template 1.' );
		}

		// Verify pattern blocks are resolved in template 2.
		$blocks            = parse_blocks( $template_2['content']['raw'] );
		$has_pattern_block = false;
		$paragraph_count   = 0;
		foreach ( $blocks as $block ) {
			if ( 'core/pattern' === $block['blockName'] ) {
				$has_pattern_block = true;
			}
			if ( 'core/paragraph' === $block['blockName'] ) {
				++$paragraph_count;
			}
		}
		$this->assertFalse( $has_pattern_block, 'Pattern block should be resolved in template 2.' );
		$this->assertGreaterThanOrEqual( 2, $paragraph_count, 'Template 2 should have resolved pattern content with multiple blocks.' );

		unregister_block_template( $template_name_1 );
		unregister_block_template( $template_name_2 );
	}
}
