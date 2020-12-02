<?php

class WP_Sidebar_Block_Editor_Control extends WP_Customize_Control {
	public $type = 'sidebar_block_editor';

	public $sidebar_id;

	public function to_json() {
		parent::to_json();
		$this->json[ 'sidebar_id' ] = $this->sidebar_id;
	}

	public function render_content() {
		?>
		This is a sidebar! <?php echo $this->sidebar_id; ?>
		<?php
	}

	public function enqueue() {
		// If there ends up being more than just this control in
		// wp-widgets-customize then we should enqueue it in
		// lib/widgets-customize.php.
		wp_enqueue_script( 'wp-widgets-customize' );
	}
}
