<?php
/**
 * Tests for loading the MathML stylesheet.
 *
 * @package Gutenberg
 */

class Latex_To_MathML_Styles_Test extends WP_UnitTestCase {

	public function set_up() {
		parent::set_up();
		global $wp_styles;
		$wp_styles = null;
		wp_register_style( 'wp-latex-to-mathml', false );
	}

	public function tear_down() {
		global $wp_styles;
		$wp_styles = null;
		parent::tear_down();
	}

	/**
	 * @covers ::gutenberg_enqueue_mathml_style
	 */
	public function test_enqueues_the_stylesheet_for_inline_math_in_any_block(): void {
		do_blocks( '<!-- wp:paragraph --><p>Inline <math data-latex="x^2"><msup><mi>x</mi><mn>2</mn></msup></math>.</p><!-- /wp:paragraph -->' );

		$this->assertTrue( wp_style_is( 'wp-latex-to-mathml', 'enqueued' ) );
	}

	/**
	 * @covers ::gutenberg_enqueue_mathml_style
	 */
	public function test_does_not_enqueue_the_stylesheet_without_math(): void {
		do_blocks( '<!-- wp:paragraph --><p>Text about &lt;math&gt; and mathematics.</p><!-- /wp:paragraph -->' );

		$this->assertFalse( wp_style_is( 'wp-latex-to-mathml', 'enqueued' ) );
	}
}
