<?php
/**
 * Tests for the `translate` property and its axis custom properties in inline styles.
 *
 * @package gutenberg
 */

class Gutenberg_Kses_Translate_Test extends WP_UnitTestCase {
	/**
	 * @dataProvider data_kept_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_lengths_and_functions_are_kept( $css ) {
		$this->assertSame( $css, safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_kept_declarations() {
		return array(
			'two axes'        => array( 'translate: 10px -50%' ),
			'one axis'        => array( 'translate: 1.5rem' ),
			'zero'            => array( 'translate: 0 0' ),
			'viewport'        => array( 'translate: 10dvw 5svh' ),
			'container'       => array( 'translate: 2cqi 0' ),
			'font-based'      => array( 'translate: -1em 2ch' ),
			'axis properties' => array( 'translate: var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0)' ),
			// Core allows `var()` and `calc()` in other properties too.
			'var()'           => array( 'translate: var(--offset)' ),
			'calc()'          => array( 'translate: calc(1px + 2px)' ),
			'x axis'          => array( '--wp--style--translate-x: 10px' ),
			'y axis'          => array( '--wp--style--translate-y: -50%' ),
		);
	}

	/**
	 * @dataProvider data_dropped_declarations
	 *
	 * @param string $css CSS declaration.
	 */
	public function test_other_values_are_dropped( $css ) {
		$this->assertSame( '', safecss_filter_attr( $css ) );
	}

	/**
	 * Data provider.
	 *
	 * @return array[]
	 */
	public function data_dropped_declarations() {
		return array(
			'z axis'           => array( 'translate: 1px 2px 3px' ),
			'bare number'      => array( 'translate: 10 20' ),
			'angle'            => array( 'translate: 5deg' ),
			'keyword'          => array( 'translate: none' ),
			'axis keyword'     => array( '--wp--style--translate-x: red' ),
			'axis list'        => array( '--wp--style--translate-x: 1px 2px' ),
			'axis calc()'      => array( '--wp--style--translate-y: calc(1px + 2px)' ),
			'axis bare number' => array( '--wp--style--translate-y: 10' ),
		);
	}

	public function test_offset_survives_post_kses_without_unfiltered_html() {
		$author = self::factory()->user->create( array( 'role' => 'author' ) );
		wp_set_current_user( $author );
		$this->assertFalse( current_user_can( 'unfiltered_html' ) );
		kses_init();

		$content = '<div class="wp-block-group" style="--wp--style--translate-y:-6px;translate:var(--wp--style--translate-x, 0) var(--wp--style--translate-y, 0)"></div>';
		$post_id = self::factory()->post->create( array( 'post_content' => $content ) );

		kses_remove_filters();
		$this->assertSame( $content, get_post( $post_id )->post_content );
	}
}
