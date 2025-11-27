<?php
/**
 * AI Assistant experimental features
 *
 * @package WordPress
 * @subpackage AI Assistant
 * @since 6.9.0
 */

// Prevent direct access.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Load AI Assistant class
require_once __DIR__ . '/ai-assistant/class-wp-ai-assistant.php';

/**
 * Initialize AI Assistant experimental features
 */
function gutenberg_init_ai_assistant() {
	if ( class_exists( 'WP_AI_Assistant' ) ) {
		WP_AI_Assistant::init();
	}
}

// Initialize when WordPress is loaded
add_action( 'init', 'gutenberg_init_ai_assistant' );