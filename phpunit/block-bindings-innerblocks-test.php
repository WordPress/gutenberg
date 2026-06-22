<?php
/**
 * Tests for the Block Bindings inner-blocks substitution on `render_block_data`.
 *
 * @package gutenberg
 */
class Tests_Block_Bindings_InnerBlocks extends WP_UnitTestCase {

	const SOURCE_NAME         = 'test/inner-blocks-source';
	const CONTEXT_SOURCE_NAME = 'test/inner-blocks-context-source';

	/**
	 * Registers the block types used to host and provide context for bound inner blocks.
	 */
	public static function wpSetUpBeforeClass() {
		/*
		 * A generic container block whose render callback renders its inner blocks.
		 * It mirrors a locally-controlled container that can carry an
		 * `innerBlocks` binding.
		 */
		register_block_type(
			'test/container',
			array(
				'render_callback' => static function ( $attributes, $content ) {
					return '<div class="test-container">' . $content . '</div>';
				},
			)
		);

		/*
		 * A static container block with NO render callback whose chrome lives in
		 * its `innerContent` template (its `<div>` wrapper), mirroring blocks like
		 * `core/group` / `core/list-item`. Used to prove the substitution preserves
		 * the host's own static markup around the substituted inner blocks rather
		 * than discarding it.
		 */
		register_block_type(
			'test/static-container',
			array()
		);

		/*
		 * A provider block that mirrors `core/block`: it provides the
		 * `pattern/overrides` context from its `content` attribute and renders
		 * its inner blocks. Used to verify that the filter passes inherited
		 * context to source callbacks.
		 */
		register_block_type(
			'test/provider',
			array(
				'attributes'       => array(
					'content' => array(
						'type'    => 'object',
						'default' => array(),
					),
				),
				'provides_context' => array(
					'pattern/overrides' => 'content',
				),
				'render_callback'  => static function ( $attributes, $content ) {
					return '<div class="test-provider">' . $content . '</div>';
				},
			)
		);

		/*
		 * A provider block that supplies the `postId` context from an attribute,
		 * mirroring Query Loop's per-post context. Used to verify the recursion
		 * guard keys on the context a source declares it consumes.
		 */
		register_block_type(
			'test/post-provider',
			array(
				'attributes'       => array(
					'postId' => array(
						'type' => 'number',
					),
				),
				'provides_context' => array(
					'postId' => 'postId',
				),
				'render_callback'  => static function ( $attributes, $content ) {
					return $content;
				},
			)
		);
	}

	/**
	 * Cleans up any block bindings sources registered during a test.
	 */
	public function tear_down() {
		foreach ( get_all_registered_block_bindings_sources() as $source_name => $source_properties ) {
			if ( str_starts_with( $source_name, 'test/' ) ) {
				unregister_block_bindings_source( $source_name );
			}
		}

		parent::tear_down();
	}

	/**
	 * Unregisters the shared block types.
	 */
	public static function wpTearDownAfterClass() {
		unregister_block_type( 'test/container' );
		unregister_block_type( 'test/static-container' );
		unregister_block_type( 'test/provider' );
		unregister_block_type( 'test/post-provider' );
	}

