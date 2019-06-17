<?php
/**
 * Start: Include for phase 2
 *
 * @package gutenberg
 * @since x.x.x
 */

/**
 * Class that renders the Customizer control for editing widgets with Gutenberg.
 *
 * @since x.x.x
 */
class WP_Customize_Widget_Blocks_Control extends WP_Customize_Control {
	/**
	 * Enqueue control related scripts/styles.
	 *
	 * @since x.x.x
	 */
	public function enqueue() {
		gutenberg_widgets_init( 'gutenberg_customizer' );
	}

	/**
	 * Render the control's content.
	 *
	 * @since x.x.x
	 */
	public function render_content() {
		the_gutenberg_widgets();
	}
}
