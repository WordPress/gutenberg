<?php
/**
 * Functions related to Gutenberg annotations.
 *
 * @package gutenberg
 * @since [version]
 */

if ( ! defined( 'ABSPATH' ) ) {
	die( 'Silence is golden.' );
}

/**
 * Gets annotation post type.
 *
 * @since [version]
 *
 * @return string Post type name.
 */
function gutenberg_annotation_post_type() {
	return WP_Annotation_Utils::$post_type;
}
