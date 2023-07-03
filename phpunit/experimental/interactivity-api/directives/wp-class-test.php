<?php
/**
 * Tests for the wp-class directive.
 *
 * @package Gutenberg
 * @subpackage Interactivity API
 */

/**
 * Tests for the wp-class directive.
 *
 * @group  interactivity-api
 * @covers gutenberg_interactivity_process_wp_class
 */
class Tests_Directives_WpClass extends WP_UnitTestCase {
	public function test_directive_adds_class() {
		$markup = '<div data-wp-class--red="context.myblock.isRed" class="blue">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'isRed' => true ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_class( $tags, $context );

		$this->assertSame(
			'<div data-wp-class--red="context.myblock.isRed" class="blue red">Test</div>',
			$tags->get_updated_html()
		);
		$this->assertStringContainsString( 'red', $tags->get_attribute( 'class' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-class directive changed context' );
	}

	public function test_directive_removes_class() {
		$markup = '<div data-wp-class--blue="context.myblock.isBlue" class="red blue">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'isBlue' => false ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_class( $tags, $context );

		$this->assertSame(
			'<div data-wp-class--blue="context.myblock.isBlue" class="red">Test</div>',
			$tags->get_updated_html()
		);
		$this->assertStringNotContainsString( 'blue', $tags->get_attribute( 'class' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-class directive changed context' );
	}

	public function test_directive_removes_empty_class_attribute() {
		$markup = '<div data-wp-class--blue="context.myblock.isBlue" class="blue">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'isBlue' => false ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_class( $tags, $context );

		$this->assertSame(
			// WP_HTML_Tag_Processor has a TODO note to prune whitespace after classname removal.
			'<div data-wp-class--blue="context.myblock.isBlue" >Test</div>',
			$tags->get_updated_html()
		);
		$this->assertNull( $tags->get_attribute( 'class' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-class directive changed context' );
	}

	public function test_directive_does_not_remove_non_existant_class() {
		$markup = '<div data-wp-class--blue="context.myblock.isBlue" class="green red">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'isBlue' => false ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_class( $tags, $context );

		$this->assertSame(
			'<div data-wp-class--blue="context.myblock.isBlue" class="green red">Test</div>',
			$tags->get_updated_html()
		);
		$this->assertSame( 'green red', $tags->get_attribute( 'class' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-class directive changed context' );
	}

	public function test_directive_ignores_empty_class_name() {
		$markup = '<div data-wp-class.="context.myblock.isRed" class="blue">Test</div>';
		$tags   = new WP_HTML_Tag_Processor( $markup );
		$tags->next_tag();

		$context_before = new WP_Directive_Context( array( 'myblock' => array( 'isRed' => true ) ) );
		$context        = $context_before;
		gutenberg_interactivity_process_wp_class( $tags, $context );

		$this->assertSame( $markup, $tags->get_updated_html() );
		$this->assertStringNotContainsString( 'red', $tags->get_attribute( 'class' ) );
		$this->assertSame( $context_before->get_context(), $context->get_context(), 'data-wp-class directive changed context' );
	}
}
