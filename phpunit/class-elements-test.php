<?php
/**
 * Test Elements Hook.
 *
 * @package Gutenberg
 */
class Gutenberg_Elements_Test extends WP_UnitTestCase {
	/**
	 * Given a string containing a class prefixed by "wp-elements-" followed by a unique id,
	 * this function returns a string where the id is one instead of being unique.
	 *
	 * @param  string $string String containing unique id classes.
	 * @return string                String where the unique id classes were replaced with "wp-elements-1".
	 */
	private static function make_unique_id_one( $string ) {
		return preg_replace( '/wp-elements-.{13}/', 'wp-elements-1', $string );
	}

	/**
	 * Test gutenberg_render_elements_support() with a simple paragraph and link color preset.
	 */
	public function test_simple_paragraph_link_color() {
		$result = self::make_unique_id_one(
			gutenberg_render_elements_support(
				'<p>Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				array(
					'blockName' => 'core/paragraph',
					'attrs'     => array(
						'style' => array(
							'elements' => array(
								'link' => array(
									'color' => array(
										'text' => 'var:preset|color|subtle-background',
									),
								),
							),
						),
					),
				)
			)
		);
		$this->assertSame(
			$result,
			'<p class="wp-elements-1">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>'
		);
	}

	/**
	 * Test gutenberg_render_elements_support() with a paragraph containing a class.
	 */
	public function test_class_paragraph_link_color() {
		$result = self::make_unique_id_one(
			gutenberg_render_elements_support(
				'<p class="has-dark-gray-background-color has-background">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				array(
					'blockName' => 'core/paragraph',
					'attrs'     => array(
						'style'           => array(
							'elements' => array(
								'link' => array(
									'color' => array(
										'text' => 'red',
									),
								),
							),
						),
						'backgroundColor' => 'dark-gray',
					),
				)
			)
		);
		$this->assertSame(
			$result,
			'<p class="wp-elements-1 has-dark-gray-background-color has-background">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>'
		);
	}

	/**
	 * Test gutenberg_render_elements_support() with a paragraph containing a anchor.
	 */
	public function test_anchor_paragraph_link_color() {
		$result = self::make_unique_id_one(
			gutenberg_render_elements_support(
				'<p id="anchor">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>',
				array(
					'blockName' => 'core/paragraph',
					'attrs'     => array(
						'style' => array(
							'elements' => array(
								'link' => array(
									'color' => array(
										'text' => '#fff000',
									),
								),
							),
						),
					),
				)
			)
		);
		$this->assertSame(
			$result,
			'<p id="anchor" class="wp-elements-1">Hello <a href="http://www.wordpress.org/">WordPress</a>!</p>'
		);
	}
}
