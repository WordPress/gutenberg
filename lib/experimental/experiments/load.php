<?php
/**
 * Bootstraps the Gutenberg experiments page in wp-admin.
 *
 * @package gutenberg
 */

/**
 * Set up the experiments settings.
 *
 * Registering an experiment here only exposes it on the Experiments screen.
 * To actually enable a new experiment in the editor, add a matching bridge
 * (e.g. a `window.__experimental*` global) in `gutenberg_enable_experiments()`
 * in `lib/experimental/editor-settings.php`.
 */
function gutenberg_initialize_experiments_settings() {
	$groups = array(
		array(
			'slug'  => 'blocks',
			'label' => _x( 'Blocks', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-block-experiments',
					'label'       => __( 'Experimental blocks', 'gutenberg' ),
					'description' => __( 'Enables experimental blocks on a rolling basis as they are developed. (Warning: these blocks may have significant changes during development that cause validation errors and display issues.)', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-form-blocks',
					'label'       => __( 'Form and input blocks', 'gutenberg' ),
					'description' => __( 'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-grid-interactivity',
					'label'       => __( 'Grid interactivity', 'gutenberg' ),
					'description' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'media',
			'label' => _x( 'Media', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-media-editor',
					'label'       => __( 'Media Editor', 'gutenberg' ),
					'description' => __( 'Adds an "Edit media" action on image blocks for editing the attached media item (metadata and content) in the editor.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-media-editor-modal',
					'label'       => __( 'Media Editor Modal', 'gutenberg' ),
					'description' => __( 'Enables an in-place modal for image editing — cropping, adjustments, and metadata — opened from blocks like the image block without navigating away from the current post.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-dataviews-media-modal',
					'label'       => __( 'Media Upload Modal', 'gutenberg' ),
					'description' => __( 'Replaces the existing WordPress media modal with a new modal powered by Data Views, supporting browsing, selecting, and uploading media.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'data-views',
			'label' => _x( 'Data Views', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-content-only-inspector-fields',
					'label'       => __( 'Block fields: Show dataform driven inspector fields on blocks that support them', 'gutenberg' ),
					'description' => __( 'Enables editable block inspector fields that are generated using a dataform.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-dataform-inspector',
					'label'       => __( 'Editor Inspector: Use DataForm', 'gutenberg' ),
					'description' => __( 'Replaces the bespoke editor inspector panels with a unified DataForm-based implementation for Pages and Posts, matching the QuickEdit experience.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'interactivity',
			'label' => _x( 'Interactivity', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-full-page-client-side-navigation',
					'label'       => __( 'Full-page client-side navigation', 'gutenberg' ),
					'description' => __( 'Enables full-page client-side navigation, powered by the Interactivity API.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'templates',
			'label' => _x( 'Templates', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'             => 'active_templates',
					'label'          => __( 'Template Activation', 'gutenberg' ),
					'description'    => __( 'Allows multiple templates of the same type to be created, of which one can be active at a time. (Warning: when you deactivate this experiment, it is best to delete all created templates except for the active ones.)', 'gutenberg' ),
					'separateOption' => true,
				),
			),
		),
		array(
			'slug'  => 'other',
			'label' => _x( 'Other', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-color-randomizer',
					'label'       => __( 'Color randomizer', 'gutenberg' ),
					'description' => __( 'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-workflow-palette',
					'label'       => __( 'Workflow Palette', 'gutenberg' ),
					'description' => __( 'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-extensible-site-editor',
					'label'       => __( 'Extensible Site Editor', 'gutenberg' ),
					'description' => __( 'Redirects the default site editor (Appearance > Design) to use the extensible site editor page.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-guidelines',
					'label'       => __( 'Guidelines', 'gutenberg' ),
					'description' => __( 'Enables guidelines feature for managing editorial voice and tone guidelines under Settings.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-content-types',
					'label'       => __( 'Content types', 'gutenberg' ),
					'description' => __( 'Enables a UI for creating and managing custom taxonomies under Settings. Custom post types will be explored soon.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-dashboard-widgets',
					'label'       => __( 'New Dashboard experience', 'gutenberg' ),
					'description' => __( 'Enables a new dashboard experience with resizable, reorderable widgets that plugins can register and users can personalize.', 'gutenberg' ),
				),
			),
		),
	);

	$properties = array();

	foreach ( $groups as $group ) {
		foreach ( $group['items'] as $experiment ) {
			$property = array(
				'type'        => 'boolean',
				'title'       => $experiment['label'],
				'description' => $experiment['description'],
				'group'       => $group['slug'],
				'group_label' => $group['label'],
			);

			// Metadata-only entry: values for separateOption experiments live in
			// their own option (e.g. `active_templates`). Surfaced here so the UI
			// can render them from the settings schema.
			if ( ! empty( $experiment['separateOption'] ) ) {
				$property['separate_option'] = true;
				$property['option_name']     = $experiment['id'];
			}

			$properties[ $experiment['id'] ] = $property;
		}
	}

	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments',
		array(
			'label'        => __( 'Gutenberg Experiments', 'gutenberg' ),
			'show_in_rest' => array(
				'schema' => array(
					'type'       => 'object',
					'properties' => $properties,
				),
			),
			'default'      => array(),
		)
	);
}

add_action( 'rest_api_init', 'gutenberg_initialize_experiments_settings' );

/**
 * Registers the Experiments submenu page under the Gutenberg menu.
 */
function gutenberg_experiments_menu() {
	add_submenu_page(
		'gutenberg',
		__( 'Experiments Settings', 'gutenberg' ),
		__( 'Experiments', 'gutenberg' ),
		'manage_options',
		'experiments-wp-admin',
		'gutenberg_experiments_wp_admin_render_page'
	);
}
add_action( 'admin_menu', 'gutenberg_experiments_menu' );

/**
 * Allows the legacy `gutenberg-experiments` route. Without this, accessing
 * `?page=gutenberg-experiments` results in an HTTP 403 error.
 *
 * Allowing the route is done by adding a wp-admin submenu page that won't be rendered.
 */
function gutenberg_experiments_legacy_menu() {
	add_submenu_page( '', '', '', 'manage_options', 'gutenberg-experiments', '__return_empty_string' );
}
add_action( 'admin_menu', 'gutenberg_experiments_legacy_menu', 9 );

/**
 * Redirects the legacy `?page=gutenberg-experiments` URL to the new
 * `?page=experiments-wp-admin` URL.
 */
function gutenberg_redirect_legacy_experiments_page() {
	wp_safe_redirect( admin_url( 'admin.php?page=experiments-wp-admin' ) );
	exit;
}
add_action( 'load-admin_page_gutenberg-experiments', 'gutenberg_redirect_legacy_experiments_page' );
add_action( 'load-toplevel_page_gutenberg-experiments', 'gutenberg_redirect_legacy_experiments_page' );
add_action( 'load-gutenberg_page_gutenberg-experiments', 'gutenberg_redirect_legacy_experiments_page' );
