<?php
/**
 * Directive processing test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

class Tests_Process_Directives extends WP_UnitTestCase {
	public function set_up() {
		parent::set_up();

		register_block_type(
			'test/context-level-1',
			array(
				'render_callback' => function ( $attributes, $content ) {
					return '<div data-wp-interactive=\'{ "namespace": "test" }\' data-wp-context=\'{ "myText": "level-1" }\'> <input class="level-1-input-1" data-wp-bind--value="context.myText">' . $content . '<input class="level-1-input-2" data-wp-bind--value="context.myText"></div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/context-level-2',
			array(
				'render_callback' => function ( $attributes, $content ) {
					return '<div data-wp-interactive=\'{ "namespace": "test" }\' data-wp-context=\'{ "myText": "level-2" }\'><input class="level-2-input-1" data-wp-bind--value="context.myText">' . $content . '</div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/context-read-only',
			array(
				'render_callback' => function () {
					return '<div data-wp-interactive=\'{ "namespace": "test" }\'><input class="read-only-input-1" data-wp-bind--value="context.myText"></div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/non-interactive-with-directive',
			array(
				'render_callback' => function () {
					return '<input class="non-interactive-with-directive" data-wp-bind--value="context.myText">';
				},
			)
		);

		register_block_type(
			'test/context-level-with-manual-inner-block-rendering',
			array(
				'render_callback' => function ( $attributes, $content, $block ) {
					$inner_blocks_html = '';
					foreach ( $block->inner_blocks as $inner_block ) {
						$inner_blocks_html .= $inner_block->render();
					}
					return '<div data-wp-interactive=\'{ "namespace": "test" }\' data-wp-context=\'{ "myText": "some value" }\'>' . $inner_blocks_html . '</div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/directives-ordering',
			array(
				'render_callback' => function () {
					return '<input data-wp-interactive=\'{ "namespace": "test" }\' data-wp-context=\'{ "isClass": true, "value": "some-value", "display": "none" }\' data-wp-bind--value="context.value" class="other-class" data-wp-class--some-class="context.isClass" data-wp-style--display="context.display">';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		register_block_type(
			'test/directives',
			array(
				'render_callback' => function ( $attributes, $content ) {
					$parsed_attributes = array();
					foreach ( $attributes as $key => $value ) {
						$parsed_attributes[ $key ] = is_array( $value )
							? wp_json_encode( $value, JSON_HEX_APOS )
							: esc_attr( $value );
					}

					$wrapper_attributes = get_block_wrapper_attributes(
						$parsed_attributes
					);

					return "<div $wrapper_attributes>$content</div>";
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);

		WP_Interactivity_Initial_State::reset();
	}

	public function tear_down() {
		WP_Interactivity_Initial_State::reset();
		unregister_block_type( 'test/context-level-1' );
		unregister_block_type( 'test/context-level-2' );
		unregister_block_type( 'test/context-read-only' );
		unregister_block_type( 'test/non-interactive-with-directive' );
		unregister_block_type( 'test/context-level-with-manual-inner-block-rendering' );
		unregister_block_type( 'test/directives-ordering' );
		unregister_block_type( 'test/directives' );
		parent::tear_down();
	}

	public function test_interactivity_process_directives_in_root_blocks() {
		$block_content =
		'<!-- wp:paragraph -->' .
			'<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>' .
		'<!-- /wp:paragraph -->' .
		'<!-- wp:paragraph -->' .
			'<p>Welcome to WordPress.</p>' .
		'<!-- /wp:paragraph -->';

		$parsed_block        = parse_blocks( $block_content )[0];
		$source_block        = $parsed_block;
		$rendered_content    = render_block( $parsed_block );
		$parsed_block_second = parse_blocks( $block_content )[1];
		$fake_parent_block   = array();

		// Test that root block is intially emtpy.
		$this->assertEmpty( WP_Directive_Processor::$root_block );

		// Test that root block is not added if there is a parent block.
		gutenberg_interactivity_mark_root_blocks( $parsed_block, $source_block, $fake_parent_block );
		$this->assertEmpty( WP_Directive_Processor::$root_block );

		// Test that root block is added if there is no parent block.
		gutenberg_interactivity_mark_root_blocks( $parsed_block, $source_block, null );
		$current_root_block = WP_Directive_Processor::$root_block;
		$this->assertNotEmpty( $current_root_block );

		// Test that a root block is not added if there is already a root block defined.
		gutenberg_interactivity_mark_root_blocks( $parsed_block_second, $source_block, null );
		$this->assertSame( $current_root_block, WP_Directive_Processor::$root_block );

		// Test that root block is removed after processing.
		gutenberg_process_directives_in_root_blocks( $rendered_content, $parsed_block );
		$this->assertEmpty( WP_Directive_Processor::$root_block );
	}

	public function test_directive_processing_of_interactive_block() {
		$post_content    = '<!-- wp:test/context-level-1 /-->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'level-1-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'level-1-input-2' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
	}

	public function test_directive_processing_two_interactive_blocks_at_same_level() {
		$post_content    = '<!-- wp:group --><div class="wp-block-group"><!-- wp:test/context-level-1 /--><!-- wp:test/context-level-2 /--></div><!-- /wp:group -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'level-1-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'level-1-input-2' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'level-2-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-2', $value );
	}

	public function test_directives_are_processed_at_tag_end() {
		$post_content    = '<!-- wp:test/context-level-1 --><!-- wp:test/context-level-2 /--><!-- wp:test/context-read-only /--><!-- /wp:test/context-level-1 -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'level-1-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'level-2-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-2', $value );
		$p->next_tag( array( 'class_name' => 'read-only-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'level-1-input-2' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
	}

	public function test_non_interactive_children_of_interactive_is_rendered() {
		$post_content    = '<!-- wp:test/context-level-1 --><!-- wp:test/context-read-only /--><!-- wp:paragraph --><p>Welcome</p><!-- /wp:paragraph --><!-- /wp:test/context-level-1 -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'level-1-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag( array( 'class_name' => 'read-only-input-1' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
		$p->next_tag();
		$this->assertSame( 'P', $p->get_tag() );
		$p->next_tag( array( 'class_name' => 'level-1-input-2' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'level-1', $value );
	}

	public function test_non_interactive_blocks_are_not_processed() {
		$post_content    = '<!-- wp:test/context-level-1 --><!-- wp:test/non-interactive-with-directive /--><!-- /wp:test/context-level-1 -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'non-interactive-with-directive' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( null, $value );
	}

	public function test_non_interactive_blocks_with_manual_inner_block_rendering_are_not_processed() {
		$post_content    = '<!-- wp:test/context-level-with-manual-inner-block-rendering --><!-- wp:test/non-interactive-with-directive /--><!-- /wp:test/context-level-with-manual-inner-block-rendering -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag( array( 'class_name' => 'non-interactive-with-directive' ) );
		$value = $p->get_attribute( 'value' );
		$this->assertSame( null, $value );
	}

	public function test_directives_ordering() {
		$post_content    = '<!-- wp:test/directives-ordering -->';
		$rendered_blocks = do_blocks( $post_content );
		$p               = new WP_HTML_Tag_Processor( $rendered_blocks );
		$p->next_tag();

		$value = $p->get_attribute( 'class' );
		$this->assertSame( 'other-class some-class', $value );

		$value = $p->get_attribute( 'value' );
		$this->assertSame( 'some-value', $value );

		$value = $p->get_attribute( 'style' );
		$this->assertSame( 'display: none;', $value );
	}

	public function test_evaluate_function_should_access_state() {
		// Init a simple store.
		wp_initial_state(
			'test',
			array(
				'number' => 1,
				'bool'   => true,
				'nested' => array(
					'string' => 'hi',
				),
			)
		);

		$this->assertSame( 1, gutenberg_interactivity_evaluate_reference( 'state.number', 'test' ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( 'state.bool', 'test' ) );
		$this->assertSame( 'hi', gutenberg_interactivity_evaluate_reference( 'state.nested.string', 'test' ) );
		$this->assertFalse( gutenberg_interactivity_evaluate_reference( '!state.bool', 'test' ) );
	}

	public function test_evaluate_function_should_access_passed_context() {
		wp_initial_state(
			'test',
			array(
				'number' => 1,
				'bool'   => true,
				'nested' => array(
					'string' => 'hi',
				),
			)
		);

		$context = array(
			'test' => array(
				'number' => 2,
				'bool'   => false,
				'nested' => array(
					'string' => 'bye',
				),
			),
		);

		$this->assertSame( 2, gutenberg_interactivity_evaluate_reference( 'context.number', 'test', $context ) );
		$this->assertFalse( gutenberg_interactivity_evaluate_reference( 'context.bool', 'test', $context ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( '!context.bool', 'test', $context ) );
		$this->assertSame( 'bye', gutenberg_interactivity_evaluate_reference( 'context.nested.string', 'test', $context ) );

		// Defined state is also accessible.
		$this->assertSame( 1, gutenberg_interactivity_evaluate_reference( 'state.number', 'test' ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( 'state.bool', 'test' ) );
		$this->assertSame( 'hi', gutenberg_interactivity_evaluate_reference( 'state.nested.string', 'test' ) );
	}

	public function test_evaluate_function_should_return_null_for_unresolved_paths() {
		$this->assertNull( gutenberg_interactivity_evaluate_reference( 'this.property.doesnt.exist', 'myblock' ) );
	}

	public function test_evaluate_function_should_execute_anonymous_functions() {
		$this->markTestSkipped( 'Derived state was supported for `wp_store()` but not for `wp_initial_state()` yet.' );

		$context = new WP_Directive_Context( array( 'myblock' => array( 'count' => 2 ) ) );

		wp_initial_state(
			'myblock',
			array(
				'count'               => 3,
				'anonymous_function'  => function ( $store ) {
					return $store['state']['count'] + $store['context']['count'];
				},
				// Other types of callables should not be executed.
				'function_name'       => 'gutenberg_test_process_directives_helper_increment',
				'class_method'        => array( $this, 'increment' ),
				'class_static_method' => array( 'Tests_Process_Directives', 'static_increment' ),
			)
		);

		$this->assertSame( 5, gutenberg_interactivity_evaluate_reference( 'state.anonymous_function', 'myblock', $context->get_context() ) );
		$this->assertSame(
			'gutenberg_test_process_directives_helper_increment',
			gutenberg_interactivity_evaluate_reference( 'state.function_name', 'myblock', $context->get_context() )
		);
		$this->assertSame(
			array( $this, 'increment' ),
			gutenberg_interactivity_evaluate_reference( 'state.class_method', 'myblock', $context->get_context() )
		);
		$this->assertSame(
			array( 'Tests_Process_Directives', 'static_increment' ),
			gutenberg_interactivity_evaluate_reference( 'state.class_static_method', 'myblock', $context->get_context() )
		);
	}

	public function test_namespace_should_be_inherited_from_ancestor() {
		/*
		 * This function call should be done inside block render functions. We
		 * run it here instead just for conveninence.
		 */
		wp_initial_state( 'test-1', array( 'text' => 'state' ) );

		$post_content = '
			<!-- wp:test/directives { "data-wp-interactive": { "namespace": "test-1" } } -->
				<!-- wp:test/directives { "data-wp-context": { "text": "context" } } -->
					<!-- wp:test/directives {
						"class": "bind-state",
						"data-wp-bind--data-value": "state.text"
					} /-->
					<!-- wp:test/directives {
						"class": "bind-context",
						"data-wp-bind--data-value": "context.text"
					} /-->
				<!-- /wp:test/directives -->
			<!-- /wp:test/directives -->
		';

		$html = do_blocks( $post_content );
		$tags = new WP_HTML_Tag_Processor( $html );

		$tags->next_tag( array( 'class_name' => 'bind-state' ) );
		$this->assertSame( 'state', $tags->get_attribute( 'data-value' ) );

		$tags->next_tag( array( 'class_name' => 'bind-context' ) );
		$this->assertSame( 'context', $tags->get_attribute( 'data-value' ) );
	}

	public function test_namespace_should_be_inherited_from_same_element() {
		/*
		 * This function call should be done inside block render functions. We
		 * run it here instead just for conveninence.
		 */
		wp_initial_state( 'test-2', array( 'text' => 'state-2' ) );

		$post_content = '
			<!-- wp:test/directives { "data-wp-interactive": { "namespace": "test-1" } } -->
				<!-- wp:test/directives { "data-wp-context": { "text": "context" } } -->
					<!-- wp:test/directives {
						"class": "bind-state",
						"data-wp-interactive": { "namespace": "test-2" },
						"data-wp-bind--data-value": "state.text"
					} /-->
					<!-- wp:test/directives {
						"class": "bind-context",
						"data-wp-interactive": { "namespace": "test-2" },
						"data-wp-context": { "text": "context-2" },
						"data-wp-bind--data-value": "context.text"
					} /-->
				<!-- /wp:test/directives -->
			<!-- /wp:test/directives -->
		';

		$html = do_blocks( $post_content );
		$tags = new WP_HTML_Tag_Processor( $html );

		$tags->next_tag( array( 'class_name' => 'bind-state' ) );
		$this->assertSame( 'state-2', $tags->get_attribute( 'data-value' ) );

		$tags->next_tag( array( 'class_name' => 'bind-context' ) );
		$this->assertSame( 'context-2', $tags->get_attribute( 'data-value' ) );
	}

	public function test_namespace_should_not_leak_from_descendant() {
		/*
		 * This function call should be done inside block render functions. We
		 * run it here instead just for conveninence.
		 */
		wp_initial_state( 'test-1', array( 'text' => 'state-1' ) );
		wp_initial_state( 'test-2', array( 'text' => 'state-2' ) );

		$post_content = '
			<!-- wp:test/directives {
				"data-wp-interactive": { "namespace": "test-2" },
				"data-wp-context": { "text": "context-2" }
			} -->
				<!-- wp:test/directives {
					"class": "target",
					"data-wp-interactive": { "namespace": "test-1" },
					"data-wp-context": { "text": "context-1" },
					"data-wp-bind--data-state": "state.text",
					"data-wp-bind--data-context": "context.text"
				} -->
					<!-- wp:test/directives {
						"data-wp-interactive": { "namespace": "test-2" }
					} /-->
				<!-- /wp:test/directives -->
			<!-- /wp:test/directives -->
		';

		$html = do_blocks( $post_content );
		$tags = new WP_HTML_Tag_Processor( $html );

		$tags->next_tag( array( 'class_name' => 'target' ) );
		$this->assertSame( 'state-1', $tags->get_attribute( 'data-state' ) );
		$this->assertSame( 'context-1', $tags->get_attribute( 'data-context' ) );
	}

	public function test_namespace_should_not_leak_from_sibling() {
		/*
		 * This function call should be done inside block render functions. We
		 * run it here instead just for conveninence.
		 */
		wp_initial_state( 'test-1', array( 'text' => 'state-1' ) );
		wp_initial_state( 'test-2', array( 'text' => 'state-2' ) );

		$post_content = '
			<!-- wp:test/directives {
				"data-wp-interactive": { "namespace": "test-2" },
				"data-wp-context": { "text": "context-2" }
			} -->
				<!-- wp:test/directives {
					"data-wp-interactive": { "namespace": "test-1" },
					"data-wp-context": { "text": "context-1" }
				} -->
					<!-- wp:test/directives {
						"data-wp-interactive": { "namespace": "test-2" }
					} /-->
					<!-- wp:test/directives {
						"class": "target",
						"data-wp-bind--data-from-state": "state.text",
						"data-wp-bind--data-from-context": "context.text"
					} /-->
				<!-- /wp:test/directives -->
			<!-- /wp:test/directives -->
		';

		$html = do_blocks( $post_content );
		$tags = new WP_HTML_Tag_Processor( $html );

		$tags->next_tag( array( 'class_name' => 'target' ) );
		$this->assertSame( 'state-1', $tags->get_attribute( 'data-from-state' ) );
		$this->assertSame( 'context-1', $tags->get_attribute( 'data-from-context' ) );
	}

	public function test_namespace_can_be_overwritten_in_directives() {
		/*
		 * This function call should be done inside block render functions. We
		 * run it here instead just for conveninence.
		 */
		wp_initial_state( 'test-1', array( 'text' => 'state-1' ) );
		wp_initial_state( 'test-2', array( 'text' => 'state-2' ) );

		$post_content = '
			<!-- wp:test/directives { "data-wp-interactive": { "namespace": "test-1" } } -->
					<!-- wp:test/directives {
						"class": "inherited-ns",
						"data-wp-bind--data-value": "state.text"
					} /-->
					<!-- wp:test/directives {
						"class": "custom-ns",
						"data-wp-bind--data-value": "test-2::state.text"
					} /-->
					<!-- wp:test/directives {
						"class": "mixed-ns",
						"data-wp-bind--data-inherited-ns": "state.text",
						"data-wp-bind--data-custom-ns": "test-2::state.text"
					} /-->
			<!-- /wp:test/directives -->
		';

		$html = do_blocks( $post_content );
		$tags = new WP_HTML_Tag_Processor( $html );

		$tags->next_tag( array( 'class_name' => 'inherited-ns' ) );
		$this->assertSame( 'state-1', $tags->get_attribute( 'data-value' ) );

		$tags->next_tag( array( 'class_name' => 'custom-ns' ) );
		$this->assertSame( 'state-2', $tags->get_attribute( 'data-value' ) );

		$tags->next_tag( array( 'class_name' => 'mixed-ns' ) );
		$this->assertSame( 'state-1', $tags->get_attribute( 'data-inherited-ns' ) );
		$this->assertSame( 'state-2', $tags->get_attribute( 'data-custom-ns' ) );
	}
}
