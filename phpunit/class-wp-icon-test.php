<?php
/**
 * Tests for the wp_icon() and the_wp_icon() helper functions.
 *
 * @package gutenberg
 */

class WP_Icon_Test extends WP_UnitTestCase {

	public function test_wp_icon_returns_svg_for_known_icon() {
		$output = wp_icon( 'plus' );
		$this->assertStringStartsWith( '<svg ', $output );
		$this->assertStringEndsWith( '</svg>', $output );
	}

	public function test_wp_icon_returns_empty_string_for_unknown_icon() {
		$output = wp_icon( 'this-icon-does-not-exist' );
		$this->assertSame( '', $output );
	}

	public function test_wp_icon_default_attributes() {
		$output = wp_icon( 'plus' );
		$this->assertStringContainsString( 'viewBox="0 0 24 24"', $output );
		$this->assertStringContainsString( 'width="24"', $output );
		$this->assertStringContainsString( 'height="24"', $output );
		$this->assertStringContainsString( 'class="wp-icon"', $output );
		$this->assertStringContainsString( 'fill="currentColor"', $output );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
	}

	public function test_wp_icon_custom_size() {
		$output = wp_icon( 'plus', array( 'size' => 32 ) );
		$this->assertStringContainsString( 'width="32"', $output );
		$this->assertStringContainsString( 'height="32"', $output );
	}

	public function test_wp_icon_custom_class() {
		$output = wp_icon( 'plus', array( 'class' => 'my-button-icon' ) );
		$this->assertStringContainsString( 'class="wp-icon my-button-icon"', $output );
	}

	public function test_wp_icon_with_label() {
		$output = wp_icon( 'plus', array( 'label' => 'Add item' ) );
		$this->assertStringContainsString( 'role="img"', $output );
		$this->assertStringContainsString( 'aria-label="Add item"', $output );
		$this->assertStringNotContainsString( 'aria-hidden', $output );
	}

	public function test_wp_icon_without_label_is_hidden() {
		$output = wp_icon( 'plus' );
		$this->assertStringContainsString( 'aria-hidden="true"', $output );
		$this->assertStringNotContainsString( 'role="img"', $output );
		$this->assertStringNotContainsString( 'aria-label', $output );
	}

	public function test_wp_icon_contains_svg_content() {
		$output = wp_icon( 'plus' );
		$this->assertStringContainsString( '<path ', $output );
	}

	public function test_wp_icon_escapes_attributes() {
		$output = wp_icon( 'plus', array( 'class' => '"><script>alert(1)</script>' ) );
		$this->assertStringNotContainsString( '<script>', $output );
	}

	public function test_wp_icon_non_public_icon_loads_from_file() {
		// 'accordion' is not marked public in manifest.json, so it is not
		// in the registry. It should still be accessible via file fallback.
		$output = wp_icon( 'accordion' );
		$this->assertStringStartsWith( '<svg ', $output );
		$this->assertStringContainsString( '<path ', $output );
	}

	public function test_the_wp_icon_echoes_output() {
		ob_start();
		the_wp_icon( 'plus' );
		$output = ob_get_clean();
		$this->assertSame( wp_icon( 'plus' ), $output );
	}
}
