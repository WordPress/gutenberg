<?php
/**
 * Pattern-backed PHP-only block rendering tests.
 *
 * @package WordPress
 * @subpackage Blocks
 */

/**
 * Tests for pattern-backed PHP-only block registration.
 *
 * @group blocks
 *
 * @covers ::gutenberg_apply_pattern_block_rendering
 */
class Tests_Blocks_Pattern_Block_Rendering extends WP_UnitTestCase {

	const BLOCK_NAME = 'tests/pattern-block';

	const EMBED_HANDLER = 'tests-pattern-block-embed';

	const PATTERN = '<!-- wp:heading {"metadata":{"name":"Title","bindings":{"__default":{"source":"core/pattern-overrides"}}}} --><h2 class="wp-block-heading">Default title</h2><!-- /wp:heading -->'
		. '<!-- wp:paragraph --><p>Plugin-owned paragraph.</p><!-- /wp:paragraph -->';

	public function tear_down() {
		foreach ( array( self::BLOCK_NAME, 'tests/side-effect-block' ) as $block_name ) {
			if ( WP_Block_Type_Registry::get_instance()->is_registered( $block_name ) ) {
				unregister_block_type( $block_name );
			}
		}
		wp_embed_unregister_handler( self::EMBED_HANDLER );
		WP_Theme_JSON_Resolver::clean_cached_data();
		parent::tear_down();
	}

	/**
	 * Registers the test pattern block.
	 *
	 * @param array $extra_args Extra `register_block_type()` args.
	 */
	private function register_pattern_block( $extra_args = array() ) {
		register_block_type(
			self::BLOCK_NAME,
			array_merge(
				array(
					'supports' => array( 'autoRegister' => true ),
					'pattern'  => self::PATTERN,
				),
				$extra_args
			)
		);
	}

	public function test_renders_the_pattern_inside_the_block_wrapper() {
		$this->register_pattern_block();

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );

		$this->assertStringContainsString( 'Default title', $output );
		$this->assertStringContainsString( 'Plugin-owned paragraph.', $output );
		$this->assertStringContainsString( 'wp-block-tests-pattern-block', $output );
	}

	public function test_renders_instance_overrides_for_bound_fields() {
		$this->register_pattern_block();

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' {"content":{"Title":{"content":"Overridden title"}}} /-->' );

		$this->assertStringContainsString( 'Overridden title', $output );
		$this->assertStringNotContainsString( 'Default title', $output );
		$this->assertStringContainsString( 'Plugin-owned paragraph.', $output );
	}

	public function test_ignores_saved_inner_content() {
		$calls = 0;
		register_block_type(
			'tests/side-effect-block',
			array(
				'render_callback' => static function () use ( &$calls ) {
					++$calls;
					return '<p>SIDE EFFECT OUTPUT</p>';
				},
			)
		);
		$this->register_pattern_block();

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' --><p>INJECTED</p><!-- wp:tests/side-effect-block /--><!-- /wp:' . self::BLOCK_NAME . ' -->' );

		$this->assertSame( 0, $calls, 'Saved inner blocks must not render before the pattern callback.' );
		$this->assertStringNotContainsString( 'INJECTED', $output );
		$this->assertStringNotContainsString( 'SIDE EFFECT OUTPUT', $output );
		$this->assertStringContainsString( 'Plugin-owned paragraph.', $output );
	}

	public function test_registering_a_render_callback_with_a_pattern_raises_a_notice_and_is_ignored() {
		$this->setExpectedIncorrectUsage( 'register_block_type' );

		$this->register_pattern_block(
			array(
				'render_callback' => static function () {
					return '<p>CALLBACK OUTPUT</p>';
				},
			)
		);

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );

		$this->assertStringNotContainsString( 'CALLBACK OUTPUT', $output );
		$this->assertStringContainsString( 'Plugin-owned paragraph.', $output );
	}

	public function test_replaces_an_author_declared_content_attribute() {
		$this->register_pattern_block(
			array(
				'attributes' => array(
					'content' => array( 'type' => 'string' ),
				),
			)
		);

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' {"content":{"Title":{"content":"Overridden title"}}} /-->' );

		// The override is dropped if the string schema survives registration.
		$this->assertStringContainsString( 'Overridden title', $output );
	}

	public function test_renders_the_pattern_current_at_render_time() {
		$this->register_pattern_block();

		WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME )->pattern =
			'<!-- wp:paragraph --><p>Replaced pattern.</p><!-- /wp:paragraph -->';

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );

		$this->assertStringContainsString( 'Replaced pattern.', $output );
		$this->assertStringNotContainsString( 'Default title', $output );
	}

	public function test_renders_embeds_from_the_registered_pattern() {
		wp_embed_register_handler(
			self::EMBED_HANDLER,
			'#^https://example\.com/embed/(auto|shortcode)$#',
			static function ( $matches ) {
				return '<p>EMBEDDED ' . strtoupper( $matches[1] ) . '</p>';
			}
		);

		$pattern = '<!-- wp:embed {"url":"https://example.com/embed/auto"} -->'
			. "\n<figure class=\"wp-block-embed\"><div class=\"wp-block-embed__wrapper\">\n"
			. "https://example.com/embed/auto\n"
			. "</div></figure>\n"
			. '<!-- /wp:embed -->'
			. '<!-- wp:shortcode -->[embed]https://example.com/embed/shortcode[/embed]<!-- /wp:shortcode -->';
		$this->register_pattern_block( array( 'pattern' => $pattern ) );

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );

		$this->assertStringContainsString( 'EMBEDDED AUTO', $output );
		$this->assertStringContainsString( 'EMBEDDED SHORTCODE', $output );
		$this->assertStringNotContainsString( 'https://example.com/embed/', $output );
	}

	public function test_applies_the_host_render_block_filters_once() {
		$this->register_pattern_block();

		$filter_calls = 0;
		$count_calls  = static function ( $block_content ) use ( &$filter_calls ) {
			++$filter_calls;
			return $block_content;
		};
		add_filter( 'render_block_' . self::BLOCK_NAME, $count_calls );

		do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );
		remove_filter( 'render_block_' . self::BLOCK_NAME, $count_calls );

		$this->assertSame( 1, $filter_calls );
	}

	public function test_applies_the_per_child_render_filters_to_pattern_roots() {
		$this->register_pattern_block();

		$roots_seen = array();
		$collect    = static function ( $pre_render, $parsed_block, $parent_block ) use ( &$roots_seen ) {
			if ( $parent_block instanceof WP_Block && self::BLOCK_NAME === $parent_block->name ) {
				$roots_seen[] = $parsed_block['blockName'];
			}
			return $pre_render;
		};
		add_filter( 'pre_render_block', $collect, 10, 3 );

		do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );
		remove_filter( 'pre_render_block', $collect );

		$this->assertSame( array( 'core/heading', 'core/paragraph' ), $roots_seen );
	}

	public function test_renders_a_self_referencing_pattern_without_recursing() {
		register_block_type(
			self::BLOCK_NAME,
			array(
				'supports' => array( 'autoRegister' => true ),
				'pattern'  => '<!-- wp:paragraph --><p>Outer content.</p><!-- /wp:paragraph -->'
					. '<!-- wp:' . self::BLOCK_NAME . ' /-->',
			)
		);

		$output = do_blocks( '<!-- wp:' . self::BLOCK_NAME . ' /-->' );

		$this->assertSame( 1, substr_count( $output, 'Outer content.' ) );
	}
}
