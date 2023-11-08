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
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function process_foo_test( $tags, $context ) {
	}

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
 * Tests for the gutenberg_interactivity_process_directives function.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_directives
 */
class Tests_Process_Directives extends WP_UnitTestCase {
	public function test_correctly_call_attribute_directive_processor_on_closing_tag() {

		// PHPUnit cannot stub functions, only classes.
		$test_helper = $this->createMock( Helper_Class::class );

		$test_helper->expects( $this->exactly( 2 ) )
				->method( 'process_foo_test' )
				->with(
					$this->callback(
						function ( $p ) {
							return 'DIV' === $p->get_tag() && (
								// Either this is a closing tag...
								$p->is_tag_closer() ||
								// ...or it is an open tag, and has the directive attribute set.
								( ! $p->is_tag_closer() && 'abc' === $p->get_attribute( 'foo-test' ) )
							);
						}
					)
				);

		$directives = array(
			'foo-test' => array( $test_helper, 'process_foo_test' ),
		);

		$markup = '<div>Example: <div foo-test="abc"><img><span>This is a test></span><div>Here is a nested div</div></div></div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		gutenberg_interactivity_process_directives( $tags, 'foo-', $directives );
	}

	public function test_directives_with_double_hyphen_processed_correctly() {
		$test_helper = $this->createMock( Helper_Class::class );
		$test_helper->expects( $this->atLeastOnce() )
				->method( 'process_foo_test' );

		$directives = array(
			'foo-test' => array( $test_helper, 'process_foo_test' ),
		);

		$markup = '<div foo-test--value="abc"></div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		gutenberg_interactivity_process_directives( $tags, 'foo-', $directives );
	}

	public function test_interactivity_process_directives_in_root_blocks() {
		// Reset root blocks counter.
		WP_Directive_Processor::$root_blocks = array();

		$providers = $this->data_only_root_blocks_are_processed();
		foreach ( $providers as $provider ) {
			do_blocks( $provider['page_content'] );
			$this->assertSame( $provider['root_blocks'], count( WP_Directive_Processor::$root_blocks ) );
			// Reset root blocks counter.
			WP_Directive_Processor::$root_blocks = array();
		}
	}

	/**
	 * Data provider .
	 *
	 * @return array
	 **/
	public function data_only_root_blocks_are_processed() {

		return array(
			array(
				'root_blocks'  => 2,
				'page_content' => '<!-- wp:quote -->' .
					'<blockquote class="wp-block-quote"><!-- wp:paragraph -->' .
					'<p>The XYZ Doohickey Company was founded in 1971, and has been providing' .
					'quality doohickeys to the public ever since. Located in Gotham City, XYZ employs' .
					'over 2,000 people and does all kinds of awesome things for the Gotham community.</p>' .
					'<!-- /wp:paragraph --></blockquote>' .
					'<!-- /wp:quote -->' .
					'<!-- wp:quote -->' .
					'<blockquote class="wp-block-quote"><!-- wp:paragraph -->' .
					'<p>The XYZ Doohickey Company was founded in 1971, and has been providing' .
					'quality doohickeys to the public ever since. Located in Gotham City, XYZ employs' .
					'over 2,000 people and does all kinds of awesome things for the Gotham community.</p>' .
					'<!-- /wp:paragraph --></blockquote>' .
					'<!-- /wp:quote -->',
			),
			array(
				'root_blocks'  => 1,
				'page_content' => '' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:image {"width":"216px","height":"auto","sizeSlug":"large"} -->' .
					'<figure class="wp-block-image size-large is-resized"><img src="#" alt="" style="width:216px;height:auto"/></figure>' .
					'<!-- /wp:image -->' .
					'<!-- wp:paragraph -->' .
					'<p>As a new WordPress user, you should go to <a href="#">your dashboard</a>to delete this page and' .
					'create new pages for your content. Have fun!</p>' .
					'<!-- /wp:paragraph -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group --></div>' .
					'<!-- /wp:group -->',
			),
			array(
				'root_blocks'  => 6,
				'page_content' => '<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->' .
					'<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap"}} -->' .
					'<div class="wp-block-group"><!-- wp:paragraph -->' .
					'<p>Deeply Nested</p>' .
					'<!-- /wp:paragraph --></div>' .
					'<!-- /wp:group -->',
			),
			array(
				'root_blocks'  => 3,
				'page_content' => '<!-- wp:paragraph -->' .
				'<p>Welcome to WordPress. This is your first post. Edit or delete it, then start writing!</p>' .
				'<!-- /wp:paragraph -->' .
				'<!-- wp:block {"ref":215} /-->' .
				'<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"},"margin":{"top":"0","bottom":"0"}}},"layout":{"type":"constrained"}} -->' .
				'<div class="wp-block-group alignfull"' .
				'style="margin-top:0;margin-bottom:0;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)">' .
				'<!-- wp:paragraph -->' .
				'<p>Test</p>' .
				'<!-- /wp:paragraph --></div>' .
				'<!-- /wp:group -->',
			),
		);
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
