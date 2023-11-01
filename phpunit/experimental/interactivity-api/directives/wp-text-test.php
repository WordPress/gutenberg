<?php
/**
 * Tests for the wp-text directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the wp-text directive.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_wp_text
 */
class Tests_Directives_WpText extends WP_UnitTestCase {
	public function test_directive_sets_inner_html_based_on_attribute_value_and_escapes_html() {
		$markup = '<div data-wp-text="context.myblock.someText"></div>';

		$tags = new WP_Directive_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'someText' => 'The HTML tag <br> produces a line break.' ) ) );
		$context        = clone $context_before;
		gutenberg_interactivity_process_wp_text( $tags, $context );

		$expected_markup = '<div data-wp-text="context.myblock.someText">The HTML tag &lt;br&gt; produces a line break.</div>';
		$this->assertSame( $expected_markup, $tags->get_updated_html() );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-text directive changed context' );
	}

	public function test_directive_overwrites_inner_html_based_on_attribute_value() {
		$markup = '<div data-wp-text="context.myblock.someText">Lorem ipsum dolor sit.</div>';

		$tags = new WP_Directive_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'someText' => 'Honi soit qui mal y pense.' ) ) );
		$context        = clone $context_before;
		gutenberg_interactivity_process_wp_text( $tags, $context );

		$expected_markup = '<div data-wp-text="context.myblock.someText">Honi soit qui mal y pense.</div>';
		$this->assertSame( $expected_markup, $tags->get_updated_html() );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-text directive changed context' );
	}
}
