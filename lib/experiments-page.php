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
		'gutenberg-sync-collaboration',
		__( 'Live Collaboration and offline persistence ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable the live collaboration and offline persistence between peers', 'gutenberg' ),
			'id'    => 'gutenberg-sync-collaboration',
		)
	);

	add_settings_field(
		'gutenberg-custom-dataviews',
		__( 'Custom dataviews', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test the custom dataviews in the pages page.', 'gutenberg' ),
			'id'    => 'gutenberg-custom-dataviews',
		)
	);

	add_settings_field(
		'gutenberg-color-randomizer',
		__( 'Color randomizer ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test the Global Styles color randomizer; a utility that lets you mix the current color palette pseudo-randomly.', 'gutenberg' ),
			'id'    => 'gutenberg-color-randomizer',
		)
	);

	add_settings_field(
		'gutenberg-block-experiments',
		__( 'Experimental blocks', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable experimental blocks.<p class="description">(Warning: these blocks may have significant changes during development that cause validation errors and display issues.)</p>', 'gutenberg' ),
			'id'    => 'gutenberg-block-experiments',
		)
	);

	add_settings_field(
		'gutenberg-form-blocks',
		__( 'Form and input blocks ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test new blocks to allow building forms (Warning: The new feature is not ready. You may experience UX issues that are being addressed)', 'gutenberg' ),
			'id'    => 'gutenberg-form-blocks',
		)
	);

	add_settings_field(
		'gutenberg-grid-interactivity',
		__( 'Grid interactivity ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test enhancements to the Grid block that let you move and resize items in the editor canvas.', 'gutenberg' ),
			'id'    => 'gutenberg-grid-interactivity',
		)
	);

	add_settings_field(
		'gutenberg-no-tinymce',
		__( 'Disable TinyMCE and Classic block', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Disable TinyMCE and Classic block', 'gutenberg' ),
			'id'    => 'gutenberg-no-tinymce',
		)
	);

	add_settings_field(
		'gutenberg-full-page-client-side-navigation',
		__( 'Enable full page client-side navigation', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable full page client-side navigation using the Interactivity API', 'gutenberg' ),
			'id'    => 'gutenberg-full-page-client-side-navigation',
		)
	);

	add_settings_field(
		'gutenberg-zoomed-out-patterns-tab',
		__( 'Enable zoomed out view when patterns are browsed in the inserter', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable zoomed out view when selecting a pattern category in the main inserter.', 'gutenberg' ),
			'id'    => 'gutenberg-zoomed-out-patterns-tab',
		)
	);

	add_settings_field(
		'gutenberg-new-posts-dashboard',
		__( 'Redesigned posts dashboard', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable a redesigned posts dashboard.', 'gutenberg' ),
			'id'    => 'gutenberg-new-posts-dashboard',
		)
	);

	add_settings_field(
		'gutenberg-quick-edit-dataviews',
		__( 'Quick Edit in DataViews', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Allow access to a quick edit panel in the pages data views.', 'gutenberg' ),
			'id'    => 'gutenberg-quick-edit-dataviews',
		)
	);

	add_settings_field(
		'gutenberg-block-bindings-ui',
		__( 'UI to create block bindings', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Add UI to create and update block bindings in block inspector controls.', 'gutenberg' ),
			'id'    => 'gutenberg-block-bindings-ui',
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
