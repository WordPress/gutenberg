<?php
/**
 * Compatibility shim for the footnotes bloct to enable test passing while awaiting the tested code to be merged to core.
 *
 * See https://github.com/WordPress/gutenberg/pull/52988.
 *
 * Once merged, this shim can be removed.
 *
 * @package gutenberg
 */

if ( function_exists( 'wp_post_revision_meta_keys' ) ) {
	if ( has_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' ) ) {
		remove_action( 'rest_after_insert_post', 'wp_add_footnotes_revisions_to_post_meta' );
	}
	if ( has_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' ) ) {
		remove_action( 'rest_after_insert_page', 'wp_add_footnotes_revisions_to_post_meta' );
	}
	if ( has_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' ) ) {
		remove_action( 'wp_after_insert_post', 'wp_save_footnotes_meta' );
	}
	if ( has_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' ) ) {
		remove_action( '_wp_put_post_revision', 'wp_keep_footnotes_revision_id' );
	}
	if ( has_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision' ) ) {
		remove_action( 'wp_restore_post_revision', 'wp_restore_footnotes_from_revision' );
	}
	if ( has_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' ) ) {
		remove_action( 'wp_creating_autosave', '_wp_rest_api_autosave_meta' );
	}
	if ( has_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' ) ) {
		remove_action( '_wp_put_post_revision', '_wp_rest_api_autosave_meta' );
	}
	if ( has_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference' ) ) {
		remove_filter( 'rest_pre_insert_post', '_wp_rest_api_force_autosave_difference' );
	}
}
