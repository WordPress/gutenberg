<?php
/**
 * Tests for the wp_get_icon() helper function.
 *
 * @package gutenberg
 */

class WP_Icon_Test extends WP_UnitTestCase {

	public function test_returns_svg_for_known_icon() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringStartsWith( '<svg ', $output );
		$this->assertStringContainsString( '</svg>', $output );
	}

	public function test_returns_empty_string_for_unknown_icon() {
		$output = wp_get_icon( 'this-icon-does-not-exist' );
		$this->assertSame( '', $output );
	}

	public function test_default_attributes() {
		$output = wp_get_icon( 'core/plus' );
		// WP_HTML_Tag_Processor lowercases attribute names.
		$this->assertStringContainsString( 'viewbox="0 0 24 24"', $output );
		$this->assertStringContainsString( 'width="24"', $output );
		$this->assertStringContainsString( 'height="24"', $output );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
		$this->assertStringContainsString( 'focusable="false"', $output );
	}

	public function test_custom_size() {
		$output = wp_get_icon( 'core/plus', array( 'size' => 32 ) );
		$this->assertStringContainsString( 'width="32"', $output );
		$this->assertStringContainsString( 'height="32"', $output );
	}

	public function test_size_null_leaves_dimensions_untouched() {
		$output = wp_get_icon( 'core/plus', array( 'size' => null ) );
		$this->assertStringNotContainsString( 'width=', $output );
		$this->assertStringNotContainsString( 'height=', $output );
	}

	public function test_custom_class() {
		$output = wp_get_icon( 'core/plus', array( 'class' => 'my-button-icon' ) );
		$this->assertStringContainsString( 'class="my-button-icon"', $output );
	}

	public function test_multiple_classes() {
		$output = wp_get_icon( 'core/plus', array( 'class' => 'foo bar baz' ) );
		$this->assertStringContainsString( 'class="foo bar baz"', $output );
	}

	public function test_with_label() {
		$output = wp_get_icon( 'core/plus', array( 'label' => 'Add item' ) );
		$this->assertStringContainsString( 'role="img"', $output );
		$this->assertStringContainsString( 'aria-label="Add item"', $output );
		$this->assertStringNotContainsString( 'aria-hidden', $output );
		$this->assertStringNotContainsString( 'focusable', $output );
	}

	public function test_without_label_is_hidden() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
		$this->assertStringContainsString( 'focusable="false"', $output );
		$this->assertStringNotContainsString( 'role="img"', $output );
		$this->assertStringNotContainsString( 'aria-label', $output );
	}

	public function test_contains_svg_content() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringContainsString( '<path ', $output );
	}

	public function test_escapes_attributes() {
		$output = wp_get_icon( 'core/plus', array( 'class' => '"><script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>', $output );
	}

	public function test_filter_can_modify_output() {
		$filter = function ( $html, $name ) {
			return '<!-- ' . $name . ' -->' . $html;
		};
		add_filter( 'wp_icon_html', $filter, 10, 2 );
		$output = wp_get_icon( 'core/plus' );
		remove_filter( 'wp_icon_html', $filter, 10 );
		$this->assertStringStartsWith( '<!-- core/plus --><svg ', $output );
	}
}
