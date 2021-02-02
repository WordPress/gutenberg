<?php

class WP_Sidebar_Block_Editor_Control extends WP_Customize_Control {
	public $type = 'sidebar_block_editor';

	public function enqueue() {
		gutenberg_widgets_init( 'gutenberg_customizer' );
	}

	public function render_content() {
		the_gutenberg_widgets( 'gutenberg_customizer' );
	}
}
