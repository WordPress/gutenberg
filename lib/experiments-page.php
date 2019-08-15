<?php
/**
 * Bootstraping the Gutenberg experiments page.
 *
 * @package gutenberg
 */

/**
 * The main entry point for the Gutenberg experiments page.
 *
 * @since 6.3.0
 *
 * @param string $page The page name the function is being called for, `'gutenberg_customizer'` for the Customizer.
 */
function the_gutenberg_experiments( $page = 'gutenberg_page_gutenberg-experiments' ) {
	?>
	<div
		id="experiments-editor"
		class="wrap"
	>
	<h1><?php echo __( 'Experiment settings', 'gutenberg' ); ?></h1>
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
		'gutenberg-widget-experiments',
		__( 'Widgets', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable Widgets Screen and Legacy Widget Block', 'gutenberg' ),
			'id'    => 'gutenberg-widget-experiments',
		)
	);
	add_settings_field(
		'gutenberg-menu-block',
		__( 'Menu Block', 'gutenberg' ),
		'gutenberg_display_experiment_field',
		'gutenberg-experiments',
		'gutenberg_experiments_section',
		array(
			'label' => __( 'Enable Navigation Menu Block', 'gutenberg' ),
			'id'    => 'gutenberg-menu-block',
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
	<p><?php echo __( 'Gutenberg has some experimental features you can turn on. Simply select each you would like to use. These features are likely to change so it is inadvisable to use them in production.', 'gutenberg' ); ?></p>

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
	$experiments_exist    = get_option( 'gutenberg-experiments' );
	$experiments_settings = array(
		'__experimentalEnableLegacyWidgetBlock' => $experiments_exist ? array_key_exists( 'gutenberg-widget-experiments', get_option( 'gutenberg-experiments' ) ) : false,
		'__experimentalEnableMenuBlock'         => $experiments_exist ? array_key_exists( 'gutenberg-menu-block', get_option( 'gutenberg-experiments' ) ) : false,
	);
	return array_merge( $settings, $experiments_settings );
}
add_filter( 'block_editor_settings', 'gutenberg_experiments_editor_settings' );
