<?php
/**
 * Tests for synced pattern rendering.
 *
 * @package WordPress
 * @subpackage Blocks
 *
 * @todo This should be eventually merged into Core's renderReusable.php test file.
 *
 * @covers ::gutenberg_render_block_core_block
 * @group blocks
 */
class Test_Blocks_RenderReusable extends WP_UnitTestCase {

	/**
	 * Test block ID.
	 *
	 * @var int
	 */
	protected static $block_id;

	public static function wpSetUpBeforeClass( $factory ) {
		register_block_bindings_source(
			'test/block-binding',
			array(
				'label'              => 'My Block Binding',
				'get_value_callback' => function ( $source_args, $block ) {
					return $block->context['my-custom/context'] ?? 'Fallback value provided by block bindings source';
				},
				'uses_context'       => array( 'my-custom/context' ),
			)
		);

		self::$block_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Test Block',
				'post_content' => '<!-- wp:core/paragraph {"metadata":{"bindings":{"content":{"source":"test/block-binding","args":{"key":"ignored"}}}}} --><p>Hello world!</p><!-- /wp:core/paragraph -->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$block_id, true );
		unregister_block_bindings_source( 'test/block-binding' );
	}

	public function set_up() {
		parent::set_up();
		register_block_pattern(
			'test/greeting',
			array(
				'title'   => 'Greeting',
				'content' => '<!-- wp:paragraph {"metadata":{"name":"Greeting","bindings":{"__default":{"source":"core/pattern-overrides"}}}} --><p>Hello from a registered pattern!</p><!-- /wp:paragraph -->',
			)
		);
		register_block_pattern(
			'test/nested',
			array(
				'title'   => 'Nested',
				'content' => '<!-- wp:block {"slug":"test/greeting"} /-->',
			)
		);
	}

	public function tear_down() {
		unregister_block_pattern( 'test/greeting' );
		unregister_block_pattern( 'test/nested' );
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 */
	public function test_render_registered_pattern_by_slug() {
		$output = do_blocks( '<!-- wp:block {"slug":"test/greeting"} /-->' );
		$this->assertSame( '<p class="wp-block-paragraph">Hello from a registered pattern!</p>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 */
	public function test_render_registered_pattern_by_slug_applies_overrides() {
		$output = do_blocks( '<!-- wp:block {"slug":"test/greeting","content":{"Greeting":{"content":"Overridden on this instance"}}} /-->' );
		$this->assertSame( '<p class="wp-block-paragraph">Overridden on this instance</p>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 */
	public function test_render_registered_pattern_nested_in_registered_pattern() {
		$output = do_blocks( '<!-- wp:block {"slug":"test/nested"} /-->' );
		$this->assertSame( '<p class="wp-block-paragraph">Hello from a registered pattern!</p>', $output );
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 * @covers ::gutenberg_block_core_block_get_pattern_customization
	 */
	public function test_render_registered_pattern_uses_edited_copy() {
		$customization_id = self::factory()->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Greeting',
				'post_content' => '<!-- wp:paragraph --><p>Edited copy</p><!-- /wp:paragraph -->',
				'meta_input'   => array( 'wp_pattern_slug' => 'test/greeting' ),
			)
		);

		$this->assertSame( '<p class="wp-block-paragraph">Edited copy</p>', do_blocks( '<!-- wp:block {"slug":"test/greeting"} /-->' ) );

		// Trashing the copy reverts to the registered pattern.
		wp_trash_post( $customization_id );
		$this->assertSame( '<p class="wp-block-paragraph">Hello from a registered pattern!</p>', do_blocks( '<!-- wp:block {"slug":"test/greeting"} /-->' ) );

		wp_delete_post( $customization_id, true );
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 */
	public function test_render_unregistered_slug_renders_nothing() {
		$this->assertSame( '', do_blocks( '<!-- wp:block {"slug":"test/does-not-exist"} /-->' ) );
	}

	/**
	 * @covers ::gutenberg_render_block_core_block
	 */
	public function test_render_ref_wins_over_slug() {
		$block = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array(
					'ref'  => self::$block_id,
					'slug' => 'test/greeting',
				),
			),
			array(
				'my-custom/context' => 'From the post',
			)
		);
		$this->assertSame( '<p class="wp-block-paragraph">From the post</p>', $block->render() );
	}

	/**
	 * @covers ::gutenberg_is_block_pattern_synced
	 */
	public function test_registered_patterns_are_unsynced_by_default() {
		$this->assertFalse( gutenberg_is_block_pattern_synced( array( 'name' => 'test/greeting' ) ) );
		$this->assertFalse(
			gutenberg_is_block_pattern_synced(
				array(
					'name'   => 'test/greeting',
					'source' => 'theme',
				)
			)
		);
		$this->assertFalse(
			gutenberg_is_block_pattern_synced(
				array(
					'name'   => 'test/greeting',
					'synced' => false,
				)
			)
		);
		$this->assertTrue(
			gutenberg_is_block_pattern_synced(
				array(
					'name'   => 'test/greeting',
					'synced' => true,
				)
			)
		);
	}

	/**
	 * @see https://github.com/WordPress/gutenberg/issues/70391
	 */
	public function test_render_respects_custom_context() {
		$synced_pattern_block_instance = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array(
					'ref' => self::$block_id,
				),
			),
			array(
				'my-custom/context' => 'Custom content set from block context',
			)
		);

		$output = $synced_pattern_block_instance->render();
		$this->assertSame( '<p class="wp-block-paragraph">Custom content set from block context</p>', $output );
	}
}
