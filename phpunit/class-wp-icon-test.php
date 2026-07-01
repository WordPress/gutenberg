<?php
/**
 * Tests for the wp_get_icon() helper function.
 *
 * @package gutenberg
 */

class Tests_Icons_WpGetIcon extends WP_UnitTestCase {

	public function test_wp_get_icon_returns_svg_for_known_icon() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringStartsWith( '<svg ', $output );
		$this->assertStringContainsString( '</svg>', $output );
	}

	public function test_wp_get_icon_returns_empty_string_for_unknown_icon() {
		$output = wp_get_icon( 'this-icon-does-not-exist' );
		$this->assertSame( '', $output );
	}

	public function test_wp_get_icon_default_attributes() {
		$output = wp_get_icon( 'core/plus' );
		// WP 7.0+ lowercases `viewBox` to `viewbox` via the HTML API in
		// `wp_kses()`; older versions keep the original casing.
		$this->assertStringContainsStringIgnoringCase( 'viewbox="0 0 24 24"', $output );
		$this->assertStringContainsString( 'width="24"', $output );
		$this->assertStringContainsString( 'height="24"', $output );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
		$this->assertStringContainsString( 'focusable="false"', $output );
	}

	public function test_wp_get_icon_custom_size() {
		$output = wp_get_icon( 'core/plus', array( 'size' => 32 ) );
		$this->assertStringContainsString( 'width="32"', $output );
		$this->assertStringContainsString( 'height="32"', $output );
	}

	public function test_wp_get_icon_size_null_leaves_dimensions_untouched() {
		$output = wp_get_icon( 'core/plus', array( 'size' => null ) );
		$this->assertStringNotContainsString( 'width=', $output );
		$this->assertStringNotContainsString( 'height=', $output );
	}

	public function test_wp_get_icon_size_zero_outputs_zero_dimensions() {
		$output = wp_get_icon( 'core/plus', array( 'size' => 0 ) );
		$this->assertStringContainsString( 'width="0"', $output );
		$this->assertStringContainsString( 'height="0"', $output );
	}

	public function test_wp_get_icon_custom_class() {
		$output = wp_get_icon( 'core/plus', array( 'class' => 'my-button-icon' ) );
		$this->assertStringContainsString( 'class="my-button-icon"', $output );
	}

	public function test_wp_get_icon_multiple_classes() {
		$output = wp_get_icon( 'core/plus', array( 'class' => 'foo bar baz' ) );
		$this->assertStringContainsString( 'class="foo bar baz"', $output );
	}

	public function test_wp_get_icon_with_label() {
		$output = wp_get_icon( 'core/plus', array( 'label' => 'Add item' ) );
		$this->assertStringContainsString( 'role="img"', $output );
		$this->assertStringContainsString( 'aria-label="Add item"', $output );
		$this->assertStringNotContainsString( 'aria-hidden', $output );
		$this->assertStringNotContainsString( 'focusable', $output );
	}

	public function test_wp_get_icon_without_label_is_hidden() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
		$this->assertStringContainsString( 'focusable="false"', $output );
		$this->assertStringNotContainsString( 'role="img"', $output );
		$this->assertStringNotContainsString( 'aria-label', $output );
	}

	public function test_wp_get_icon_contains_svg_content() {
		$output = wp_get_icon( 'core/plus' );
		$this->assertStringContainsString( '<path ', $output );
	}

	public function test_wp_get_icon_escapes_attributes() {
		$output = wp_get_icon( 'core/plus', array( 'class' => '"><script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>', $output );
	}
}
