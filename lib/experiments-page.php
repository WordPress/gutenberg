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
			'id'          => 'gutenberg-experiments-page-redesign',
			'name'        => __( 'Experiments Page Redesign', 'gutenberg' ),
			'description' => __( 'Enables a modern card-based UI for the Gutenberg experiments settings page.', 'gutenberg' ),
			'category'    => 'advanced',
			'icon'        => 'layout',
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
 * Get category labels for experiment categories.
 *
 * @since 20.0.0
 *
 * @return array Array of category labels.
 */
function gutenberg_get_experiment_category_labels() {
	return array(
		'blocks'   => array(
			'label' => __( 'Blocks', 'gutenberg' ),
			'icon'  => 'blockDefault',
		),
		'editor'   => array(
			'label' => __( 'Editor', 'gutenberg' ),
			'icon'  => 'pencil',
		),
		'advanced' => array(
			'label' => __( 'Advanced', 'gutenberg' ),
			'icon'  => 'settings',
		),
	);
}

/**
 * Register REST API routes for experiments.
 *
 * @since 20.0.0
 */
function gutenberg_register_experiments_rest_routes() {
	register_rest_route(
		'gutenberg/v1',
		'/experiments',
		array(
			array(
				'methods'             => 'GET',
				'callback'            => 'gutenberg_rest_get_experiments',
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
			),
			array(
				'methods'             => 'POST',
				'callback'            => 'gutenberg_rest_update_experiment',
				'permission_callback' => static function () {
					return current_user_can( 'manage_options' );
				},
				'args'                => array(
					'id'      => array(
						'type'              => 'string',
						'required'          => true,
						'sanitize_callback' => 'sanitize_text_field',
					),
					'enabled' => array(
						'type'     => 'boolean',
						'required' => true,
					),
				),
			),
		)
	);
}
add_action( 'rest_api_init', 'gutenberg_register_experiments_rest_routes' );

/**
 * REST API callback to get all experiments.
 *
 * @since 20.0.0
 *
 * @return WP_REST_Response
 */
function gutenberg_rest_get_experiments() {
	$definitions    = gutenberg_get_experiment_definitions();
	$options        = get_option( 'gutenberg-experiments', array() );
	$category_order = array_keys( gutenberg_get_experiment_category_labels() );

	$experiments = array();
	foreach ( $definitions as $experiment ) {
		$id = $experiment['id'];

		// Handle active_templates special case.
		if ( 'active_templates' === $id ) {
			$enabled = gutenberg_is_experiment_enabled( 'active_templates' );
		} else {
			$enabled = ! empty( $options[ $id ] );
		}

		$experiments[] = array(
			'id'          => $id,
			'name'        => $experiment['name'],
			'description' => $experiment['description'],
			'warning'     => isset( $experiment['warning'] ) ? $experiment['warning'] : null,
			'category'    => $experiment['category'],
			'requires'    => isset( $experiment['requires'] ) ? $experiment['requires'] : null,
			'learnMore'   => isset( $experiment['learnMore'] ) ? $experiment['learnMore'] : null,
			'icon'        => isset( $experiment['icon'] ) ? $experiment['icon'] : 'plugins',
			'enabled'     => $enabled,
		);
	}

	return new WP_REST_Response(
		array(
			'experiments'   => $experiments,
			'categories'    => gutenberg_get_experiment_category_labels(),
			'categoryOrder' => $category_order,
		),
		200
	);
}

/**
 * REST API callback to update an experiment.
 *
 * @since 20.0.0
 *
 * @param WP_REST_Request $request Request object.
 * @return WP_REST_Response
 */
