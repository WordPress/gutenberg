<?php
/**
 * Plugin Name: Gutenberg Test Plugin, Revision Fields
 * Plugin URI: https://github.com/WordPress/gutenberg
 * Author: Gutenberg Team
 *
 * @package gutenberg-test-revision-fields
 */

/**
 * Registers a revisioned meta field and gives it a name on the revisions
 * screens through the filter plugins have always used for this.
 */
function gutenberg_test_revision_fields_register_meta() {
	register_post_meta(
		'post',
		'gutenberg_test_revision_field',
		array(
			'type'              => 'string',
			'single'            => true,
			'show_in_rest'      => true,
			'revisions_enabled' => true,
			'sanitize_callback' => 'sanitize_text_field',
			'auth_callback'     => function () {
				return current_user_can( 'edit_posts' );
			},
		)
	);
}
add_action( 'init', 'gutenberg_test_revision_fields_register_meta' );

/**
 * Adds the field to the list of revision fields.
 *
 * @param string[] $fields List of fields to revision.
 * @return string[] The filtered list.
 */
function gutenberg_test_revision_fields_add_field( $fields ) {
	$fields['gutenberg_test_revision_field'] = 'Release date';
	return $fields;
}
add_filter( '_wp_post_revision_fields', 'gutenberg_test_revision_fields_add_field' );
