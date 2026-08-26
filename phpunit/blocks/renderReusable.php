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

	/**
	 * Test block ID for a synced pattern holding a Shortcode block.
	 *
	 * @var int
	 */
	protected static $shortcode_block_id;

	/**
	 * Test block ID for a synced pattern holding an escaped shortcode.
	 *
	 * @var int
	 */
	protected static $escaped_shortcode_block_id;

	/**
	 * Test block ID for a synced pattern holding a dynamic block whose render
	 * output contains shortcode syntax.
	 *
	 * @var int
	 */
	protected static $dynamic_output_block_id;

	/**
	 * Number of times the test shortcode has been expanded.
	 *
	 * @var int
	 */
	protected $shortcode_run_count = 0;

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

		self::$shortcode_block_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Test Shortcode Block',
				'post_content' => '<!-- wp:shortcode -->[gutenberg_test_shortcode]<!-- /wp:shortcode -->',
			)
		);

		self::$escaped_shortcode_block_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Test Escaped Shortcode Block',
				'post_content' => '<!-- wp:shortcode -->[[gutenberg_test_shortcode]]<!-- /wp:shortcode -->',
			)
		);

		self::$dynamic_output_block_id = $factory->post->create(
			array(
				'post_type'    => 'wp_block',
				'post_status'  => 'publish',
				'post_title'   => 'Test Dynamic Output Block',
				'post_content' => '<!-- wp:tests/shortcode-emitter /-->',
			)
		);
	}

	public static function wpTearDownAfterClass() {
		wp_delete_post( self::$block_id, true );
		wp_delete_post( self::$shortcode_block_id, true );
		wp_delete_post( self::$escaped_shortcode_block_id, true );
		wp_delete_post( self::$dynamic_output_block_id, true );
		unregister_block_bindings_source( 'test/block-binding' );
	}

	public function set_up() {
		parent::set_up();

		$this->shortcode_run_count = 0;
		add_shortcode(
			'gutenberg_test_shortcode',
			function () {
				++$this->shortcode_run_count;
				return 'Expanded shortcode';
			}
		);

		register_block_type(
			'tests/shortcode-emitter',
			array(
				'render_callback' => function () {
					return '<p>[gutenberg_test_shortcode]</p>';
				},
			)
		);
	}

	public function tear_down() {
		remove_shortcode( 'gutenberg_test_shortcode' );
		if ( WP_Block_Type_Registry::get_instance()->is_registered( 'tests/shortcode-emitter' ) ) {
			unregister_block_type( 'tests/shortcode-emitter' );
		}
		parent::tear_down();
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

	/**
	 * A synced pattern in a template is rendered outside `the_content`, so nothing
	 * else expands the shortcodes it contains.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68214
	 */
	public function test_render_expands_shortcodes_outside_the_content() {
		$synced_pattern_block_instance = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array(
					'ref' => self::$shortcode_block_id,
				),
			)
		);

		$output = $synced_pattern_block_instance->render();

		$this->assertStringContainsString( 'Expanded shortcode', $output );
		$this->assertStringNotContainsString( '[gutenberg_test_shortcode]', $output );
		$this->assertSame( 1, $this->shortcode_run_count, 'The shortcode should be expanded exactly once.' );
	}

	/**
	 * `the_content` expands shortcodes on behalf of every block in the post, so a
	 * synced pattern rendered inside it must leave them alone.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68214
	 */
	public function test_render_defers_to_the_content_for_shortcodes() {
		$output = apply_filters(
			'the_content',
			'<!-- wp:block {"ref":' . self::$shortcode_block_id . '} /-->'
		);

		$this->assertStringContainsString( 'Expanded shortcode', $output );
		$this->assertStringNotContainsString( '[gutenberg_test_shortcode]', $output );
		$this->assertSame( 1, $this->shortcode_run_count, 'The shortcode should be expanded exactly once.' );
	}

	/**
	 * Patterns rendered inside `widget_block_content` must leave shortcodes to
	 * that filter's own `do_shortcode` pass, like `the_content`.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68214
	 */
	public function test_render_defers_to_widget_block_content_for_shortcodes() {
		$output = apply_filters(
			'widget_block_content',
			'<!-- wp:block {"ref":' . self::$shortcode_block_id . '} /-->'
		);

		$this->assertStringContainsString( 'Expanded shortcode', $output );
		$this->assertStringNotContainsString( '[gutenberg_test_shortcode]', $output );
		$this->assertSame( 1, $this->shortcode_run_count, 'The shortcode should be expanded exactly once.' );
	}

	/**
	 * An escaped shortcode gets exactly one unescape pass, leaving a literal
	 * shortcode on the page, in every rendering pipeline.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68214
	 */
	public function test_render_unescapes_escaped_shortcodes_once() {
		$synced_pattern_block_instance = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array(
					'ref' => self::$escaped_shortcode_block_id,
				),
			)
		);

		$output = $synced_pattern_block_instance->render();

		$this->assertStringContainsString( '[gutenberg_test_shortcode]', $output, 'The escaped shortcode should be unescaped to a literal shortcode.' );
		$this->assertStringNotContainsString( '[[', $output, 'The escaping brackets should be consumed.' );
		$this->assertSame( 0, $this->shortcode_run_count, 'The escaped shortcode should not be expanded.' );

		$output = apply_filters(
			'the_content',
			'<!-- wp:block {"ref":' . self::$escaped_shortcode_block_id . '} /-->'
		);

		$this->assertStringContainsString( '[gutenberg_test_shortcode]', $output, 'The escaped shortcode should survive the_content as a literal shortcode.' );
		$this->assertSame( 0, $this->shortcode_run_count, 'The escaped shortcode should not be expanded inside the_content.' );
	}

	/**
	 * Shortcode expansion is limited to the pattern's saved markup. Content that
	 * dynamic blocks inject during rendering (comment text, post content, pattern
	 * overrides) is not trusted shortcode input, so it must never be expanded.
	 *
	 * @see https://github.com/WordPress/gutenberg/issues/68214
	 */
	public function test_render_does_not_expand_shortcodes_in_dynamic_block_output() {
		$synced_pattern_block_instance = new WP_Block(
			array(
				'blockName' => 'core/block',
				'attrs'     => array(
					'ref' => self::$dynamic_output_block_id,
				),
			)
		);

		$output = $synced_pattern_block_instance->render();

		$this->assertStringContainsString( '[gutenberg_test_shortcode]', $output, 'Shortcodes in dynamic block output should not be expanded.' );
		$this->assertSame( 0, $this->shortcode_run_count, 'The shortcode should not run for dynamic block output.' );
	}
}