function gutenberg_rest_update_experiment( $request ) {
	$id      = $request->get_param( 'id' );
	$enabled = $request->get_param( 'enabled' );

	// Validate the experiment ID.
	$definitions = gutenberg_get_experiment_definitions();
	$valid_ids   = array_column( $definitions, 'id' );
	if ( ! in_array( $id, $valid_ids, true ) ) {
		return new WP_REST_Response(
			array(
				'success' => false,
				'message' => __( 'Invalid experiment ID.', 'gutenberg' ),
			),
			400
		);
	}

	// Handle active_templates special case.
	if ( 'active_templates' === $id ) {
		if ( $enabled ) {
			if ( function_exists( 'gutenberg_get_migrated_active_templates' ) ) {
				update_option( 'active_templates', gutenberg_get_migrated_active_templates() );
			}
		} else {
			delete_option( 'active_templates' );
		}
	} else {
		$options = get_option( 'gutenberg-experiments', array() );
		if ( $enabled ) {
			$options[ $id ] = 1;
		} else {
			unset( $options[ $id ] );
		}
		update_option( 'gutenberg-experiments', $options );
	}

	return new WP_REST_Response(
		array(
			'success' => true,
			'message' => __( 'Setting saved.', 'gutenberg' ),
			'id'      => $id,
			'enabled' => $enabled,
		),
		200
	);
}

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 *
	 * Conditionally renders either the modern React-based UI (when the
	 * experiments page redesign experiment is enabled) or the classic
	 * WordPress Settings API form.
	 *
	 * @since 6.3.0
	 */
	function the_gutenberg_experiments() {
		// Check if the modern experiments page redesign is enabled.
		if ( gutenberg_is_experiment_enabled( 'gutenberg-experiments-page-redesign' ) ) {
			?>
			<div class="wrap">
				<div id="gutenberg-experiments-root"></div>
			</div>
			<?php
			return;
		}

		// Render the classic Settings API form.
		?>
		<div
			id="experiments-editor"
			class="wrap"
		>
		<h1><?php echo __( 'Experimental settings', 'gutenberg' ); ?></h1>
		<?php settings_errors(); ?>
		<form method="post" action="options.php">
			<?php settings_fields( 'gutenberg-experiments' ); ?>
			<?php do_settings_sections( 'gutenberg-experiments' ); ?>
			<!-- We use a separate table for the template activation experiment because the option is managed separately. -->
			<table class="form-table">
				<tr>
					<th scope="row">
						<label for="active_templates"><?php echo __( 'Template Activation', 'gutenberg' ); ?></label>
						<br><a href="https://github.com/WordPress/gutenberg/issues/66950" target="_blank"><?php echo __( 'Learn more', 'gutenberg' ); ?></a>
					</th>
					<td>
						<label for="active_templates">
							<input
								type="checkbox"
								name="active_templates"
								id="active_templates"
								value="1"
								<?php checked( 1, gutenberg_is_experiment_enabled( 'active_templates' ) ); ?>
							/>
							<?php echo __( 'Allows multiple templates of the same type to be created, of which one can be active at a time.', 'gutenberg' ); ?>
							<p class="description"><?php echo __( 'Warning: when you deactivate this experiment, it is best to delete all created templates except for the active ones.', 'gutenberg' ); ?></p>
						</label>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		</div>
		<?php
	}
}

/**
 * Enqueue scripts and styles for the experiments page.
 *
 * Only loads the React-based UI when the experiments page redesign
 * experiment is enabled.
 *
 * @since 20.0.0
 *
 * @param string $hook The current admin page hook.
 */
