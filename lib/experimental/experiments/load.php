<?php
/**
 * Bootstraps the Gutenberg experiments page in wp-admin.
 *
 * @package gutenberg
 */

/**
 * Set up the experiments settings.
 */
function gutenberg_initialize_experiments_settings() {
	$groups = array(
		array(
			'slug'  => 'blocks',
			'label' => _x( 'Blocks', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-block-experiments',
					'label'       => __( 'Add experimental blocks', 'gutenberg' ),
					'description' => __( 'Enables experimental blocks on a rolling basis as they are developed. (Warning: these blocks may have significant changes during development that cause validation errors and display issues.)', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-form-blocks',
					'label'       => __( 'Add Form and input blocks', 'gutenberg' ),
					'description' => __( 'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-grid-interactivity',
					'label'       => __( 'Add Grid interactivity', 'gutenberg' ),
					'description' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-no-tinymce',
					'label'       => __( 'Disable TinyMCE and Classic block', 'gutenberg' ),
					'description' => __( 'Disables the TinyMCE and Classic block.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-customizable-navigation-overlays',
					'label'       => __( 'Customizable Navigation Overlays', 'gutenberg' ),
					'description' => __( 'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-hide-blocks-based-on-screen-size',
					'label'       => __( 'Hide blocks based on screen size', 'gutenberg' ),
					'description' => __( 'Extends block visibility block supports with responsive design controls for hiding blocks based on screen size.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'media',
			'label' => _x( 'Media', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-media-processing',
					'label'       => __( 'Client-side media processing', 'gutenberg' ),
					'description' => __( "Enables client-side media processing to leverage the browser's capabilities to handle tasks like image resizing and compression.", 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-media-editor',
					'label'       => __( 'Media Editor', 'gutenberg' ),
					'description' => __( 'Enables editing media items (attachments) directly in the block editor with a dedicated media preview and metadata panel.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'collaboration',
			'label' => _x( 'Collaboration', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-sync-collaboration',
					'label'       => __( 'Add real time editing', 'gutenberg' ),
					'description' => __( 'Enables live collaboration and offline persistence between peers.', 'gutenberg' ),
				),
			),
		),
		array(
			'slug'  => 'data-views',
			'label' => _x( 'Data Views', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-new-posts-dashboard',
					'label'       => __( 'Enable for Posts', 'gutenberg' ),
					'description' => __( 'Enables a redesigned posts dashboard accessible through a submenu item in the Gutenberg plugin.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-quick-edit-dataviews',
					'label'       => __( 'Add Quick Edit', 'gutenberg' ),
					'description' => __( 'Enables access to a Quick Edit panel in the Site Editor Pages experience.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-dataviews-media-modal',
					'label'       => __( 'New media modal', 'gutenberg' ),
					'description' => __( 'Enables a new media modal experience powered by Data Views for improved media library management.', 'gutenberg' ),
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
			'slug'  => 'content-only',
			'label' => _x( 'contentOnly', 'experiments group name', 'gutenberg' ),
			'items' => array(
				array(
					'id'          => 'gutenberg-content-only-pattern-insertion',
					'label'       => __( 'Make patterns contentOnly by default upon insertion', 'gutenberg' ),
					'description' => __( 'When patterns are inserted, default to a simplified content only mode for editing pattern content.', 'gutenberg' ),
				),
				array(
					'id'          => 'gutenberg-content-only-inspector-fields',
					'label'       => __( 'Enable editable inspector fields', 'gutenberg' ),
					'description' => __( 'Enables editable inspector fields (media, links, alt text, etc.) in the content-only pattern editing interface. Requires "Make patterns contentOnly by default upon insertion" to be enabled.', 'gutenberg' ),
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
					'description'    => __( 'Allows multiple templates of the same type to be created, of which one can be active at a time. Warning: when you deactivate this experiment, it is best to delete all created templates except for the active ones.', 'gutenberg' ),
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

add_action( 'admin_init', 'gutenberg_initialize_experiments_settings' );
add_action( 'rest_api_init', 'gutenberg_initialize_experiments_settings' );

/**
 * Registers a hidden submenu for the legacy `gutenberg-experiments` page so
 * `load-*` hooks fire and can redirect to the new `experiments-wp-admin` page.
 */
function gutenberg_experiments_legacy_menu() {
	add_submenu_page(
		'',
		'',
		'',
		'manage_options',
		'gutenberg-experiments',
		'__return_empty_string'
	);
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
