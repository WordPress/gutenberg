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
		'gutenberg-navigation',
		__( 'Navigation', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable Navigation screen', 'gutenberg' ),
			'id'    => 'gutenberg-navigation',
		)
	);
	add_settings_field(
		'gutenberg-list-v2',
		__( 'List block v2', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Test a new list block that uses nested list item blocks (Warning: The new block is not ready. You may experience content loss, avoid using it on production sites)', 'gutenberg' ),
			'id'    => 'gutenberg-list-v2',
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

/**
 * Extends default editor settings with experiments settings.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_experiments_editor_settings( $settings ) {
	// The refactored gallery currently can't be run on sites with use_balanceTags option set.
	// This bypass needs to remain in place until this is resolved and a patch released.
	// https://core.trac.wordpress.org/ticket/54130.
	$experiments_settings = array(
		'__unstableGalleryWithImageBlocks' => (int) get_option( 'use_balanceTags' ) !== 1 || is_wp_version_compatible( '5.9' ),
	);
	return array_merge( $settings, $experiments_settings );
}

add_filter( 'block_editor_settings_all', 'gutenberg_experiments_editor_settings' );
