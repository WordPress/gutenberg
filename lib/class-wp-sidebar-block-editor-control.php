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
		$settings = array_merge(
			gutenberg_get_common_block_editor_settings(),
			gutenberg_get_legacy_widget_settings()
		);

		// This purposefully does not rely on apply_filters( 'block_editor_settings', $settings, null );
		// Applying that filter would bring over multitude of features from the post editor, some of which
		// may be undesirable. Instead of using that filter, we simply pick just the settings that are needed.
		$settings = gutenberg_experimental_global_styles_settings( $settings );
		$settings = gutenberg_extend_block_editor_styles( $settings );

		gutenberg_initialize_editor(
			'widgets_customizer',
			'customize-widgets',
			array(
				'editor_settings' => $settings,
			)
		);
		wp_enqueue_script( 'wp-customize-widgets' );
		wp_enqueue_style( 'wp-customize-widgets' );
		wp_enqueue_script( 'wp-format-library' );
		wp_enqueue_style( 'wp-format-library' );
	}

	/**
	 * Render the widgets block editor container.
	 */
	public function render_content() {
		// Render nothing.
	}
}
