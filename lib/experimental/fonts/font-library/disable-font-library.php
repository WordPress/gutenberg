<?php

// @core-merge: this should not go to core.
add_action(
	'enqueue_block_editor_assets',
	function () {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDisableFontLibrary = true', 'before' );
	}
);
