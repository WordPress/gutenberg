<?php
/**
 * Unit tests covering Gutenberg_Icons_Registry_7_1::sanitize_icon_content functionality.
 *
 * @package Gutenberg
 */
class Gutenberg_Icons_Registry_7_1_Test extends WP_UnitTestCase {

	/**
	 * Registry instance for testing.
	 *
	 * @var Gutenberg_Icons_Registry_7_1
	 */
	private $registry;

	/**
	 * Sets up the test fixture.
	 */
	public function set_up() {
		parent::set_up();
		$this->registry = Gutenberg_Icons_Registry_7_1::get_instance();
	}

	/**
	 * Invokes the Gutenberg_Icons_Registry_7_1::register method on the registry instance.
	 *
	 * @param string $icon_name       Icon name including namespace.
	 * @param array  $icon_properties Icon properties (label, content, filePath).
	 * @return bool True if the icon was registered successfully.
	 */
	private function register( $icon_name, $icon_properties ) {
		$method = new ReflectionMethod( $this->registry, 'register' );
		$method->setAccessible( true );
		return $method->invoke( $this->registry, $icon_name, $icon_properties );
	}

	/**
	 * Invokes the Gutenberg_Icons_Registry_7_1::sanitize_icon_content method on the registry instance.
	 *
	 * @param string $icon_content The icon SVG content to sanitize.
	 * @return string The sanitized icon SVG content.
	 */
	private function sanitize_icon_content( $icon_content ) {
		$method = new ReflectionMethod( $this->registry, 'sanitize_icon_content' );
		$method->setAccessible( true );
		return $method->invoke( $this->registry, $icon_content );
	}

	/**
	 * @dataProvider data_sanitize_icon_content
	 * @covers Gutenberg_Icons_Registry_7_1::sanitize_icon_content
	 *
	 * @param string $input    The icon content to sanitize.
	 * @param string $expected The expected sanitized output.
	 */
	public function test_sanitize_icon_content( $input, $expected ) {
		$sanitized = $this->sanitize_icon_content( $input );
		$this->assertSame( $expected, $sanitized );
	}

	/**
	 * Data provider for test_sanitize_icon_content.
	 *
	 * @return array[] Array of arrays with input and expected sanitized output.
	 */
	public function data_sanitize_icon_content() {
		return array(
			'strips script tags'                  => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg">alert(1)<path d="M0 0h24v24H0z" /></svg>',
			),
			'strips event handlers'               => array(
				'<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0h24v24H0z" onload="evil()" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /></svg>',
			),
			'returns empty for plain text'        => array(
				'plain text without svg',
				'',
			),
			'returns empty for html without svg'  => array(
				'<div>not svg</div><p>content</p>',
				'',
			),
			'allows https in href'                => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/icon.svg#symbol" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="https://example.com/icon.svg#symbol" /></svg>',
			),
			'strips javascript protocol in href'  => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="javascript:alert(1)" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="alert(1)" /></svg>',
			),
			'preserves allowed attributes'        => array(
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
			),
			'preserves allowed elements'          => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><rect x="2" y="2" width="20" height="20" /><g><path d="M0 0" /></g></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" /><rect x="2" y="2" width="20" height="20" /><g><path d="M0 0" /></g></svg>',
			),
			'strips disallowed tags'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/><iframe src="evil"></iframe><object data="x" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),
			'keeps svg with inner title and desc' => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><path d="M0 0h24v24H0z" /></svg>',
			),
		);
	}
}
