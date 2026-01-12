<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

/**
 * Get all experiment definitions with their metadata.
 *
 * @since 20.0.0
 *
 * @return array Array of experiment definitions.
 */
function gutenberg_get_experiment_definitions() {
	return array(
		array(
			'id'          => 'gutenberg-block-experiments',
			'name'        => __( 'Experimental Blocks', 'gutenberg' ),
			'description' => __( 'Enables experimental blocks on a rolling basis as they are developed.', 'gutenberg' ),
			'warning'     => __( 'These blocks may have significant changes during development that cause validation errors and display issues.', 'gutenberg' ),
			'category'    => 'blocks',
			'icon'        => 'blockDefault',
		),
		array(
			'id'          => 'gutenberg-form-blocks',
			'name'        => __( 'Form & Input Blocks', 'gutenberg' ),
			'description' => __( 'Enables new blocks to allow building forms.', 'gutenberg' ),
			'warning'     => __( 'You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
			'category'    => 'blocks',
			'icon'        => 'postComments',
		),
		array(
			'id'          => 'gutenberg-grid-interactivity',
			'name'        => __( 'Grid Interactivity', 'gutenberg' ),
			'description' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
			'category'    => 'blocks',
			'icon'        => 'grid',
		),
		array(
			'id'          => 'gutenberg-no-tinymce',
			'name'        => __( 'Disable TinyMCE', 'gutenberg' ),
			'description' => __( 'Disables the TinyMCE and Classic block.', 'gutenberg' ),
			'category'    => 'blocks',
			'icon'        => 'cancelCircleFilled',
		),
		array(
			'id'          => 'gutenberg-media-processing',
			'name'        => __( 'Client-side Media Processing', 'gutenberg' ),
			'description' => __( 'Enables client-side media processing to leverage the browser\'s capabilities to handle tasks like image resizing and compression.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'image',
		),
		array(
			'id'          => 'gutenberg-sync-collaboration',
			'name'        => __( 'Real-time Collaboration', 'gutenberg' ),
			'description' => __( 'Enables live collaboration and offline persistence between peers.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'people',
		),
		array(
			'id'          => 'gutenberg-color-randomizer',
			'name'        => __( 'Color Randomizer', 'gutenberg' ),
			'description' => __( 'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'color',
		),
		array(
			'id'          => 'gutenberg-quick-edit-dataviews',
			'name'        => __( 'Quick Edit', 'gutenberg' ),
			'description' => __( 'Enables access to a Quick Edit panel in the Site Editor Pages experience.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'pencil',
		),
		array(
			'id'          => 'gutenberg-dataviews-media-modal',
			'name'        => __( 'New Media Modal', 'gutenberg' ),
			'description' => __( 'Enables a new media modal experience powered by Data Views for improved media library management.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'gallery',
		),
		array(
			'id'          => 'gutenberg-workflow-palette',
			'name'        => __( 'Workflow Palette', 'gutenberg' ),
			'description' => __( 'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'tool',
		),
		array(
			'id'          => 'gutenberg-customizable-navigation-overlays',
			'name'        => __( 'Customizable Navigation Overlays', 'gutenberg' ),
			'description' => __( 'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.', 'gutenberg' ),
			'category'    => 'editor',
			'icon'        => 'navigation',
		),
		array(
			'id'          => 'gutenberg-full-page-client-side-navigation',
			'name'        => __( 'Full-page Client-side Navigation', 'gutenberg' ),
			'description' => __( 'Enables full-page client-side navigation, powered by the Interactivity API.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'globe',
		),
		array(
			'id'          => 'gutenberg-content-only-pattern-insertion',
			'name'        => __( 'Content-only Patterns', 'gutenberg' ),
			'description' => __( 'When patterns are inserted, default to a simplified content only mode for editing pattern content.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'layout',
		),
		array(
			'id'          => 'gutenberg-content-only-inspector-fields',
			'name'        => __( 'Block Fields', 'gutenberg' ),
			'description' => __( 'Enables editable block inspector fields that are generated using a dataform.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'settings',
		),
		array(
			'id'          => 'gutenberg-hide-blocks-based-on-screen-size',
			'name'        => __( 'Hide Blocks by Screen Size', 'gutenberg' ),
			'description' => __( 'Extends block visibility block supports with responsive design controls for hiding blocks based on screen size.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'mobile',
		),
		array(
			'id'          => 'gutenberg-extensible-site-editor',
			'name'        => __( 'Extensible Site Editor', 'gutenberg' ),
			'description' => __( 'Redirects the default site editor (Appearance > Design) to use the extensible site editor page.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'plugins',
		),
		array(
			'id'          => 'active_templates',
			'name'        => __( 'Template Activation', 'gutenberg' ),
			'description' => __( 'Allows multiple templates of the same type to be created, of which one can be active at a time.', 'gutenberg' ),
			'warning'     => __( 'When you deactivate this experiment, it is best to delete all created templates except for the active ones.', 'gutenberg' ),
			'category'    => 'advanced',
			'learnMore'   => 'https://github.com/WordPress/gutenberg/issues/66950',
			'icon'        => 'layout',
		),
	);
}

/**
 * Register the gutenberg-experiments setting for REST API access.
 *
 * This allows the experiments page to use core-data's useEntityRecord
 * to read and write experiment settings.
 *
 * @since 20.0.0
 */
function gutenberg_register_experiments_setting() {
	$experiments = gutenberg_get_experiment_definitions();
	$properties  = array();

	foreach ( $experiments as $experiment ) {
		$properties[ $experiment['id'] ] = array( 'type' => 'boolean' );
	}

	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments',
		array(
			'type'         => 'object',
			'description'  => __( 'Gutenberg experimental settings.', 'gutenberg' ),
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
add_action( 'admin_init', 'gutenberg_register_experiments_setting' );
add_action( 'rest_api_init', 'gutenberg_register_experiments_setting' );

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 *
	 * Renders the modern React-based UI using the edit-site package.
	 *
	 * @since 6.3.0
	 */
	function the_gutenberg_experiments() {
		$suffix  = SCRIPT_DEBUG ? '' : '.min';
		$version = defined( 'GUTENBERG_VERSION' ) && ! SCRIPT_DEBUG ? GUTENBERG_VERSION : time();

		$style_path = gutenberg_dir_path() . 'build/styles/edit-site/experiments' . $suffix . '.css';

		// Enqueue experiments page styles if the file exists.
		if ( file_exists( $style_path ) ) {
			wp_enqueue_style(
				'wp-gutenberg-experiments',
				gutenberg_url( 'build/styles/edit-site/experiments' . $suffix . '.css' ),
				array( 'wp-components' ),
				$version
			);
			wp_style_add_data( 'wp-gutenberg-experiments', 'rtl', 'replace' );
			wp_style_add_data( 'wp-gutenberg-experiments', 'suffix', $suffix );
		}

		// Enqueue the edit-site script and its dependencies.
		wp_enqueue_script( 'wp-edit-site' );

		// Add inline script to initialize the experiments page.
		// This must come after wp_enqueue_script so the inline script attaches properly.
		wp_add_inline_script(
			'wp-edit-site',
			sprintf(
				'wp.domReady( function() {
					if ( wp.editSite && wp.editSite.initializeExperiments ) {
						wp.editSite.initializeExperiments( "gutenberg-experiments", %s );
					}
				} );',
				wp_json_encode( gutenberg_get_experiment_definitions() )
			)
		);

		// Output the mount point.
		echo '<div id="gutenberg-experiments"></div>';
	}
}

/**
 * Set up the experiments settings for the classic form.
 *
 * This is kept for backward compatibility and for users who have
 * JavaScript disabled.
 *
 * @since 6.3.0
 */
function gutenberg_initialize_experiments_settings() {
	add_settings_section(
		'gutenberg_experiments_section',
		// The empty string ensures the render function won't output a h2.
		'',
		'gutenberg_display_experiment_section',
		'gutenberg-experiments'
	);

	$experiments = gutenberg_get_experiment_definitions();

	foreach ( $experiments as $experiment ) {
		// Skip active_templates as it has special handling.
		if ( 'active_templates' === $experiment['id'] ) {
			continue;
		}

		$label = $experiment['description'];
		if ( ! empty( $experiment['warning'] ) ) {
			$label .= '<p class="description">(' . __( 'Warning:', 'gutenberg' ) . ' ' . $experiment['warning'] . ')</p>';
		}

		add_settings_field(
			$experiment['id'],
			$experiment['name'],
			'gutenberg_display_experiment_field',
			'gutenberg-experiments',
			'gutenberg_experiments_section',
			array(
				'label' => $label,
				'id'    => $experiment['id'],
			)
		);
	}
}

add_action( 'admin_init', 'gutenberg_initialize_experiments_settings' );

/**
 * Display a checkbox field for a Gutenberg experiment.
 *
 * @since 6.3.0
 *
 * @param array $args ( $label, $id ).
 */
function gutenberg_display_experiment_field( $args ) {
	$options = get_option( 'gutenberg-experiments' );
	$value   = isset( $options[ $args['id'] ] ) ? 1 : 0;
	?>
		<label for="<?php echo esc_attr( $args['id'] ); ?>">
			<input type="checkbox" name="<?php echo esc_attr( 'gutenberg-experiments[' . $args['id'] . ']' ); ?>" id="<?php echo esc_attr( $args['id'] ); ?>" value="1" <?php checked( 1, $value ); ?> />
			<?php echo wp_kses_post( $args['label'] ); ?>
		</label>
	<?php
}

/**
 * Display the experiments section.
 *
 * @since 6.3.0
 */
function gutenberg_display_experiment_section() {
	?>
	<p><?php echo esc_html__( "The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ); ?></p>

	<?php
}

add_action( 'admin_init', 'gutenberg_handle_template_activate_setting_submission' );
/**
 * Handle the template activation setting submission.
 *
 * @since 20.0.0
 */
function gutenberg_handle_template_activate_setting_submission() {
	if ( ! isset( $_POST['option_page'] ) || 'gutenberg-experiments' !== $_POST['option_page'] ) {
		return;
	}

	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['_wpnonce'] ) ), 'gutenberg-experiments-options' ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_POST['active_templates'] ) && '1' === $_POST['active_templates'] ) {
		if ( function_exists( 'gutenberg_get_migrated_active_templates' ) ) {
			update_option( 'active_templates', gutenberg_get_migrated_active_templates() );
		}
	} else {
		delete_option( 'active_templates' );
	}
}
