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
	 * The current sidebar ID.
	 *
	 * @var string
	 */
	public $sidebar_id;

	/**
	 * Refresh the parameters passed to the JavaScript via JSON.
	 */
	public function to_json() {
		parent::to_json();
		// $this->json->sidebar_id = $this->sidebar_id;
	}

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

		wp_add_inline_script(
			'wp-edit-widgets',
			sprintf(
				'wp.domReady( function() {
					wp.editWidgets.initializeCustomizer( %s );
				} );',
				wp_json_encode( $settings )
			)
		);

		wp_enqueue_script( 'wp-edit-widgets' );
		wp_enqueue_style( 'wp-edit-widgets' );
	}

	/**
	 * Render the widgets block editor container.
	 */
	public function render_content() {
		?>
		<div id="widgets-editor-<?php echo $this->sidebar_id; ?>"></div>
		<?php
	}
}
