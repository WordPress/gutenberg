<?php
/**
 * Directive processing test.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

class Helper_Class {
	function process_foo_test( $tags, $context ) {
	}
}

/**
 * Tests for the wp_process_directives function.
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
							function( $p ) {
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
}
