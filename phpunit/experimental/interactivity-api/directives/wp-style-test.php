<?php
/**
 * Tests for the wp-style directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the wp-style directive.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_wp_style
 */
class Tests_Directives_WpStyle extends WP_UnitTestCase {
	public function test_directive_adds_style() {
		$markup = '<div data-wp-style--color="context.myblock.color" style="background: blue;">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'color' => 'green' ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_style( $tags, $context );

		$this->assertSame(
			'<div data-wp-style--color="context.myblock.color" style="background: blue;color: green;">Test</div>',
			$tags->get_updated_html()
		);
		$this->assertStringContainsString( 'color: green;', $tags->get_attribute( 'style' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-style directive changed context' );
	}

	public function test_directive_ignores_empty_style() {
		$markup = '<div data-wp-style.="context.myblock.color" style="background: blue;">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'color' => 'green' ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_style( $tags, $context );

		$this->assertSame( $markup, $tags->get_updated_html() );
		$this->assertStringNotContainsString( 'color: green;', $tags->get_attribute( 'style' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-style directive changed context' );
	}
}
