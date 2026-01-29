<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'the_gutenberg_experiments' ) ) {
	/**
	 * The main entry point for the Gutenberg experiments page.
	 *
	 * @since 6.3.0
	 */
	function the_gutenberg_experiments() {
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
		'gutenberg-media-editor',
		__( 'Media Editor', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enables editing media items (attachments) directly in the block editor with a dedicated media preview and metadata panel.', 'gutenberg' ),
			'id'    => 'gutenberg-media-editor',
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
