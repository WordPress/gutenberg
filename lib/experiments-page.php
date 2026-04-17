<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

if ( isset( $_GET['page'] ) && 'gutenberg-experiments' === $_GET['page'] ) {
	// Default to is-fullscreen-mode to avoid jumps in the UI.
	add_filter(
		'admin_body_class',
		static function ( $classes ) {
			return "$classes is-fullscreen-mode";
		}
	);
}

/**
 * Returns the list of Gutenberg experiments with their metadata.
 *
 * @since 20.8.0
 *
 * @return array List of experiments with id, label, description, and group.
 */
function gutenberg_get_experiments() {
	return array(
		array(
			'id'          => 'gutenberg-block-experiments',
			'label'       => __( 'Add experimental blocks', 'gutenberg' ),
			'description' => __( 'Enables experimental blocks on a rolling basis as they are developed. (Warning: these blocks may have significant changes during development that cause validation errors and display issues.)', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-form-blocks',
			'label'       => __( 'Add Form and input blocks', 'gutenberg' ),
			'description' => __( 'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-grid-interactivity',
			'label'       => __( 'Add Grid interactivity', 'gutenberg' ),
			'description' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-no-tinymce',
			'label'       => __( 'Disable TinyMCE and Classic block', 'gutenberg' ),
			'description' => __( 'Disables the TinyMCE and Classic block.', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-customizable-navigation-overlays',
			'label'       => __( 'Customizable Navigation Overlays', 'gutenberg' ),
			'description' => __( 'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-hide-blocks-based-on-screen-size',
			'label'       => __( 'Hide blocks based on screen size', 'gutenberg' ),
			'description' => __( 'Extends block visibility block supports with responsive design controls for hiding blocks based on screen size.', 'gutenberg' ),
			'group'       => 'blocks',
		),
		array(
			'id'          => 'gutenberg-media-processing',
			'label'       => __( 'Client-side media processing', 'gutenberg' ),
			'description' => __( "Enables client-side media processing to leverage the browser's capabilities to handle tasks like image resizing and compression.", 'gutenberg' ),
			'group'       => 'media',
		),
		array(
			'id'          => 'gutenberg-media-editor',
			'label'       => __( 'Media Editor', 'gutenberg' ),
			'description' => __( 'Enables editing media items (attachments) directly in the block editor with a dedicated media preview and metadata panel.', 'gutenberg' ),
			'group'       => 'media',
		),
		array(
			'id'          => 'gutenberg-sync-collaboration',
			'label'       => __( 'Add real time editing', 'gutenberg' ),
			'description' => __( 'Enables live collaboration and offline persistence between peers.', 'gutenberg' ),
			'group'       => 'collaboration',
		),
		array(
			'id'          => 'gutenberg-new-posts-dashboard',
			'label'       => __( 'Enable for Posts', 'gutenberg' ),
			'description' => __( 'Enables a redesigned posts dashboard accessible through a submenu item in the Gutenberg plugin.', 'gutenberg' ),
			'group'       => 'data-views',
		),
		array(
			'id'          => 'gutenberg-quick-edit-dataviews',
			'label'       => __( 'Add Quick Edit', 'gutenberg' ),
			'description' => __( 'Enables access to a Quick Edit panel in the Site Editor Pages experience.', 'gutenberg' ),
			'group'       => 'data-views',
		),
		array(
			'id'          => 'gutenberg-dataviews-media-modal',
			'label'       => __( 'New media modal', 'gutenberg' ),
			'description' => __( 'Enables a new media modal experience powered by Data Views for improved media library management.', 'gutenberg' ),
			'group'       => 'data-views',
		),
		array(
			'id'          => 'gutenberg-dataform-inspector',
			'label'       => __( 'Editor Inspector: Use DataForm', 'gutenberg' ),
			'description' => __( 'Replaces the bespoke editor inspector panels with a unified DataForm-based implementation for Pages and Posts, matching the QuickEdit experience.', 'gutenberg' ),
			'group'       => 'data-views',
		),
		array(
			'id'          => 'gutenberg-full-page-client-side-navigation',
			'label'       => __( 'Full-page client-side navigation', 'gutenberg' ),
			'description' => __( 'Enables full-page client-side navigation, powered by the Interactivity API.', 'gutenberg' ),
			'group'       => 'interactivity',
		),
		array(
			'id'          => 'gutenberg-content-only-pattern-insertion',
			'label'       => __( 'Make patterns contentOnly by default upon insertion', 'gutenberg' ),
			'description' => __( 'When patterns are inserted, default to a simplified content only mode for editing pattern content.', 'gutenberg' ),
			'group'       => 'content-only',
		),
		array(
			'id'          => 'gutenberg-content-only-inspector-fields',
			'label'       => __( 'Enable editable inspector fields', 'gutenberg' ),
			'description' => __( 'Enables editable inspector fields (media, links, alt text, etc.) in the content-only pattern editing interface. Requires "Make patterns contentOnly by default upon insertion" to be enabled.', 'gutenberg' ),
			'group'       => 'content-only',
		),
		array(
			'id'          => 'gutenberg-color-randomizer',
			'label'       => __( 'Color randomizer', 'gutenberg' ),
			'description' => __( 'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
			'group'       => 'other',
		),
		array(
			'id'          => 'gutenberg-workflow-palette',
			'label'       => __( 'Workflow Palette', 'gutenberg' ),
			'description' => __( 'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.', 'gutenberg' ),
			'group'       => 'other',
		),
		array(
			'id'          => 'gutenberg-extensible-site-editor',
			'label'       => __( 'Extensible Site Editor', 'gutenberg' ),
			'description' => __( 'Redirects the default site editor (Appearance > Design) to use the extensible site editor page.', 'gutenberg' ),
			'group'       => 'other',
		),
		array(
			'id'          => 'gutenberg-guidelines',
			'label'       => __( 'Guidelines', 'gutenberg' ),
			'description' => __( 'Enables guidelines feature for managing editorial voice and tone guidelines under Settings.', 'gutenberg' ),
			'group'       => 'other',
		),
		array(
			'id'             => 'active_templates',
			'label'          => __( 'Template Activation', 'gutenberg' ),
			'description'    => __( 'Allows multiple templates of the same type to be created, of which one can be active at a time. Warning: when you deactivate this experiment, it is best to delete all created templates except for the active ones.', 'gutenberg' ),
			'group'          => 'templates',
			'separateOption' => true,
		),
	);
}

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 *
	 * @since 6.3.0
	 */
	function the_gutenberg_experiments() {
		$block_editor_context = new WP_Block_Editor_Context( array( 'name' => 'core/edit-site' ) );
		$custom_settings      = array(
			'siteUrl' => site_url(),
		);

		$editor_settings = get_block_editor_settings( $custom_settings, $block_editor_context );

		wp_register_style(
			'wp-gutenberg-experiments',
			gutenberg_url( 'build/edit-site/experiments.css' ),
			array( 'wp-components', 'wp-commands', 'wp-edit-site' )
		);
		wp_enqueue_style( 'wp-gutenberg-experiments' );
		wp_add_inline_script(
			'wp-edit-site',
			sprintf(
				'wp.domReady( function() {
					wp.editSite.initializeExperiments( "gutenberg-experiments", %s, %s );
				} );',
				wp_json_encode( $editor_settings ),
				wp_json_encode( gutenberg_get_experiments() )
			)
		);
		wp_enqueue_script( 'wp-edit-site' );
		wp_enqueue_media();
		echo '<div id="gutenberg-experiments"></div>';
	}
}

/**
 * Set up the experiments settings.
 *
 * @since 6.8.0
 */
function gutenberg_initialize_experiments_settings() {
	$experiments = gutenberg_get_experiments();
	$properties  = array();

	foreach ( $experiments as $experiment ) {
		// Skip experiments that use separate options (like active_templates).
		if ( ! empty( $experiment['separateOption'] ) ) {
			continue;
		}
		$properties[ $experiment['id'] ] = array( 'type' => 'boolean' );
	}

	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments',
		array(
			'label'        => __( 'Gutenberg Experiments', 'gutenberg' ),
			'description'  => __( "The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ),
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
