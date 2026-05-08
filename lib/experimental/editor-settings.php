<?php
/**
 * Utilities to manage editor settings.
 *
 * @package gutenberg
 */

/**
 * Sets a global JS variable used to trigger the availability of each Gutenberg Experiment.
 */
function gutenberg_enable_experiments() {
	if ( gutenberg_is_experiment_enabled( 'gutenberg-color-randomizer' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableColorRandomizer = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-grid-interactivity' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableGridInteractivity = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-dataviews-media-modal' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDataViewsMediaModal = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-content-only-inspector-fields' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalContentOnlyInspectorFields = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'active_templates' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalTemplateActivate = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-extensible-site-editor' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalExtensibleSiteEditor = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-dataform-inspector' ) ) {
		wp_add_inline_script( 'wp-editor', 'window.__experimentalDataFormInspector = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-media-editor' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalMediaEditor = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-media-editor-modal' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalMediaEditorModal = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-dashboard-widgets' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDashboardWidgets = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_experiments' );
add_action( 'site-editor-v2_init', 'gutenberg_enable_experiments' );

/**
 * Sets a global JS variable used to trigger the admin bar in editor experiment.
 */
function gutenberg_enable_admin_bar_in_editor_experiment() {
	if ( gutenberg_is_admin_bar_in_editor_experiment_enabled() ) {
		wp_add_inline_script( 'wp-edit-post', 'window.__experimentalAdminBarInEditor = true', 'before' );
		wp_add_inline_script( 'wp-edit-site', 'window.__experimentalAdminBarInEditor = true', 'before' );
	}
}

add_action( 'admin_enqueue_scripts', 'gutenberg_enable_admin_bar_in_editor_experiment' );

/**
 * Checks whether the admin bar should be shown in the editor.
 *
 * @return bool Whether the admin bar should be shown in the editor.
 */
function gutenberg_is_admin_bar_in_editor_experiment_enabled() {
	$screen = get_current_screen();
	if ( ! $screen || ! is_admin_bar_showing() || ! gutenberg_is_experiment_enabled( 'gutenberg-admin-bar-in-editor' ) ) {
		return false;
	}

	$is_post_editor = 'post' === $screen->base && $screen->is_block_editor();
	$is_site_editor = 'site-editor' === $screen->id;

	return $is_post_editor || $is_site_editor;
}

/**
 * Adds a body class to editor screens when the admin bar experiment is enabled.
 *
 * @param string $classes Space-separated list of body classes.
 * @return string Filtered body classes.
 */
function gutenberg_add_admin_bar_in_editor_body_class( $classes ) {
	return gutenberg_is_admin_bar_in_editor_experiment_enabled()
		? $classes . ' is-admin-bar-in-editor-enabled'
		: $classes;
}

add_filter( 'admin_body_class', 'gutenberg_add_admin_bar_in_editor_body_class' );

/**
 * Sets a global JS variable used to trigger the availability of form & input blocks.
 *
 * @deprecated 19.0.0 Use gutenberg_enable_block_experiments().
 */
function gutenberg_enable_form_input_blocks() {
	_deprecated_function( __FUNCTION__, 'Gutenberg 19.0.0', 'gutenberg_enable_block_experiments' );
}

/**
 * Sets global JS variables used to enable various block experiments.
 */
function gutenberg_enable_block_experiments() {
	// Experimental form blocks.
	if ( gutenberg_is_experiment_enabled( 'gutenberg-form-blocks' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableFormBlocks = true', 'before' );
	}

	// General experimental blocks that are not in the default block library.
	if ( gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableBlockExperiments = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_block_experiments' );
