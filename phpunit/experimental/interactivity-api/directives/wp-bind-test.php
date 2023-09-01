<?php
/**
 * Tests for the wp-bind directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the wp-bind directive.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_wp_bind
 */
class Tests_Directives_WpBind extends WP_UnitTestCase {
	public function test_directive_sets_attribute() {
		$markup = '<img data-wp-bind--src="context.myblock.imageSource" />';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'imageSource' => './wordpress.png' ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_bind( $tags, $context );

		$this->assertSame(
			'<img src="./wordpress.png" data-wp-bind--src="context.myblock.imageSource" />',
			$tags->get_updated_html()
		);
		$this->assertSame( './wordpress.png', $tags->get_attribute( 'src' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-bind directive changed context' );
	}

	public function test_directive_ignores_empty_bound_attribute() {
		$markup = '<img data-wp-bind.="context.myblock.imageSource" />';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'imageSource' => './wordpress.png' ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_bind( $tags, $context );

		$this->assertSame( $markup, $tags->get_updated_html() );
		$this->assertNull( $tags->get_attribute( 'src' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-bind directive changed context' );
	}
}
