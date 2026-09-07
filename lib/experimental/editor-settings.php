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
	global $pagenow;

	if ( gutenberg_is_experiment_enabled( 'gutenberg-color-randomizer' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableColorRandomizer = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-grid-interactivity' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableGridInteractivity = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-global-styles-inheritance-ui' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalGlobalStylesInheritanceUI = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-dataviews-media-modal' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDataViewsMediaModal = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-content-only-inspector-fields' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalContentOnlyInspectorFields = true', 'before' );
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
	if ( gutenberg_is_experiment_enabled( 'gutenberg-dashboard-widgets' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalDashboardWidgets = true', 'before' );
	}
	if ( gutenberg_is_experiment_enabled( 'gutenberg-real-time-collaboration' ) ) {
		$collaboration_enabled = ! (
			'site-editor.php' === $pagenow ||
			( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'site-editor-v2' === $_GET['page'] )
		);

		wp_add_inline_script(
			'wp-core-data',
			'window.__experimentalEnableRealTimeCollaboration = ' . wp_json_encode( $collaboration_enabled ) . ';',
			'before'
		);
	}
}

add_action( 'admin_init', 'gutenberg_enable_experiments' );
add_action( 'site-editor-v2_init', 'gutenberg_enable_experiments' );

/**
 * Sets global JS variables used to enable various block experiments.
 */
function gutenberg_enable_block_experiments() {
	// General experimental blocks that are not in the default block library.
	if ( gutenberg_is_experiment_enabled( 'gutenberg-block-experiments' ) ) {
		wp_add_inline_script( 'wp-block-editor', 'window.__experimentalEnableBlockExperiments = true', 'before' );
	}
}

add_action( 'admin_init', 'gutenberg_enable_block_experiments' );
