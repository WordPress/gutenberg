<?php
/**
 * Directive processing test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 *
 * @phpcs:disable Generic.Files.OneObjectStructurePerFile.MultipleFound
 */


class Helper_Class {

	public function increment( $store ) {
		return $store['state']['count'] + $store['context']['count'];
	}

	public static function static_increment( $store ) {
		return $store['state']['count'] + $store['context']['count'];
	}
}

function gutenberg_test_process_directives_helper_increment( $store ) {
	return $store['state']['count'] + $store['context']['count'];
}

/**
 * Tests for the gutenberg_interactivity_process_rendered_html function.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_rendered_html
 */
class Tests_Process_Directives extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		register_block_type(
			'gutenberg/test-context-level-1',
			array(
				'render_callback' => function ( $a, $b, $block ) {
					$inner_blocks_html = '';
					foreach ( $block->inner_blocks as $inner_block ) {
						$inner_blocks_html .= $inner_block->render();
					}
					return '<div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'></p>' . $inner_blocks_html . '<p data-wp-text=\'context.MyText\'></p></div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);
		register_block_type(
			'gutenberg/test-context-level-2',
			array(
				'render_callback' => function ( $a, $b, $block ) {
					$inner_blocks_html = '';
					foreach ( $block->inner_blocks as $inner_block ) {
						$inner_blocks_html .= $inner_block->render();
					}
					return '<div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-2" }\'><p data-wp-text=\'context.MyText\'></p>' . $inner_blocks_html . '</div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);
		register_block_type(
			'gutenberg/test-context-read-only',
			array(
				'render_callback' => function () {
					return '<div data-wp-interactive=\'{"namespace": "gutenberg"}\'><p data-wp-text=\'context.MyText\'></p></div>';
				},
				'supports'        => array(
					'interactivity' => true,
				),
			)
		);
	}

	public function tear_down() {
		unregister_block_type( 'gutenberg/test-context-level-1' );
		unregister_block_type( 'gutenberg/test-context-level-2' );
		unregister_block_type( 'gutenberg/test-context-read-only' );
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

		$parsed_block = parse_blocks( $block_content )[0];

		$source_block = $parsed_block;

		$rendered_content = render_block( $parsed_block );

		$parsed_block_second = parse_blocks( $block_content )[1];

		$fake_parent_block = array();

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
		$args            = array(
			'post_content' => '<!-- wp:gutenberg/test-context-level-1 /-->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}

	public function test_directive_processing_child_blocks() {
		$args            = array(
			'post_content' => '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:gutenberg/test-context-level-1 /--></div><!-- /wp:group -->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div class="wp-block-group is-layout-constrained wp-block-group-is-layout-constrained"><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}

	public function test_directive_processing_inner_non_interactive_blocks() {
		$args            = array(
			'post_content' => '<!-- wp:gutenberg/test-context-level-1 --><div class="wp-block-create-block-context"><!-- wp:paragraph --><p>inner non interactive</p><!-- /wp:paragraph --></div><!--/wp:gutenberg/test-context-level-1 -->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p>inner non interactive</p><p data-wp-text=\'context.MyText\'>level-1</p></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}
	public function test_directive_processing_two_interactive_blocks_at_same_level() {
		$args            = array(
			'post_content' => '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:gutenberg/test-context-level-1 /--><!-- wp:gutenberg/test-context-level-1 /--></div><!-- /wp:group -->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div class="wp-block-group is-layout-constrained wp-block-group-is-layout-constrained"><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}

	public function test_directive_processing_alternating_interactive_and_not_interactive() {
		$args            = array(
			'post_content' => '<!-- wp:group {"layout":{"type":"constrained"}} --><div class="wp-block-group"><!-- wp:gutenberg/test-context-level-1 /--><!-- wp:paragraph --><p>inner non interactive</p><!-- /wp:paragraph --><!-- wp:gutenberg/test-context-level-1 /--></div><!-- /wp:group -->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div class="wp-block-group is-layout-constrained wp-block-group-is-layout-constrained"><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div><p>inner non interactive</p><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><p data-wp-text=\'context.MyText\'>level-1</p></div></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}

	public function test_directive_directives_are_processed_at_tag_end() {
		$args            = array(
			'post_content' => '<!-- wp:gutenberg/test-context-level-1 --><!-- wp:gutenberg/test-context-level-2 /--><!-- wp:gutenberg/test-context-read-only /--><!-- /wp:gutenberg/test-context-level-1 -->',
		);
		$rendered_blocks = do_blocks( $args['post_content'] );
		$expected        = '<div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-1" }\'><p data-wp-text=\'context.MyText\'>level-1</p><div data-wp-interactive=\'{"namespace": "gutenberg"}\' data-wp-context=\'{"MyText": "level-2" }\'><p data-wp-text=\'context.MyText\'>level-2</p></div><div data-wp-interactive=\'{"namespace": "gutenberg"}\'><p data-wp-text=\'context.MyText\'>level-1</p></div><p data-wp-text=\'context.MyText\'>level-1</p></div>';
		$this->assertSame( $expected, $rendered_blocks );
	}
}


/**
 * Tests for the gutenberg_interactivity_evaluate_reference function.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_evaluate_reference
 */
class Tests_Utils_Evaluate extends WP_UnitTestCase {
	public function test_evaluate_function_should_access_state() {
		// Init a simple store.
		wp_store(
			array(
				'state' => array(
					'core' => array(
						'number' => 1,
						'bool'   => true,
						'nested' => array(
							'string' => 'hi',
						),
					),
				),
			)
		);
		$this->assertSame( 1, gutenberg_interactivity_evaluate_reference( 'state.core.number' ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( 'state.core.bool' ) );
		$this->assertSame( 'hi', gutenberg_interactivity_evaluate_reference( 'state.core.nested.string' ) );
		$this->assertFalse( gutenberg_interactivity_evaluate_reference( '!state.core.bool' ) );
	}

	public function test_evaluate_function_should_access_passed_context() {
		$context = array(
			'local' => array(
				'number' => 2,
				'bool'   => false,
				'nested' => array(
					'string' => 'bye',
				),
			),
		);
		$this->assertSame( 2, gutenberg_interactivity_evaluate_reference( 'context.local.number', $context ) );
		$this->assertFalse( gutenberg_interactivity_evaluate_reference( 'context.local.bool', $context ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( '!context.local.bool', $context ) );
		$this->assertSame( 'bye', gutenberg_interactivity_evaluate_reference( 'context.local.nested.string', $context ) );
		// Previously defined state is also accessible.
		$this->assertSame( 1, gutenberg_interactivity_evaluate_reference( 'state.core.number' ) );
		$this->assertTrue( gutenberg_interactivity_evaluate_reference( 'state.core.bool' ) );
		$this->assertSame( 'hi', gutenberg_interactivity_evaluate_reference( 'state.core.nested.string' ) );
	}

	public function test_evaluate_function_should_return_null_for_unresolved_paths() {
		$this->assertNull( gutenberg_interactivity_evaluate_reference( 'this.property.doesnt.exist' ) );
	}

	public function test_evaluate_function_should_execute_anonymous_functions() {
		$context = new WP_Directive_Context( array( 'count' => 2 ) );
		$helper  = new Helper_Class();

		wp_store(
			array(
				'state'     => array(
					'count' => 3,
				),
				'selectors' => array(
					'anonymous_function'           => function ( $store ) {
						return $store['state']['count'] + $store['context']['count'];
					},
					// Other types of callables should not be executed.
					'function_name'                => 'gutenberg_test_process_directives_helper_increment',
					'class_method'                 => array( $helper, 'increment' ),
					'class_static_method'          => 'Helper_Class::static_increment',
					'class_static_method_as_array' => array( 'Helper_Class', 'static_increment' ),
				),
			)
		);

		$this->assertSame( 5, gutenberg_interactivity_evaluate_reference( 'selectors.anonymous_function', $context->get_context() ) );
		$this->assertSame(
			'gutenberg_test_process_directives_helper_increment',
			gutenberg_interactivity_evaluate_reference( 'selectors.function_name', $context->get_context() )
		);
		$this->assertSame(
			array( $helper, 'increment' ),
			gutenberg_interactivity_evaluate_reference( 'selectors.class_method', $context->get_context() )
		);
		$this->assertSame(
			'Helper_Class::static_increment',
			gutenberg_interactivity_evaluate_reference( 'selectors.class_static_method', $context->get_context() )
		);
		$this->assertSame(
			array( 'Helper_Class', 'static_increment' ),
			gutenberg_interactivity_evaluate_reference( 'selectors.class_static_method_as_array', $context->get_context() )
		);
	}
}
