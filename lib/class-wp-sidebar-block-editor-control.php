<?php
/**
 * Widget API: WP_Sidebar_Block_Editor_Control class.
 *
 * @package Gutenberg
 */

/**
 * Core class used to implement the widgets block editor control in the customizer.
 *
 * @see WP_Customize_Control
 */
class WP_Sidebar_Block_Editor_Control extends WP_Customize_Control {
	/**
	 * The control type.
	 *
	 * @var string
	 */
	public $type = 'sidebar_block_editor';

	/**
	 * Enqueue the scripts and styles.
	 */
	public function enqueue() {
		wp_enqueue_script( 'wp-customize-widgets' );
		wp_enqueue_style( 'wp-customize-widgets' );
	}

	/**
	 * Render the widgets block editor container.
	 */
	public function render_content() {
		// Render nothing.
	}
}
