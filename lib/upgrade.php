<?php
/**
 * Upgrading Gutenberg's database.
 *
 * @package gutenberg
 */

if ( ! defined( '_GUTENBERG_VERSION_MIGRATION' ) ) {
	// It's necessary to update this version every time a new migration is needed.
	define( '_GUTENBERG_VERSION_MIGRATION', '23.9.0' );
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

		if ( version_compare( $gutenberg_installed_version, '23.8.0', '<' ) ) {
			_gutenberg_migrate_remove_legacy_collaboration_options();
		}

		if ( version_compare( $gutenberg_installed_version, '23.9.0', '<' ) ) {
			_gutenberg_migrate_active_templates();
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
 * Removes collaboration options replaced by the Real-Time Collaboration experiment.
 *
 * The previous values are intentionally not migrated to the experiment. Real-time
 * collaboration is now opt-in, so existing sites must explicitly enable the
 * experiment instead of being opted in by a legacy setting.
 *
 * @since 23.8.0
 */
function _gutenberg_migrate_remove_legacy_collaboration_options() {
	delete_option( 'enable_real_time_collaboration' );
	delete_option( 'wp_enable_real_time_collaboration' );
	delete_option( 'wp_collaboration_enabled' );
}

/**
 * Migrates templates created by the removed template activation experiment.
 *
 * The experiment allowed multiple templates with the same slug, with the
 * `active_templates` option deciding which one renders. Without the
 * experiment, WordPress expects at most one template per slug, so an inactive
 * duplicate could take over rendering. Move every template the experiment did
 * not treat as active out of the template hierarchy by renaming it to a
 * `custom-{slug}` slug; it remains available as a custom template.
 *
 * Only runs on sites where the `active_templates` option exists, which means
 * the experiment was enabled at some point.
 *
 * @since 23.9.0
 *
 * @access private
 * @internal
 */
function _gutenberg_migrate_active_templates() {
	$active_templates = get_option( 'active_templates' );

	if ( ! is_array( $active_templates ) ) {
		// The template activation experiment was never enabled on this site.
		return;
	}

	$template_query = new WP_Query(
		array(
			'post_type'      => 'wp_template',
			'post_status'    => array( 'publish', 'draft', 'auto-draft' ),
			'posts_per_page' => -1,
			'no_found_rows'  => true,
		)
	);

	foreach ( $template_query->posts as $post ) {
		$slug = $post->post_name;

		// The active template keeps its slug, so it continues to override the
		// theme's template as it did under the experiment.
		if ( isset( $active_templates[ $slug ] ) && absint( $active_templates[ $slug ] ) === $post->ID ) {
			continue;
		}

		$template = _build_block_template_result_from_post( $post );

		// Custom templates never needed activation; leave them untouched.
		if ( is_wp_error( $template ) || $template->is_custom ) {
			continue;
		}

		wp_update_post(
			array(
				'ID'        => $post->ID,
				'post_name' => 'custom-' . $slug,
			)
		);
		// The template is a plain custom template from now on.
		delete_post_meta( $post->ID, 'is_wp_suggestion' );
		delete_post_meta( $post->ID, 'is_inactive_by_default' );
	}

	delete_option( 'active_templates' );
}

// Deletion of the `_wp_file_based` term (in _gutenberg_migrate_remove_fse_drafts) must happen
// after its taxonomy (`wp_theme`) is registered. This happens in `gutenberg_register_wp_theme_taxonomy`,
// which is hooked into `init` (default priority, i.e. 10).
add_action( 'init', '_gutenberg_migrate_database', 20 );
