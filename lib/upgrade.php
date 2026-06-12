<?php
/**
 * Upgrading Gutenberg's database.
 *
 * @package gutenberg
 */

if ( ! defined( '_GUTENBERG_VERSION_MIGRATION' ) ) {
	// It's necessary to update this version every time a new migration is needed.
	define( '_GUTENBERG_VERSION_MIGRATION', '23.5.0' );
}

/**
 * Migrate Gutenberg's database on upgrade.
 *
 * @access private
 * @internal
 */
function _gutenberg_migrate_database() {
	// The default value used here is the first version before migrations were added.
	$gutenberg_installed_version = get_option( 'gutenberg_version_migration', '9.7.0' );

	if ( _GUTENBERG_VERSION_MIGRATION !== $gutenberg_installed_version ) {
		if ( version_compare( $gutenberg_installed_version, '9.8.0', '<' ) ) {
			_gutenberg_migrate_remove_fse_drafts();
		}

		if ( version_compare( $gutenberg_installed_version, '22.8.0', '<' ) ) {
			_gutenberg_migrate_enable_real_time_collaboration();
		}

		if ( version_compare( $gutenberg_installed_version, '23.5.0', '<' ) ) {
			_gutenberg_migrate_guidelines_to_knowledge();
		}

		update_option( 'gutenberg_version_migration', _GUTENBERG_VERSION_MIGRATION );
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
	$delete_query = new WP_Query(
		array(
			'post_status'    => array( 'auto-draft' ),
			'post_type'      => array( 'wp_template', 'wp_template_part' ),
			'posts_per_page' => -1,
		)
	);
	foreach ( $delete_query->posts as $post ) {
		wp_delete_post( $post->ID, true );
	}

	// Delete _wp_file_based term.
	$term = get_term_by( 'name', '_wp_file_based', 'wp_theme' );
	if ( $term ) {
		wp_delete_term( $term->term_id, 'wp_theme' );
	}

	// Delete useless options.
	delete_option( 'gutenberg_last_synchronize_theme_template_checks' );
	delete_option( 'gutenberg_last_synchronize_theme_template-part_checks' );
}

/**
 * Update RTC option name.
 *
 * @since 22.8.0
 */
function _gutenberg_migrate_enable_real_time_collaboration() {
	$value1 = get_option( 'enable_real_time_collaboration', '1' );
	$value2 = get_option( 'wp_enable_real_time_collaboration', '1' );

	// RTC is enabled by default in the plugin, so only set the value if it was
	// previously disabled. Otherwise rely on the default value.
	if ( ! $value1 || ! $value2 ) {
		update_option( 'wp_collaboration_enabled', '0' );
	}

	delete_option( 'enable_real_time_collaboration' );
	delete_option( 'wp_enable_real_time_collaboration' );
}

/**
 * Rename the experimental Guidelines storage to Knowledge: `wp_guideline`
 * posts become `wp_knowledge`, and `wp_guideline_type` terms move to the
 * `wp_knowledge_type` taxonomy.
 *
 * Runs regardless of whether the `gutenberg-guidelines` experiment is
 * currently enabled so rows created while it was previously on are migrated
 * too. Revisions and `_guideline_*` post meta keep their parent linkage and
 * names, so no further updates are needed.
 *
 * @since 23.5.0
 */
function _gutenberg_migrate_guidelines_to_knowledge() {
	global $wpdb;

	$post_ids = $wpdb->get_col(
		$wpdb->prepare( "SELECT ID FROM {$wpdb->posts} WHERE post_type = %s", 'wp_guideline' )
	);
	if ( $post_ids ) {
		$wpdb->update(
			$wpdb->posts,
			array( 'post_type' => 'wp_knowledge' ),
			array( 'post_type' => 'wp_guideline' )
		);
		foreach ( $post_ids as $post_id ) {
			clean_post_cache( (int) $post_id );
		}
	}

	$term_ids = $wpdb->get_col(
		$wpdb->prepare( "SELECT term_id FROM {$wpdb->term_taxonomy} WHERE taxonomy = %s", 'wp_guideline_type' )
	);
	if ( $term_ids ) {
		$wpdb->update(
			$wpdb->term_taxonomy,
			array( 'taxonomy' => 'wp_knowledge_type' ),
			array( 'taxonomy' => 'wp_guideline_type' )
		);
		clean_term_cache( array_map( 'intval', $term_ids ), 'wp_knowledge_type' );
	}
}

// Deletion of the `_wp_file_based` term (in _gutenberg_migrate_remove_fse_drafts) must happen
// after its taxonomy (`wp_theme`) is registered. This happens in `gutenberg_register_wp_theme_taxonomy`,
// which is hooked into `init` (default priority, i.e. 10).
add_action( 'init', '_gutenberg_migrate_database', 20 );