function gutenberg_experiments_enqueue_scripts( $hook ) {
	if ( 'gutenberg_page_gutenberg-experiments' !== $hook ) {
		return;
	}

	// Only enqueue the React UI if the experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-experiments-page-redesign' ) ) {
		return;
	}

	$asset_file = gutenberg_dir_path() . 'build/experiments-page/index.asset.php';

	if ( ! file_exists( $asset_file ) ) {
		return;
	}

	$asset = require $asset_file;

	wp_enqueue_script(
		'wp-experiments-page',
		gutenberg_url( 'build/experiments-page/index.js' ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	wp_enqueue_style(
		'wp-experiments-page',
		gutenberg_url( 'build/experiments-page/style-index.css' ),
		array( 'wp-components' ),
		$asset['version']
	);

	wp_set_script_translations( 'wp-experiments-page', 'gutenberg' );
}
add_action( 'admin_enqueue_scripts', 'gutenberg_experiments_enqueue_scripts' );

/**
 * Set up the experiments settings.
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

	add_settings_field(
		'gutenberg-block-experiments',
		__( 'Blocks: add experimental blocks', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables experimental blocks on a rolling basis as they are developed.<p class="description">(Warning: these blocks may have significant changes during development that cause validation errors and display issues.)</p>', 'gutenberg' ),
			'id'    => 'gutenberg-block-experiments',
		)
	);

	add_settings_field(
		'gutenberg-form-blocks',
		__( 'Blocks: add Form and input blocks', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables new blocks to allow building forms. You are likely to experience UX issues that are being addressed.', 'gutenberg' ),
			'id'    => 'gutenberg-form-blocks',
		)
	);

	add_settings_field(
		'gutenberg-grid-interactivity',
		__( 'Blocks: add Grid interactivity', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
			'id'    => 'gutenberg-grid-interactivity',
		)
	);

	add_settings_field(
		'gutenberg-no-tinymce',
		__( 'Blocks: disable TinyMCE and Classic block', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Disables the TinyMCE and Classic block.', 'gutenberg' ),
			'id'    => 'gutenberg-no-tinymce',
		)
	);

	add_settings_field(
		'gutenberg-media-processing',
		__( 'Client-side media processing', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables client-side media processing to leverage the browser\'s capabilities to handle tasks like image resizing and compression.', 'gutenberg' ),
			'id'    => 'gutenberg-media-processing',
		)
	);

	add_settings_field(
		'gutenberg-sync-collaboration',
		__( 'Collaboration: add real time editing', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables live collaboration and offline persistence between peers.', 'gutenberg' ),
			'id'    => 'gutenberg-sync-collaboration',
		)
	);

	add_settings_field(
		'gutenberg-color-randomizer',
		__( 'Color randomizer', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables the Global Styles color randomizer in the Site Editor; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
			'id'    => 'gutenberg-color-randomizer',
		)
	);

	add_settings_field(
		'gutenberg-quick-edit-dataviews',
		__( 'Data Views: add Quick Edit', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables access to a Quick Edit panel in the Site Editor Pages experience.', 'gutenberg' ),
			'id'    => 'gutenberg-quick-edit-dataviews',
		)
	);

	add_settings_field(
		'gutenberg-dataviews-media-modal',
		__( 'Data Views: new media modal', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables a new media modal experience powered by Data Views for improved media library management.', 'gutenberg' ),
			'id'    => 'gutenberg-dataviews-media-modal',
		)
	);

	add_settings_field(
		'gutenberg-full-page-client-side-navigation',
		__( 'Interactivity API: Full-page client-side navigation', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables full-page client-side navigation, powered by the Interactivity API.', 'gutenberg' ),
			'id'    => 'gutenberg-full-page-client-side-navigation',
		)
	);

	add_settings_field(
		'gutenberg-content-only-pattern-insertion',
		__( 'Pattern Editing: Make patterns contentOnly by default upon insertion', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'When patterns are inserted, default to a simplified content only mode for editing pattern content.', 'gutenberg' ),
			'id'    => 'gutenberg-content-only-pattern-insertion',
		)
	);

	add_settings_field(
		'gutenberg-content-only-inspector-fields',
		__( 'Block fields: Show dataform driven inspector fields on blocks that support them', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables editable block inspector fields that are generated using a dataform.', 'gutenberg' ),
			'id'    => 'gutenberg-content-only-inspector-fields',
		)
	);

	add_settings_field(
		'gutenberg-workflow-palette',
		__( 'Workflow Palette', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables the Workflow Palette for running workflows composed of abilities, from a unified interface.', 'gutenberg' ),
			'id'    => 'gutenberg-workflow-palette',
		)
	);

	add_settings_field(
		'gutenberg-customizable-navigation-overlays',
		__( 'Customizable Navigation Overlays', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables custom mobile overlay design and content control for Navigation blocks, allowing you to create flexible, professional menu experiences.', 'gutenberg' ),
			'id'    => 'gutenberg-customizable-navigation-overlays',
		)
	);

	add_settings_field(
		'gutenberg-hide-blocks-based-on-screen-size',
		__( 'Hide blocks based on screen size', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Extends block visibility block supports with responsive design controls for hiding blocks based on screen size.', 'gutenberg' ),
			'id'    => 'gutenberg-hide-blocks-based-on-screen-size',
		)
	);

	add_settings_field(
		'gutenberg-extensible-site-editor',
		__( 'Extensible Site Editor', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Redirects the default site editor (Appearance > Design) to use the extensible site editor page.', 'gutenberg' ),
			'id'    => 'gutenberg-extensible-site-editor',
		)
	);

	add_settings_field(
		'gutenberg-experiments-page-redesign',
		__( 'Experiments Page Redesign', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables a modern card-based UI for the Gutenberg experiments settings page.', 'gutenberg' ),
			'id'    => 'gutenberg-experiments-page-redesign',
		)
	);

	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments'
	);
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
		<label for="<?php echo $args['id']; ?>">
			<input type="checkbox" name="<?php echo 'gutenberg-experiments[' . $args['id'] . ']'; ?>" id="<?php echo $args['id']; ?>" value="1" <?php checked( 1, $value ); ?> />
			<?php echo $args['label']; ?>
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
	<p><?php echo __( "The block editor includes experimental features that are usable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ); ?></p>

	<?php
}

add_action( 'admin_init', 'gutenberg_handle_template_activate_setting_submission' );
function gutenberg_handle_template_activate_setting_submission() {
	if ( ! isset( $_POST['option_page'] ) || 'gutenberg-experiments' !== $_POST['option_page'] ) {
		return;
	}

	if ( ! isset( $_POST['_wpnonce'] ) || ! wp_verify_nonce( $_POST['_wpnonce'], 'gutenberg-experiments-options' ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( isset( $_POST['active_templates'] ) && '1' === $_POST['active_templates'] ) {
		update_option( 'active_templates', gutenberg_get_migrated_active_templates() );
	} else {
		delete_option( 'active_templates' );
	}
}
