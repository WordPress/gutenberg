<?php
/**
 * Unit tests covering WP_HTML_Attribute_Sourcer functionality.
 *
 * @package WordPress
 * @subpackage HTML
 */

require_once __DIR__ . '/../../lib/experimental/html/class-wp-html-attribute-sourcer.php';

/**
 * @group html
 *
 * @coversDefaultClass WP_HTML_Attribute_Sourcer
 */
class WP_HTML_Attribute_Sourcer_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_sourced_attributes
	 */
	public function test_sources_attributes( $expected, $html, $attributes ) {
		$this->assertSame( $expected, ( new WP_HTML_Attribute_Sourcer( $attributes, $html ) )->source_attributes() );
	}

	public function data_sourced_attributes() {
		return array(
			array(
				array( 'attributes' => array( 'src' => 'image.png' ), 'unparsed' => array() ),
				'<figure><img src="image.png"></figure>',
				array(
					'src' => array(
						'type' => 'string',
						'source' => 'attribute',
						'selector' => 'img',
						'attribute' => 'src'
					),
				),
			),

			array(
				array(
					'attributes' => array( 'content' => '<strong>Just some <em>quirky</em> content</strong>' ),
					'unparsed' => array(),
				),
				'<p><strong>Just some <em>quirky</em> content</strong></p>',
				array(
					'content' => array(
						'type' => 'string',
						'source' => 'html',
						'selector' => 'p'
					)
				)
			),

			array(
				array(
					'attributes' => array( 'content' => '<div>one item</div><div>another item</div>' ),
					'unparsed' => array(),
				),
				'<div class="wp-block-group"><div>one item</div><div>another item</div></div>',
				array(
					'content' => array(
						'type' => 'string',
						'source' => 'html',
						'selector' => '.wp-block-group'
					)
				)
			),

			array(
				array(
					'attributes' => array( 'content' => 'An Important Section' ),
					'unparsed' => array(),
				),
				'<h2>An Important Section</h2>',
				array(
					'content' => array(
						'type' => 'string',
						'source' => 'html',
						'selector' => 'h1,h2,h3,h4,h5,h6'
					)
				)
			),
		);
	}

	/**
	 * @dataProvider data_parsed_block_attribute_definitions
	 */
	public function test_parse_definition( $expected, $input ) {
		$this->assertSame( $expected, WP_HTML_Attribute_Sourcer::parse_definition( $input ) );
	}

	public function data_parsed_block_attribute_definitions() {
		return array(
			array(
				'not-sourced',
				array( 'type' => 'string' ),
			),
			array(
				'unsupported',
				array( 'type' => 'string', 'source' => 'attribute', 'selector' => 'div + img', 'attribute' => 'src' ),
			),
			array(
				'inner-html',
				array( 'type' => 'string', 'source' => 'html' ),
			),
			array(
				array( 'type' => 'html', 'selector' => array( 'type' => 'element', 'identifier' => 'code' ) ),
				array( 'type' => 'string', 'source' => 'html', 'selector' => 'code' ),
			),
			array(
				array( 'type' => 'attribute', 'selector' => array( 'type' => 'element', 'identifier' => 'img' ), 'attribute' => 'src' ),
				array( 'type' => 'string', 'source' => 'attribute', 'selector' => 'img', 'attribute' => 'src' ),
			),
		);
	}

	/**
	 * @dataProvider data_parsed_css_selectors
	 */
	public function test_parses_css_selector( $expected, $input ) {
		$this->assertSame($expected, WP_HTML_Attribute_Sourcer::parse_selector( $input ) );
	}

	public function data_parsed_css_selectors() {
		return array(
			array( array( 'type' => 'element', 'identifier' => 'img' ), 'img' ),
			array( array( 'type' => 'class', 'identifier' => 'block-group' ), '.block-group' ),
			array( array( 'type' => 'hash', 'identifier' => 'input-form' ), '#input-form' ),
		);
	}

	/**
	 * @dataProvider data_multi_parsed_css_selectors
	 */
	public function test_parses_multi_css_selectors( $expected, $input ) {
		$this->assertSame( $expected, WP_HTML_Attribute_Sourcer::parse_selector( $input ) );
	}

	public function data_multi_parsed_css_selectors() {
		return array(
			array(
				array(
					array( 'type' => 'element', 'identifier' => 'img' ),
					array( 'type' => 'class', 'identifier' => 'full-width' ),
				),
				'img, .full-width'
			),
			array(
				array(
					array( 'type' => 'element', 'identifier' => 'h1' ),
					array( 'type' => 'element', 'identifier' => 'h2' ),
					array( 'type' => 'element', 'identifier' => 'h3' ),
					array( 'type' => 'element', 'identifier' => 'h4' ),
					array( 'type' => 'element', 'identifier' => 'h5' ),
					array( 'type' => 'element', 'identifier' => 'h6' ),
				),
				'h1,h2,h3,h4,h5,h6'
			)
		);
	}

	/**
	 * @dataProvider data_identifier_from_selector
	 * @return void
	 */
	public function test_parses_css_identifier( $expected, $input ) {
		$this->assertEquals( $expected, WP_HTML_Attribute_Sourcer::parse_css_identifier( $input ) );
	}

	public function data_identifier_from_selector() {
		return array(
			array( 'div', 'div > img' ),
			array( '-ident', '-ident.class#id' )
		);
	}
}
