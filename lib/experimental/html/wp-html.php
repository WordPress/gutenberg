<?php
/**
 * Load all files for the HTML Tag Processor.
 *
 * @package gutenberg
 */

// All class files necessary for the HTML Tag Processor.
if ( ! class_exists( 'WP_HTML_Attribute_Token' ) ) {
	require_once __DIR__ . '/class-wp-html-attribute-token.php';
}

if ( ! class_exists( 'WP_HTML_Span' ) ) {
	require_once __DIR__ . '/class-wp-html-span.php';
}

if ( ! class_exists( 'WP_HTML_Text_Replacement' ) ) {
	require_once __DIR__ . '/class-wp-html-text-replacement.php';
}

if ( ! class_exists( 'WP_HTML_Tag_Processor' ) ) {
	require_once __DIR__ . '/class-wp-html-tag-processor.php';
}
