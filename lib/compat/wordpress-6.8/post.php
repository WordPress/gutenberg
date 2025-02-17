<?php

/**
 * Set the default editor mode for the page post type to `template-locked`.
 *
 * Note: This backports into `create_initial_post_types` in WordPress Core.
 */
function gutenberg_update_page_editor_support() {
	// Avoid enabling the editor for pages when it's not supported.
	// This is plugin specific safeguard.
	if ( ! post_type_supports( 'page', 'editor' ) ) {
		return;
	}

	if ( wp_is_block_theme() && current_theme_supports( 'block-templates' ) ) {
		add_post_type_support( 'page', 'editor', array( 'default-mode' => 'template-locked' ) );
	}
}
add_action( 'init', 'gutenberg_update_page_editor_support' );
