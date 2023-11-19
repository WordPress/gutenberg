<?php

/**
 * Plugin Name: Hooked Block
 */

declare(strict_types=1);

add_action('init', function () {
	register_block_type_from_metadata(__DIR__ . '/block.json', [
		'render_callback' => function ($attributes, $content) {
			return "<small>{$attributes['content']}</small>";
		}
	]);
	wp_enqueue_script('hooked-block', plugins_url('src/index.js', __FILE__), ['wp-blocks', 'wp-element'],'', [
		'in_footer' => true
	]);
});
