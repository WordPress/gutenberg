<?php
/**
 * Tests script and style loading.
 *
 * @package Gutenberg
 */

class WP_Script_Loader_Test extends WP_UnitTestCase {
	/**
	 * Cleans up global scope.
	 *
	 * @global WP_Styles $wp_styles
	 */
	public function clean_up_global_scope() {
		global $wp_styles; // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		parent::clean_up_global_scope();
		$wp_styles = null;
	}
	/**
	 * Tests that stored CSS is enqueued.
	 *
	 * @covers ::wp_enqueue_stored_styles
	 */
	public function test_should_enqueue_stored_styles() {
		$core_styles_to_enqueue = array(
			array(
				'selector'     => '.saruman',
				'declarations' => array(
					'color'        => 'white',
					'height'       => '100px',
					'border-style' => 'solid',
				),
			),
		);

		// Enqueues a block supports (core styles).
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$core_styles_to_enqueue,
			array(
				'context' => 'block-supports',
			)
		);

		$my_styles_to_enqueue = array(
			array(
				'selector'     => '.gandalf',
				'declarations' => array(
					'color'        => 'grey',
					'height'       => '90px',
					'border-style' => 'dotted',
				),
			),
		);

		// Enqueues some other styles.
		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$my_styles_to_enqueue,
			array(
				'context' => 'my-styles',
			)
		);

		gutenberg_enqueue_stored_styles(
			array( 'prettify' => false )
		);

		$this->assertSame(
			array( '.saruman{color:white;height:100px;border-style:solid;}' ),
			wp_styles()->registered['core-block-supports']->extra['after'],
			'Registered styles with handle of "core-block-supports" do not match expected value from Style Engine store.'
		);

		$this->assertSame(
			array( '.gandalf{color:grey;height:90px;border-style:dotted;}' ),
			wp_styles()->registered['wp-style-engine-my-styles']->extra['after'],
			'Registered styles with handle of "wp-style-engine-my-styles" do not match expected value from the Style Engine store.'
		);
	}
}
