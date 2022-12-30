<?php
/**
 * Bootstrapping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

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
		'gutenberg-zoomed-out-view',
		__( 'Zoomed out view ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test a new zoomed out view on the site editor (Warning: The new feature is not ready. You may experience UX issues that are being addressed)', 'gutenberg' ),
			'id'    => 'gutenberg-zoomed-out-view',
		)
	);

	add_settings_field(
		'gutenberg-off-canvas-navigation-editor',
		__( 'Off canvas navigation editor ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test a new "off canvas" editor for navigation block using the block inspector and a tree view of the current menu', 'gutenberg' ),
			'id'    => 'gutenberg-off-canvas-navigation-editor',
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
		'gutenberg-block-inspector-tabs',
		__( 'Block inspector tabs ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test a new block inspector view splitting settings and appearance controls into tabs', 'gutenberg' ),
			'id'    => 'gutenberg-block-inspector-tabs',
		)
	);

	add_settings_field(
		'gutenberg-global-styles-custom-css',
		__( 'Global styles custom css ', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => sprintf(
				/* translators: %s: WordPress documentation for roles and capabilities. */
				__( 'Test the Global Styles custom CSS field in the site editor. This requires a user to have <a href="%s">unfiltered html capabilities</a>.', 'gutenberg' ),
				'https://wordpress.org/support/article/roles-and-capabilities/#unfiltered_html'
			),
			'id'    => 'gutenberg-global-styles-custom-css',
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
	<p><?php echo __( "The block editor includes experimental features that are useable while they're in development. Select the ones you'd like to enable. These features are likely to change, so avoid using them in production.", 'gutenberg' ); ?></p>

	<?php
}
