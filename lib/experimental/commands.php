<?php

/**
 * Used to enqueue the command palette everywhere in WordPress.
 */
add_action('wp_print_scripts', function () {
	if (!is_user_logged_in()) {
		return;
	}

	wp_enqueue_style('wp-commands');
	wp_enqueue_script('wp-core-commands');
}, 1);
