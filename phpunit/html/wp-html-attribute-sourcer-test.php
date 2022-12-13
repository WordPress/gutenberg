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
				array( 'attributes' => array( 'link' => 'docs.html' ), 'unparsed' => array() ),
				<<<EOF
<main>
	<section>Just another section</section>
	<section><div><a href="blah">blah</a></div></section>
	<p>Stuff</p>
	<div><a href="blarg">blarg</a></div>
	<section>Still another section</section>
	<div><img><a href="image">image</a></div>
	<section>Still another section</section>
	<div><a href="docs.html">docs</a></div>
</main>
EOF,
				array(
					'link' => array(
						'type' => 'string',
						'source' => 'attribute',
						'selector' => 'main section + div > a[href]',
						'attribute' => 'href',
					),
				),
			),

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

			array(
				array(
					'attributes' => array( 'url' => 'poster.pdf' ),
					'unparsed' => array(),
				),
				'<a href="some-link">Some Place</a><a download href="poster.pdf">Download the poster</a><a>No Link</a>',
				array(
					'url' => array(
						'type' => 'string',
						'source' => 'attribute',
						'attribute' => 'href',
						'selector' => 'a[download]',
					),
				),
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
				array( 'type' => 'attribute', 'selector' => array( array( 'tag_name' => 'div', 'then' => array( 'tag_name' => 'img', 'combinator' => '+' ) ) ), 'attribute' => 'src' ),
				array( 'type' => 'string', 'source' => 'attribute', 'selector' => 'div + img', 'attribute' => 'src' ),
			),
			array(
				'inner-html',
				array( 'type' => 'string', 'source' => 'html' ),
			),
			array(
				array( 'type' => 'html', 'selector' => array( array( 'tag_name' => 'code' ) ) ),
				array( 'type' => 'string', 'source' => 'html', 'selector' => 'code' ),
			),
			array(
				array( 'type' => 'attribute', 'selector' => array( array( 'tag_name' => 'img' ) ), 'attribute' => 'src' ),
				array( 'type' => 'string', 'source' => 'attribute', 'selector' => 'img', 'attribute' => 'src' ),
			),
		);
	}

	/**
	 * @dataProvider data_parsed_css_selectors
	 */
	public function test_parses_css_selector( $expected, $input ) {
		$this->assertSame($expected, WP_HTML_Attribute_Sourcer::parse_full_selector( $input ) );
	}

	public function data_parsed_css_selectors() {
		return array(
			array( array( array( 'tag_name' => 'img' ) ), 'img' ),
			array( array( array( 'class_names' => array( 'block-group' ) ) ), '.block-group' ),
			array( array( array( 'hash' => 'input-form' ) ), '#input-form' ),
			array(
				array(
					array(
						'tag_name' => 'div',
						'then' => array(
							'class_names' => array( 'important' ),
							'combinator' => '>',
						)
					)
				),
				'div > .important',
			),
			array(
				array(
					array(
						'tag_name' => 'img',
						'then' => array(
							'tag_name' => 'p',
							'combinator' => '+',
						)
					)
				),
				'img + p',
			),
			array(
				array(
					array(
						'tag_name' => 'img',
						'then' => array(
							'tag_name' => 'p',
							'combinator' => '~',
						)
					)
				),
				'img ~ p',
			),
			array(
				array(
					array(
						'tag_name' => 'main',
						'then' => array(
							'tag_name' => 'section',
							'then' => array(
								'class_names' => array( 'title' ),
								'combinator' => '+',
							),
							'combinator' => '>',
						)
					),
					array( 'hash' => 'title' )
				),
				'main > section + .title, #title',
			),
			array(
				array(
					array(
						'tag_name' => 'li',
						'then' => array(
							'tag_name' => 'em',
							'combinator' => ' ',
						)
					)
				),
				'li em',
			),
			array(
				array(
					array(
						'tag_name' => 'main',
						'then' => array(
							'tag_name' => 'section',
							'then' => array(
								'class_names' => array( 'title' ),
								'combinator' => '+',
							),
							'combinator' => '>',
						)
					),
					array(
						'hash' => 'title',
						'then' => array(
							'tag_name' => 'h2',
							'then' => array(
								'tag_name' => 'em',
								'then' => array(
									'class_names' => array( 'really' ),
									'combinator' => ' '
								),
								'combinator' => ' ',
							),
							'combinator' => '~',
						),
					),
					array(
						'class_names' => array(
							'another',
							'class',
							'combined',
						),
					),
				),
				'main > section + .title, #title ~ h2 em .really, .another.class.combined',
			)
		);
	}

	/**
	 * @dataProvider data_multi_parsed_css_selectors
	 */
	public function test_parses_multi_css_selectors( $expected, $input ) {
		$this->assertSame( $expected, WP_HTML_Attribute_Sourcer::parse_full_selector( $input ) );
	}

	public function data_multi_parsed_css_selectors() {
		return array(
			array(
				array(
					array( 'tag_name' => 'img' ),
					array( 'class_names' => array( 'full-width' ) ),
				),
				'img, .full-width'
			),
			array(
				array(
					array( 'tag_name' => 'h1' ),
					array( 'tag_name' => 'h2' ),
					array( 'tag_name' => 'h3' ),
					array( 'tag_name' => 'h4' ),
					array( 'tag_name' => 'h5' ),
					array( 'tag_name' => 'h6' ),
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
