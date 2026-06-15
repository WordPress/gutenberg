<?php
/**
 * Unit tests covering WP_Icons_Registry_Gutenberg::sanitize_icon_content functionality.
 *
 * @package Gutenberg
 */
class WP_Test_Icons_Registry_Gutenberg_Sanitize extends WP_UnitTestCase {

	/**
	 * Registry instance for testing.
	 *
	 * @var WP_Icons_Registry_Gutenberg
	 */
	private $registry;

	/**
	 * Sets up the test fixture.
	 */
	public function set_up() {
		parent::set_up();
		$this->registry = WP_Icons_Registry_Gutenberg::get_instance();
	}

	public function tear_down() {
		$instance_property = new ReflectionProperty( WP_Icons_Registry_Gutenberg::class, 'instance' );

		/*
		 * ReflectionProperty::setAccessible is:
		 * - redundant as of 8.1.0, which made all properties accessible
		 * - deprecated as of 8.5.0
		 * - needed until 8.1.0, as property `instance` is private
		 */
		if ( PHP_VERSION_ID < 80100 ) {
			$instance_property->setAccessible( true );
		}

		$instance_property->setValue( null, null );

		$this->registry = null;
		parent::tear_down();
	}

	/**
	 * Invokes the WP_Icons_Registry_Gutenberg::sanitize_icon_content method on the registry instance.
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
	 * @covers WP_Icons_Registry_Gutenberg::sanitize_icon_content
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
			'extracts only first svg when multiple present' => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="first"/></svg><svg xmlns="http://www.w3.org/2000/svg"><path d="second"/></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="first" /></svg>',
			),
			'returns empty svg when html-like tags present' => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><p>paragraph content</p><path d="M0 0h24v24H0z" /><div>div content</div></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"></svg>',
			),
			'strips namespace attributes'                 => array(
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /></svg>',
			),

			// Dangerous content is stripped (wp_kses).
			'strips foreignObject but keeps text content' => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><p>paragraph content</p><script>alert(1)</script></foreignObject><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg">paragraph contentalert(1)<path d="M0 0h24v24H0z" /></svg>',
			),
			'strips script tags'                          => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg">alert(1)<path d="M0 0h24v24H0z" /></svg>',
			),
			'strips event handlers'                       => array(
				'<svg xmlns="http://www.w3.org/2000/svg" onclick="alert(1)"><path d="M0 0h24v24H0z" onload="evil()" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /></svg>',
			),
			'strips javascript protocol in href'          => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="javascript:alert(1)" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="alert(1)" /></svg>',
			),
			'strips data protocol in href'                => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="data:text/html,<script>alert(1)</script>" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><use href="text/html,&lt;script&gt;alert(1)&lt;/script&gt;" /></svg>',
			),
			'strips disallowed tags'                      => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/><iframe src="evil"></iframe><object data="x" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
			),

			// Returns empty string when input is not SVG.
			'returns empty for empty string'              => array(
				'',
				'',
			),
			'returns empty for whitespace only'           => array(
				"   \n\t  ",
				'',
			),
			'returns empty for plain text'                => array(
				'plain text without svg',
				'',
			),
			'returns empty for html without svg'          => array(
				'<div>not svg</div><p>content</p>',
				'',
			),
			'returns empty when svg is not first element' => array(
				'<p>before</p><svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0" /></svg>',
				'',
			),

			// Root SVG element.
			'preserves root svg element'                  => array(
				'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg" viewbox="0 0 24 24" preserveaspectratio="xMidYMid meet" width="24" height="24" class="icon" aria-hidden="true"><path d="M0 0" fill="currentColor" /></svg>',
			),
			// Basic shape elements.
			'preserves basic shape elements'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="10" ry="8" /><line x1="0" y1="0" x2="24" y2="24" /><polygon points="0,0 24,0 12,24" /><polyline points="0,0 12,12 24,0" /><rect x="2" y="2" width="20" height="20" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0h24v24H0z" /><circle cx="12" cy="12" r="10" /><ellipse cx="12" cy="12" rx="10" ry="8" /><line x1="0" y1="0" x2="24" y2="24" /><polygon points="0,0 24,0 12,24" /><polyline points="0,0 12,12 24,0" /><rect x="2" y="2" width="20" height="20" /></svg>',
			),
			// Grouping and structural elements.
			'preserves grouping and structural elements'  => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol id="icon" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" /></symbol><clipPath id="clip"><circle cx="12" cy="12" r="10" /></clipPath><mask id="m"><rect fill="white" width="24" height="24" /></mask></defs><g><use href="#icon" /><use href="https://example.com/icon.svg#symbol" /><use href="#symbol" /></g></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><defs><symbol id="icon" viewbox="0 0 24 24"><path d="M0 0h24v24H0z" /></symbol><clipPath id="clip"><circle cx="12" cy="12" r="10" /></clipPath><mask id="m"><rect fill="white" width="24" height="24" /></mask></defs><g><use href="#icon" /><use href="https://example.com/icon.svg#symbol" /><use href="#symbol" /></g></svg>',
			),
			'preserves switch element'                    => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><switch><path d="M0 0h24v24H0z" /></switch></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><switch><path d="M0 0h24v24H0z" /></switch></svg>',
			),
			'preserves view element'                      => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><view id="v" viewBox="0 0 24 24" /><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><view id="v" viewbox="0 0 24 24" /><path d="M0 0h24v24H0z" /></svg>',
			),
			'preserves linking element'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com"><path d="M0 0h24v24H0z" /></a></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><a href="https://example.com"><path d="M0 0h24v24H0z" /></a></svg>',
			),
			// Gradient elements.
			'preserves gradient elements'                 => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><linearGradient id="lin"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></linearGradient><radialGradient id="rad"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></radialGradient><rect fill="url(#lin)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><linearGradient id="lin"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></linearGradient><radialGradient id="rad"><stop offset="0%" stop-color="red" /><stop offset="100%" stop-color="blue" /></radialGradient><rect fill="url(#lin)" width="24" height="24" /></svg>',
			),
			// Pattern element.
			'preserves pattern element'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><pattern id="pat" width="4" height="4"><rect width="4" height="4" fill="currentColor" /></pattern><rect fill="url(#pat)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><pattern id="pat" width="4" height="4"><rect width="4" height="4" fill="currentColor" /></pattern><rect fill="url(#pat)" width="24" height="24" /></svg>',
			),
			// Filter elements.
			'preserves filter elements'                   => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><filter id="blur"><feGaussianBlur in="SourceGraphic" stdDeviation="1" /></filter><rect filter="url(#blur)" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><filter id="blur"><feGaussianBlur in="SourceGraphic" stddeviation="1" /></filter><rect filter="url(#blur)" width="24" height="24" /></svg>',
			),
			// Text elements.
			'preserves text elements'                     => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="M0,20 Q12,0 24,20" /><text x="12" y="16" text-anchor="middle">A<tspan font-weight="bold">B</tspan></text><text><textPath href="#p">path</textPath></text></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><path id="p" d="M0,20 Q12,0 24,20" /><text x="12" y="16" text-anchor="middle">A<tspan font-weight="bold">B</tspan></text><text><textPath href="#p">path</textPath></text></svg>',
			),
			// Descriptive elements.
			'preserves descriptive elements'              => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><metadata></metadata><path d="M0 0h24v24H0z" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><title>Icon title</title><desc>Description</desc><metadata></metadata><path d="M0 0h24v24H0z" /></svg>',
			),
			// Image element.
			'preserves image element'                     => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/icon.png" width="24" height="24" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/icon.png" width="24" height="24" /></svg>',
			),
			// Marker element.
			'preserves marker element'                    => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><marker id="arrow" refX="10" refY="5"><path d="M0,0 L10,5 L0,10" /></marker><path d="M0,12 L24,12" marker-start="url(#arrow)" /></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><marker id="arrow" refx="10" refy="5"><path d="M0,0 L10,5 L0,10" /></marker><path d="M0,12 L24,12" marker-start="url(#arrow)" /></svg>',
			),
			// Animation elements.
			'preserves animation elements'                => array(
				'<svg xmlns="http://www.w3.org/2000/svg"><animate attributeName="opacity" from="1" to="0.5" dur="1s" /><animateTransform attributeName="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" /><path d="M0,0 L10,10"><animateMotion path="M0,0 L24,24" dur="1s" /></path><path d="M0 0"><set attributeName="opacity" to="0.5" begin="1s" /></path></svg>',
				'<svg xmlns="http://www.w3.org/2000/svg"><animate attributename="opacity" from="1" to="0.5" dur="1s" /><animateTransform attributename="transform" type="rotate" from="0 12 12" to="360 12 12" dur="2s" /><path d="M0,0 L10,10"><animateMotion path="M0,0 L24,24" dur="1s" /></path><path d="M0 0"><set attributename="opacity" to="0.5" begin="1s" /></path></svg>',
			),
		);
	}
}
