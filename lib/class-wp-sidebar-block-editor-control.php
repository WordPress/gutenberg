<?php

class WP_Sidebar_Block_Editor_Control extends WP_Customize_Control {
	public function enqueue() {
		gutenberg_widgets_init( 'gutenberg_customizer' );
	}

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
