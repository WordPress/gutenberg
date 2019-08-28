<?php
/**
 * Customizer Widget Blocks Section: WP_Customize_Widget_Blocks_Control class.
 *
 * @package gutenberg
 * @since 6.1.0
 */

/**
 * Class that renders the Customizer control for editing widgets with Gutenberg.
 *
 * @since 6.1.0
 */
class WP_Customize_Widget_Blocks_Control extends WP_Customize_Control {
	/**
	 * Enqueue control related scripts/styles.
	 *
	 * @since 6.1.0
	 */
	public function enqueue() {
		gutenberg_widgets_init( 'gutenberg_customizer' );
	}

	/**
	 * Render the control's content.
	 *
	 * @since 6.1.0
	 */
	public function render_content() {
		?>
			<input
				id="_customize-input-gutenberg_widget_blocks"
				type="hidden"
				value="<?php echo esc_attr( $this->value() ); ?>"
				<?php $this->link(); ?>
			/>
		<?php
		the_gutenberg_widgets( 'gutenberg_customizer' );
	}
}