	/**
	 * Registers a context-free inner-blocks source returning the given value.
	 *
	 * @param mixed $source_value The value the source returns for the `innerBlocks` attribute.
	 */
	private function register_inner_blocks_source( $source_value ) {
		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => 'Inner blocks test source',
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) use ( $source_value ) {
					if ( 'innerBlocks' === $attribute_name ) {
						return $source_value;
					}
					return null;
				},
			)
		);
	}

	/**
	 * Builds a `test/container` block bound to the inner-blocks source.
	 *
	 * @param string $fallback_inner The serialized fallback inner blocks markup.
	 * @return array The parsed block.
	 */
	private function bound_container_parsed_block( $fallback_inner = '<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' ) {
		$markup = '<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			$fallback_inner .
			'<!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );
		return $parsed[0];
	}

	/**
	 * A source-supplied serialized string is parsed and rendered, replacing the
	 * block's own serialized fallback children.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_string_value_substitutes_and_renders_inner_blocks() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted child</p><!-- /wp:paragraph -->'
		);

		$parsed = $this->bound_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringContainsString(
			'Substituted child',
			$result,
			'The source-supplied inner block should be rendered.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'The serialized fallback children must not be rendered when a value is supplied.'
		);
		$this->assertSame(
			1,
			substr_count( $result, 'Substituted child' ),
			'The substituted child must be rendered exactly once (no double-render).'
		);
	}

	/**
	 * A `null` value is treated as absence; the block's own serialized children
	 * render as a fallback.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_null_value_renders_serialized_fallback() {
		$this->register_inner_blocks_source( null );

		$parsed = $this->bound_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringContainsString(
			'Fallback',
			$result,
			'The serialized fallback children should render when the source returns null.'
		);
	}

	/**
	 * An empty string is treated as an intentionally-empty area; no inner blocks
	 * render and the serialized fallback is not used.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_empty_string_renders_empty_area() {
		$this->register_inner_blocks_source( '' );

		$parsed = $this->bound_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'An empty string value must not render the serialized fallback children.'
		);
		$this->assertSame(
			'<div class="test-container"></div>',
			trim( $result ),
			'An empty string value should render an empty inner-blocks area.'
		);
	}

	/**
	 * A substituted inner block that itself carries a binding resolves
	 * recursively when Core re-renders the rebuilt inner blocks.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_substituted_inner_block_with_binding_resolves_recursively() {
		// Source for the inner paragraph's `content` attribute.
		register_block_bindings_source(
			'test/recursive-content',
			array(
				'label'              => 'Recursive content source',
				'get_value_callback' => static function () {
					return 'Recursive value';
				},
			)
		);

		// The outer container's inner-blocks source returns a paragraph that is
		// itself bound to the recursive content source.
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"test/recursive-content"}}}} --><p>placeholder</p><!-- /wp:paragraph -->'
		);

		$parsed = $this->bound_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringContainsString(
			'Recursive value',
			$result,
			'A binding on a substituted inner block should resolve recursively.'
		);
		$this->assertStringNotContainsString(
			'placeholder',
			$result,
			'The substituted inner block binding should replace its placeholder content.'
		);
	}

	/**
	 * A bound block that is the direct child of a context provider resolves its
	 * override value via inherited context and renders the overridden inner blocks
	 * instead of the fallback.
	 *
	 * This proves the filter surfaces `pattern/overrides` from inherited
	 * available context, not from `$parent_block->context`.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_nested_context_dependent_source_resolves_override() {
		$block_name        = 'Overridable Group';
		$override_markup   = '<!-- wp:paragraph --><p>Overridden child</p><!-- /wp:paragraph -->';
		$attributes_seen   = array();
		$context_value_set = array(
			$block_name => array(
				'innerBlocks' => $override_markup,
			),
		);

		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Context-dependent inner blocks source',
				'uses_context'       => array( 'pattern/overrides' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) use ( &$attributes_seen ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}
					// Record that metadata.name was populated on the transient instance.
					$attributes_seen['metadata_name'] = $block_instance->attributes['metadata']['name'] ?? null;

					$metadata_name = $block_instance->attributes['metadata']['name'] ?? null;
					if ( null === $metadata_name ) {
						return null;
					}
					return $block_instance->context['pattern/overrides'][ $metadata_name ]['innerBlocks'] ?? null;
				},
			)
		);

		// The bound container sits directly inside the provider block.
		$inner_container = '<!-- wp:test/container {"metadata":{"name":"' . $block_name . '","bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} --><!-- wp:paragraph --><p>Group fallback</p><!-- /wp:paragraph --><!-- /wp:test/container -->';

		$provider_markup = '<!-- wp:test/provider ' . wp_json_encode( array( 'content' => $context_value_set ) ) . ' -->' .
			$inner_container .
			'<!-- /wp:test/provider -->';

		$parsed = parse_blocks( $provider_markup );
		$result = render_block( $parsed[0] );

		$this->assertStringContainsString(
			'Overridden child',
			$result,
			'The override value must resolve and render on the frontend via inherited context.'
		);
		$this->assertStringNotContainsString(
			'Group fallback',
			$result,
			'The bound container fallback must not render when the override resolves.'
		);
		$this->assertSame(
			$block_name,
			$attributes_seen['metadata_name'],
			'The transient block instance must expose metadata.name to the source.'
		);
	}

	/**
	 * A context-dependent source must still resolve when the provider is above
	 * an intermediate block that neither uses nor provides that context.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_context_dependent_source_resolves_through_intermediate_block() {
		$block_name      = 'Nested Overridable Group';
		$override_markup = '<!-- wp:paragraph --><p>Deep overridden child</p><!-- /wp:paragraph -->';

		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Context-dependent inner blocks source',
				'uses_context'       => array( 'pattern/overrides' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}

					$metadata_name = $block_instance->attributes['metadata']['name'] ?? null;
					return $block_instance->context['pattern/overrides'][ $metadata_name ]['innerBlocks'] ?? null;
				},
			)
		);

		$bound_container = '<!-- wp:test/container {"metadata":{"name":"' . $block_name . '","bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} --><!-- wp:paragraph --><p>Deep fallback</p><!-- /wp:paragraph --><!-- /wp:test/container -->';

		$wrapper_markup = '<!-- wp:test/container -->' .
			$bound_container .
			'<!-- /wp:test/container -->';

		$provider_markup = '<!-- wp:test/provider ' . wp_json_encode(
			array(
				'content' => array(
					$block_name => array(
						'innerBlocks' => $override_markup,
					),
				),
			)
		) . ' -->' .
			$wrapper_markup .
			'<!-- /wp:test/provider -->';

		$parsed = parse_blocks( $provider_markup );
		$result = render_block( $parsed[0] );

		$this->assertStringContainsString(
			'Deep overridden child',
			$result,
			'The source should receive inherited context through the intermediate block.'
		);
		$this->assertStringNotContainsString(
			'Deep fallback',
			$result,
			'The fallback must not render when the inherited context resolves.'
		);
	}

	/**
	 * Top-level (`$parent_block === null`), args-only source: substitution works
	 * with no fatal when the bound block is rendered directly.
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_top_level_context_free_source_substitutes() {
		register_block_bindings_source(
			self::SOURCE_NAME,
			array(
				'label'              => 'Args-only inner blocks source',
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' === $attribute_name && isset( $source_args['markup'] ) ) {
						return $source_args['markup'];
					}
					return null;
				},
			)
		);

		$markup = '<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '","args":{"markup":"<!-- wp:paragraph --><p>Top level child</p><!-- /wp:paragraph -->"}}}}} --><!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph --><!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );
		$result = render_block( $parsed[0] );

		$this->assertStringContainsString(
			'Top level child',
			$result,
			'An args-only source should resolve at the top level.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'The fallback must not render when an args-only source resolves at the top level.'
		);
	}

	/**
	 * Top-level (`$parent_block === null`), context-dependent source: returns
	 * `null` because no ancestry context is available, the filter falls through to
	 * the serialized fallback, and no PHP error/warning is raised (no null
	 * dereference of `$parent_block`).
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_top_level_context_dependent_source_falls_back_without_error() {
		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Context-dependent inner blocks source',
				'uses_context'       => array( 'pattern/overrides' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}
					$metadata_name = $block_instance->attributes['metadata']['name'] ?? null;
					if ( null === $metadata_name ) {
						return null;
					}
					return $block_instance->context['pattern/overrides'][ $metadata_name ]['innerBlocks'] ?? null;
				},
			)
		);

		$markup = '<!-- wp:test/container {"metadata":{"name":"Top Level Group","bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} --><!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph --><!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );

		// Promote PHP errors/warnings/notices to exceptions for this render.
		$caught        = null;
		$error_handler = static function ( $errno, $errstr ) use ( &$caught ) {
			$caught = $errstr;
			return true;
		};
		set_error_handler( $error_handler );
		try {
			$result = render_block( $parsed[0] );
		} finally {
			restore_error_handler();
		}

		$this->assertNull(
			$caught,
			'Rendering a top-level context-dependent bound block must not raise a PHP error/warning.'
		);
		$this->assertStringContainsString(
			'Fallback',
			$result,
			'A context-dependent source that cannot resolve at the top level must fall back to the serialized children.'
		);
	}

	/**
	 * Builds a `test/static-container` block bound to the inner-blocks source.
	 *
	 * The host has NO render callback; its `<div>` wrapper lives in the
	 * `innerContent` template, so its rendered chrome comes from the host's own
	 * static chunks rather than from a callback.
	 *
	 * @param string $fallback_inner The serialized fallback inner blocks markup.
	 * @return array The parsed block.
	 */
	private function bound_static_container_parsed_block( $fallback_inner = '<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' ) {
		$markup = '<!-- wp:test/static-container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<div class="static-wrapper">' . $fallback_inner . '</div>' .
			'<!-- /wp:test/static-container -->';
		$parsed = parse_blocks( $markup );
		return $parsed[0];
	}

	/**
	 * A static host whose wrapper lives in `innerContent` keeps that wrapper
	 * around the substituted children instead of discarding it.
	 *
	 * @covers ::gutenberg_block_bindings_rebuild_inner_content
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_static_host_preserves_wrapper_around_substituted_children() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted child</p><!-- /wp:paragraph -->'
		);

		$parsed = $this->bound_static_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringContainsString(
			'<div class="static-wrapper">',
			$result,
			'The host block static wrapper must be preserved around the substituted children.'
		);
		$this->assertStringContainsString(
			'Substituted child',
			$result,
			'The source-supplied inner block should be rendered.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'The serialized fallback children must not be rendered when a value is supplied.'
		);
		// The substituted child must sit INSIDE the preserved wrapper.
		$this->assertMatchesRegularExpression(
			'#<div class="static-wrapper">.*Substituted child.*</div>#s',
			trim( $result ),
			'The substituted child must render inside the host wrapper, not replace it.'
		);
	}

	/**
	 * A static host with no fallback children still keeps source-supplied
	 * children inside its closed wrapper.
	 *
	 * @covers ::gutenberg_block_bindings_rebuild_inner_content
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_static_host_without_fallback_children_inserts_substituted_children_inside_wrapper() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted child</p><!-- /wp:paragraph -->'
		);

		$parsed = $this->bound_static_container_parsed_block( '' );
		$result = render_block( $parsed );

		$this->assertMatchesRegularExpression(
			'#^<div class="static-wrapper"><p[^>]*>Substituted child</p></div>$#',
			trim( $result ),
			'The substituted child must render inside the closed host wrapper.'
		);
	}

	/**
	 * A static host with more substituted children than the original keeps a
	 * single surrounding wrapper with one `null` slot per new child.
	 *
	 * @covers ::gutenberg_block_bindings_rebuild_inner_content
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_static_host_wrapper_preserved_when_child_count_changes() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>First</p><!-- /wp:paragraph -->' .
			'<!-- wp:paragraph --><p>Second</p><!-- /wp:paragraph -->' .
			'<!-- wp:paragraph --><p>Third</p><!-- /wp:paragraph -->'
		);

		// Original host has a single child; the source supplies three.
		$parsed = $this->bound_static_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertSame(
			1,
			substr_count( $result, '<div class="static-wrapper">' ),
			'The host opening wrapper chunk must appear exactly once.'
		);
		$this->assertSame(
			1,
			substr_count( $result, '</div>' ),
			'The host closing wrapper chunk must appear exactly once.'
		);
		foreach ( array( 'First', 'Second', 'Third' ) as $child ) {
			$this->assertStringContainsString(
				$child,
				$result,
				"The substituted child '$child' should render inside the wrapper."
			);
		}
		$this->assertMatchesRegularExpression(
			'#<div class="static-wrapper">.*First.*Second.*Third.*</div>#s',
			trim( $result ),
			'All substituted children must render inside the single preserved wrapper, in order.'
		);
	}

	/**
	 * An empty-string source on a static host keeps the host's wrapper but
	 * renders no children inside it.
	 *
	 * @covers ::gutenberg_block_bindings_rebuild_inner_content
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_static_host_empty_string_keeps_empty_wrapper() {
		$this->register_inner_blocks_source( '' );

		$parsed = $this->bound_static_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertSame(
			'<div class="static-wrapper"></div>',
			trim( $result ),
			'An empty string value should keep the host wrapper and render it empty.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'An empty string value must not render the serialized fallback children.'
		);
	}

	/**
	 * Absence (`null`) on a static host leaves the parsed block untouched, so the
	 * host's own serialized children render inside the wrapper.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_static_host_null_value_renders_serialized_fallback() {
		$this->register_inner_blocks_source( null );

		$parsed = $this->bound_static_container_parsed_block();
		$result = render_block( $parsed );

		$this->assertStringContainsString(
			'<div class="static-wrapper">',
			$result,
			'The host wrapper should still render on the fallback path.'
		);
		$this->assertStringContainsString(
			'Fallback',
			$result,
			'The serialized fallback children should render when the source returns null.'
		);
	}

	/**
	 * Unit-level coverage of the `innerContent` rebuild rule, including the
	 * edge cases (no placeholder, empty template, zero new blocks).
	 *
	 * @covers ::gutenberg_block_bindings_rebuild_inner_content
	 *
	 * @dataProvider data_rebuild_inner_content
	 *
	 * @param array $original  The original `innerContent` template.
	 * @param int   $count     The number of new inner blocks.
	 * @param array $expected  The expected rebuilt template.
	 * @param string $message  Assertion message.
	 */
	public function test_rebuild_inner_content_rule( $original, $count, $expected, $message ) {
		$this->assertSame(
			$expected,
			gutenberg_block_bindings_rebuild_inner_content( $original, $count ),
			$message
		);
	}

	/**
	 * Data provider for {@see test_rebuild_inner_content_rule}.
	 *
	 * @return array[] Cases of [ original, new count, expected, message ].
	 */
	public function data_rebuild_inner_content() {
		return array(
			'group wrapper, fewer/equal children' => array(
				array( '<div>', null, null, '</div>' ),
				1,
				array( '<div>', null, '</div>' ),
				'Leading/trailing chunks preserved; one null per new block.',
			),
			'group wrapper, more children'        => array(
				array( '<div>', null, '</div>' ),
				3,
				array( '<div>', null, null, null, '</div>' ),
				'More new blocks than original placeholders emit one null each between the wrapper chunks.',
			),
			'list-item wrapper, single child'     => array(
				array( '<li>Hello', null, '</li>' ),
				2,
				array( '<li>Hello', null, null, '</li>' ),
				'The list-item wrapper chunks are preserved around the new placeholders.',
			),
			'zero new blocks keeps only chrome'   => array(
				array( '<div>', null, '</div>' ),
				0,
				array( '<div>', '</div>' ),
				'Zero new blocks keep only the host static chunks (empty wrapper).',
			),
			'closed wrapper inserts new slots'    => array(
				array( '<div></div>' ),
				2,
				array( '<div>', null, null, '</div>' ),
				'A closed wrapper with no null placeholder inserts new slots before the final closing tag.',
			),
			'closing chunk inserts new slots'     => array(
				array( '<div>', '</div>' ),
				2,
				array( '<div>', null, null, '</div>' ),
				'A separate closing chunk with no null placeholder receives new slots before the closing tag.',
			),
			'no closing tag appends new slots'    => array(
				array( '<div>' ),
				2,
				array( '<div>', null, null ),
				'A template with no null placeholder and no closing tag appends the new slots after the static chunks.',
			),
			'empty template falls back to nulls'  => array(
				array(),
				2,
				array( null, null ),
				'An empty template falls back to one null per new block.',
			),
			'empty template, zero new blocks'     => array(
				array(),
				0,
				array(),
				'An empty template with zero new blocks stays empty.',
			),
		);
	}

	/**
	 * A context-blind source supplying markup that contains another block bound
	 * to the same source and args must not recurse: the nested binding is
	 * skipped and the nested block's own serialized children render instead.
	 *
	 * @covers ::gutenberg_block_bindings_resolve_inner_blocks
	 * @expectedIncorrectUsage gutenberg_block_bindings_resolve_inner_blocks
	 */
	public function test_self_referential_source_does_not_recurse() {
		// The source's value embeds another container bound to the same source.
		$this->register_inner_blocks_source(
			'<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Cycle fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->'
		);

		$result = render_block( $this->bound_container_parsed_block() );

		// The outer substitution ran (the fallback did not render at the top),
		// and the nested, cyclic binding fell back to its own children exactly
		// once — rendering terminated instead of recursing.
		$this->assertStringContainsString(
			'Cycle fallback',
			$result,
			'The nested cyclic binding must fall back to its own serialized children.'
		);
		$this->assertSame(
			1,
			substr_count( $result, 'Cycle fallback' ),
			'The cyclic binding must render exactly once.'
		);
		$this->assertSame(
			2,
			substr_count( $result, '<div class="test-container">' ),
			'Exactly two nested containers must render: the bound host and the one substituted level.'
		);
	}

	/**
	 * The recursion guard is scoped to the currently-rendering ancestry:
	 * sequential (sibling) areas bound to the same source both substitute.
	 *
	 * @covers ::gutenberg_block_bindings_resolve_inner_blocks
	 */
	public function test_sequential_bound_areas_are_not_affected_by_the_recursion_guard() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted</p><!-- /wp:paragraph -->'
		);

		$first  = render_block( $this->bound_container_parsed_block() );
		$second = render_block( $this->bound_container_parsed_block() );

		$this->assertStringContainsString( 'Substituted', $first, 'The first bound area must substitute.' );
		$this->assertStringContainsString(
			'Substituted',
			$second,
			'A subsequent bound area using the same source must substitute: the guard ancestry must not outlive the first render.'
		);
	}

	/**
	 * Top-level context parity with core: context supplied through the standard
	 * `render_block_context` filter (widgets, templates, plugins) reaches the
	 * source callback, matching what core's render_block() would provide.
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_top_level_context_resolves_through_render_block_context_filter() {
		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Context-dependent inner blocks source',
				'uses_context'       => array( 'test/filtered-context' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}
					$value = $block_instance->context['test/filtered-context'] ?? null;
					if ( null === $value ) {
						return null;
					}
					return '<!-- wp:paragraph --><p>' . $value . '</p><!-- /wp:paragraph -->';
				},
			)
		);

		$add_context = static function ( $context ) {
			$context['test/filtered-context'] = 'From the filter';
			return $context;
		};
		add_filter( 'render_block_context', $add_context );

		$markup = '<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );

		try {
			$result = render_block( $parsed[0] );
		} finally {
			remove_filter( 'render_block_context', $add_context );
		}

		$this->assertStringContainsString(
			'From the filter',
			$result,
			'Context supplied via the render_block_context filter must reach the source at the top level.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'The substituted children must replace the serialized fallback.'
		);
	}

	/**
	 * The recursion guard keys on the context the source declares it consumes:
	 * a `postId`-dependent source legitimately nests the same binding under
	 * providers supplying different `postId` values (a Query Loop rendering
	 * other posts) and must not be flagged as a cycle.
	 *
	 * @covers ::gutenberg_block_bindings_get_binding_guard_key
	 * @covers ::gutenberg_block_bindings_resolve_inner_blocks
	 */
	public function test_context_dependent_source_nested_across_posts_is_not_flagged_as_cycle() {
		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Post-dependent inner blocks source',
				'uses_context'       => array( 'postId' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}

					$post_id = $block_instance->context['postId'] ?? 0;
					if ( $post_id >= 3 ) {
						// Terminate the descent with an intentionally-empty area.
						return '';
					}

					$next_id = $post_id + 1;
					return '<!-- wp:paragraph --><p>Level ' . $next_id . '</p><!-- /wp:paragraph -->' .
						'<!-- wp:test/post-provider {"postId":' . $next_id . '} -->' .
						'<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} -->' .
						'<!-- wp:paragraph --><p>Guard fallback</p><!-- /wp:paragraph -->' .
						'<!-- /wp:test/container -->' .
						'<!-- /wp:test/post-provider -->';
				},
			)
		);

		$markup = '<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Guard fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );
		$result = render_block( $parsed[0] );

		foreach ( array( 'Level 1', 'Level 2', 'Level 3' ) as $level ) {
			$this->assertStringContainsString(
				$level,
				$result,
				"The nested binding for '$level' must substitute: same source and args under a different postId is not a cycle."
			);
		}
		$this->assertStringNotContainsString(
			'Guard fallback',
			$result,
			'No level of the nested bindings may be skipped by the recursion guard.'
		);
	}

	/**
	 * The ancestry travels through intermediate blocks that neither use nor
	 * provide context: a grandchild bound with an identical guard key is
	 * skipped even when a plain container sits in between.
	 *
	 * @covers ::gutenberg_block_bindings_resolve_inner_blocks
	 * @expectedIncorrectUsage gutenberg_block_bindings_resolve_inner_blocks
	 */
	public function test_cycle_through_intermediate_block_is_detected() {
		$this->register_inner_blocks_source(
			'<!-- wp:test/container -->' .
			'<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Intermediate cycle fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->' .
			'<!-- /wp:test/container -->'
		);

		$result = render_block( $this->bound_container_parsed_block() );

		$this->assertStringContainsString(
			'Intermediate cycle fallback',
			$result,
			'The grandchild cyclic binding must fall back to its own serialized children.'
		);
		$this->assertSame(
			1,
			substr_count( $result, 'Intermediate cycle fallback' ),
			'The grandchild cyclic binding must render exactly once.'
		);
	}

	/**
	 * A `render_block_data` filter at a later priority that returns a freshly
	 * built parsed-block array (a documented, common plugin pattern) must not
	 * leak guard state: every subsequent area bound to the same source and args
	 * still substitutes.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 * @covers ::gutenberg_block_bindings_close_bound_block
	 */
	public function test_parsed_block_rebuilt_by_later_filter_does_not_leak_guard_state() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted</p><!-- /wp:paragraph -->'
		);

		$rebuild = static function ( $parsed_block ) {
			return array_intersect_key(
				$parsed_block,
				array_flip( array( 'blockName', 'attrs', 'innerBlocks', 'innerContent', 'innerHTML' ) )
			);
		};
		add_filter( 'render_block_data', $rebuild, 11 );

		try {
			// More renders than the depth cap proves neither the guard ancestry
			// nor the depth counter accumulates across sequential renders.
			for ( $i = 0; $i < 40; $i++ ) {
				$result = render_block( $this->bound_container_parsed_block() );
				$this->assertStringContainsString(
					'Substituted',
					$result,
					"Bound area $i must substitute even when a later filter rebuilds the parsed block."
				);
			}
		} finally {
			remove_filter( 'render_block_data', $rebuild, 11 );
		}
	}

	/**
	 * The `render_block_context` filter runs exactly once for a top-level bound
	 * block, and the context it injects is visible to the source's resolution.
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_render_block_context_filter_runs_once_for_top_level_bound_block() {
		register_block_bindings_source(
			self::CONTEXT_SOURCE_NAME,
			array(
				'label'              => 'Context-dependent inner blocks source',
				'uses_context'       => array( 'test/filtered-context' ),
				'get_value_callback' => static function ( $source_args, $block_instance, $attribute_name ) {
					if ( 'innerBlocks' !== $attribute_name ) {
						return null;
					}
					$value = $block_instance->context['test/filtered-context'] ?? null;
					if ( null === $value ) {
						return null;
					}
					return '<!-- wp:paragraph --><p>' . $value . '</p><!-- /wp:paragraph -->';
				},
			)
		);

		$invocations = 0;
		$spy         = static function ( $context, $parsed_block ) use ( &$invocations ) {
			if ( 'context-once-top' === ( $parsed_block['attrs']['testMarker'] ?? null ) ) {
				++$invocations;
				$context['test/filtered-context'] = 'Injected by the spy';
			}
			return $context;
		};
		add_filter( 'render_block_context', $spy, 10, 2 );

		$markup = '<!-- wp:test/container {"testMarker":"context-once-top","metadata":{"bindings":{"innerBlocks":{"source":"' . self::CONTEXT_SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';

		try {
			$result = do_blocks( $markup );
		} finally {
			remove_filter( 'render_block_context', $spy, 10 );
		}

		$this->assertSame(
			1,
			$invocations,
			'The render_block_context filter must run exactly once for a top-level bound block.'
		);
		$this->assertStringContainsString(
			'Injected by the spy',
			$result,
			'Context injected by the render_block_context filter must be visible to the source at the top level.'
		);
		$this->assertStringNotContainsString(
			'Fallback',
			$result,
			'The substituted children must replace the serialized fallback.'
		);
	}

	/**
	 * The `render_block_context` filter runs exactly once for a bound block
	 * nested inside another block: core's own inner-loop application, with zero
	 * added by the substitution.
	 *
	 * @covers ::gutenberg_block_bindings_replace_inner_blocks
	 */
	public function test_render_block_context_filter_runs_once_for_nested_bound_block() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted</p><!-- /wp:paragraph -->'
		);

		$invocations = 0;
		$spy         = static function ( $context, $parsed_block ) use ( &$invocations ) {
			if ( 'context-once-nested' === ( $parsed_block['attrs']['testMarker'] ?? null ) ) {
				++$invocations;
			}
			return $context;
		};
		add_filter( 'render_block_context', $spy, 10, 2 );

		$markup = '<!-- wp:test/container -->' .
			'<!-- wp:test/container {"testMarker":"context-once-nested","metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->' .
			'<!-- /wp:test/container -->';

		try {
			$result = do_blocks( $markup );
		} finally {
			remove_filter( 'render_block_context', $spy, 10 );
		}

		$this->assertSame(
			1,
			$invocations,
			'The render_block_context filter must run exactly once for a nested bound block.'
		);
		$this->assertStringContainsString(
			'Substituted',
			$result,
			'The nested bound block must substitute.'
		);
	}

	/**
	 * The top-level takeover preserves the filter contract of render_block():
	 * `render_block_data` and `render_block` each fire exactly once for the
	 * bound block.
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_top_level_takeover_runs_data_and_render_filters_once() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted child</p><!-- /wp:paragraph -->'
		);

		$data_calls   = 0;
		$render_calls = 0;
		$data_spy     = static function ( $parsed_block ) use ( &$data_calls ) {
			if ( 'takeover-fidelity' === ( $parsed_block['attrs']['testMarker'] ?? null ) ) {
				++$data_calls;
			}
			return $parsed_block;
		};
		$render_spy   = static function ( $block_content, $parsed_block ) use ( &$render_calls ) {
			if ( 'takeover-fidelity' === ( $parsed_block['attrs']['testMarker'] ?? null ) ) {
				++$render_calls;
			}
			return $block_content;
		};
		add_filter( 'render_block_data', $data_spy, 5 );
		add_filter( 'render_block', $render_spy, 10, 2 );

		$markup = '<!-- wp:test/container {"testMarker":"takeover-fidelity","metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';

		try {
			$result = do_blocks( $markup );
		} finally {
			remove_filter( 'render_block_data', $data_spy, 5 );
			remove_filter( 'render_block', $render_spy, 10 );
		}

		$this->assertSame( 1, $data_calls, 'render_block_data must fire exactly once for a top-level bound block.' );
		$this->assertSame( 1, $render_calls, 'render_block must fire exactly once for a top-level bound block.' );
		$this->assertStringContainsString(
			'Substituted child',
			$result,
			'The top-level bound block must substitute.'
		);
	}

	/**
	 * A `pre_render_block` callback registered before the takeover that returns
	 * a non-null value wins: the takeover passes it through untouched and no
	 * substitution occurs.
	 *
	 * @covers ::gutenberg_block_bindings_render_top_level_bound_block
	 */
	public function test_earlier_pre_render_block_filter_wins_over_takeover() {
		$this->register_inner_blocks_source(
			'<!-- wp:paragraph --><p>Substituted child</p><!-- /wp:paragraph -->'
		);

		$short_circuit = static function ( $pre_render, $parsed_block ) {
			if ( 'takeover-short-circuit' === ( $parsed_block['attrs']['testMarker'] ?? null ) ) {
				return '<p>Short-circuited</p>';
			}
			return $pre_render;
		};
		add_filter( 'pre_render_block', $short_circuit, 10, 2 );

		$markup = '<!-- wp:test/container {"testMarker":"takeover-short-circuit","metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';
		$parsed = parse_blocks( $markup );

		try {
			$result = render_block( $parsed[0] );
		} finally {
			remove_filter( 'pre_render_block', $short_circuit, 10 );
		}

		$this->assertSame(
			'<p>Short-circuited</p>',
			$result,
			'An earlier pre_render_block callback returning a value must win over the takeover.'
		);
		$this->assertStringNotContainsString(
			'Substituted child',
			$result,
			'No substitution may occur when render_block() is short-circuited by another callback.'
		);
	}

	/**
	 * A cycle crossing a context boundary (`do_blocks()` inside a dynamic
	 * block's render callback, like a template part) cannot be caught by the
	 * context-carried ancestry; the global depth backstop must terminate it.
	 *
	 * @covers ::gutenberg_block_bindings_bound_render_depth
	 * @covers ::gutenberg_block_bindings_resolve_inner_blocks
	 * @expectedIncorrectUsage gutenberg_block_bindings_resolve_inner_blocks
	 */
	public function test_depth_backstop_terminates_cycle_crossing_do_blocks() {
		$markup = '<!-- wp:test/container {"metadata":{"bindings":{"innerBlocks":{"source":"' . self::SOURCE_NAME . '"}}}} -->' .
			'<!-- wp:paragraph --><p>Backstop fallback</p><!-- /wp:paragraph -->' .
			'<!-- /wp:test/container -->';

		register_block_type(
			'test/do-blocks-renderer',
			array(
				'render_callback' => static function () use ( $markup ) {
					return do_blocks( $markup );
				},
			)
		);

		$this->register_inner_blocks_source( '<!-- wp:test/do-blocks-renderer /-->' );

		$parsed = parse_blocks( $markup );
		try {
			$result = render_block( $parsed[0] );
		} finally {
			unregister_block_type( 'test/do-blocks-renderer' );
		}

		$this->assertStringContainsString(
			'Backstop fallback',
			$result,
			'The capped binding must fall back to its own serialized children.'
		);
		$this->assertSame(
			1,
			substr_count( $result, 'Backstop fallback' ),
			'Rendering must terminate at the depth cap: the fallback renders exactly once.'
		);
	}
}
