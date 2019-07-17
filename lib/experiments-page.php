<?php
/**
 * Bootstraping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg experiments page.
 *
 * @since 5.2.3
 *
 * @param string $page The page name the function is being called for, `'gutenberg_customizer'` for the Customizer.
 */
function the_gutenberg_experiments( $page = 'gutenberg_page_gutenberg-experiments' ) {
	?>
	<div
		id="experiments-editor"
		class="blocks-experiments-container"
	>
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
 * @since 5.2.3
 */
function initialize_experiments_settings() {
	add_settings_section(
		'gutenberg_experiments_section',
		'Experiment settings',
		'display_experiment_section',
		'gutenberg-experiments'
	);
	add_settings_field(
		'gutenberg-widgets-screen',
		'Widgets Screen',
		'display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'Widgets Screen',
			'gutenberg-widgets-screen',
		)
	);
	add_settings_field(
		'gutenberg-legacy-widget-block',
		'Legacy Widget Block',
		'display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'Legacy Widget Block',
			'gutenberg-legacy-widget-block',
		)
	);
	register_setting(
		'gutenberg-experiments',
		'gutenberg-experiments'
	);
}

add_action( 'admin_init', 'initialize_experiments_settings' );

/**
 * Display a checkbox field for a Gutenberg experiment.
 *
 * @since 5.2.3
 *
 * @param array $args ( $label, $id ).
 */
function display_experiment_field( $args ) {
	$options = get_option( 'gutenberg-experiments' );
	$value   = isset( $options[ $args[1] ] ) ? 1 : 0;
	?>
		<input type="checkbox" name="<?php echo 'gutenberg-experiments[' . $args[1] . ']'; ?>" id="<?php echo $args[1]; ?>" value="1" <?php checked( 1, $value ); ?> />
		<label for="<?php echo $args[1]; ?>">
			<?php echo $args[0]; ?>
		</label>
	<?php
}

/**
 * Display the experiments section.
 *
 * @since 5.2.3
 */
function display_experiment_section() {

	$markup = '<p>' . __( 'Gutenberg has a some experimental features you can turn on. Simply select each you would like to use.', 'gutenberg' ) . '</p>';
	echo $markup;

}
