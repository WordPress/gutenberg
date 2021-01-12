<?php
/**
 * Upgrading Gutenberg's database.
 *
 * @package gutenberg
 */

if ( ! defined( '_GUTENBERG_VERSION_MIGRATION' ) ) {
	// It's necessary to update this version every time a new migration is needed.
	define( '_GUTENBERG_VERSION_MIGRATION', '9.8.0' );
}

/**
 * Migrate Gutenberg's database on upgrade.
 *
 * @access private
 * @internal
 */
function _gutenberg_migrate_database() {
	// The default value used here is the first version before migrations were added.
	$gutenberg_installed_version = get_option( '_GUTENBERG_VERSION_MIGRATION', '9.7.0' );

	if ( _GUTENBERG_VERSION_MIGRATION !== $gutenberg_installed_version ) {
		if ( version_compare( $gutenberg_installed_version, '9.8.0', '<' ) ) {
			_gutenberg_migrate_remove_fse_drafts();
		}

		update_option( '_GUTENBERG_VERSION_MIGRATION', _GUTENBERG_VERSION_MIGRATION );
	}
}

/**
 * Remove FSE auto drafts and associated terms.
 *
 * @access private
 * @internal
 */
function _gutenberg_migrate_remove_fse_drafts() {
	// Delete auto-draft templates and template parts.
	$delete_query = new WP_QUERY(
		array(
			'post_status'    => array( 'auto-draft' ),
			'post_type'      => array( 'wp_template', 'wp_template_part' ),
			'posts_per_page' => -1,
		)
	);
	foreach ( $delete_query->get_posts() as $post ) {
		wp_delete_post( $post->ID, true );
	}

	// Delete _wp_file_based term.
	$term = get_term_by( 'name', '_wp_file_based', 'wp-theme' );
	if ( $term ) {
		wp_delete_term( $term->term_id, 'wp-theme' );
	}
}

add_action( 'plugins_loaded', '_gutenberg_migrate_database' );
