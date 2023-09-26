<?php
/**
 * Tests for the wp-context directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the wp-context directive.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_wp_context
 */
class Tests_Directives_Attributes_WpContext extends WP_UnitTestCase {
	public function test_directive_merges_context_correctly_upon_wp_context_attribute_on_opening_tag() {
		$context = new WP_Directive_Context(
			array(
				'myblock'    => array( 'open' => false ),
				'otherblock' => array( 'somekey' => 'somevalue' ),
			)
		);

		$markup = '<div data-wp-context=\'{ "myblock": { "open": true } }\'>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		gutenberg_interactivity_process_wp_context( $tags, $context );

		$this->assertSame(
			array(
				'myblock'    => array( 'open' => true ),
				'otherblock' => array( 'somekey' => 'somevalue' ),
			),
			$context->get_context()
		);
	}

	public function test_directive_resets_context_correctly_upon_closing_tag() {
		$context = new WP_Directive_Context(
			array( 'my-key' => 'original-value' )
		);

		$context->set_context(
			array( 'my-key' => 'new-value' )
		);

		$markup = '</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag( array( 'tag_closers' => 'visit' ) );

		gutenberg_interactivity_process_wp_context( $tags, $context );

		$this->assertSame(
			array( 'my-key' => 'original-value' ),
			$context->get_context()
		);
	}

	public function test_directive_doesnt_throw_on_malformed_context_objects() {
		$context = new WP_Directive_Context(
			array( 'my-key' => 'some-value' )
		);

		$markup = '<div data-wp-context=\'{ "wrong_json_object: }\'>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		gutenberg_interactivity_process_wp_context( $tags, $context );

		$this->assertSame(
			array( 'my-key' => 'some-value' ),
			$context->get_context()
		);
	}
}
