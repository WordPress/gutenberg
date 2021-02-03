<?php
/**
 * Bootstrapping the Gutenberg widgets editor in the customizer.
 *
 * @package gutenberg
 */

/**
 * The sanitization function for incoming values for the `gutenberg_widget_blocks` setting.
 * It's a JSON string, so it decodes it and encodes it again to make sure it's valid.
 *
 * @param string $value The incoming value.
 */
function gutenberg_customize_sanitize( $value ) {
	return json_encode( json_decode( $value ) );
}

/**
 * Gutenberg's Customize Register.
 *
 * Adds a section to the Customizer for editing widgets with Gutenberg.
 *
 * @param \WP_Customize_Manager $manager An instance of the class that controls most of the Theme Customization API for WordPress 3.4 and newer.
 */
function gutenberg_widgets_customize_register( $manager ) {
	if ( ! gutenberg_use_widgets_block_editor() ) {
		return;
	}

	require_once __DIR__ . '/class-wp-sidebar-block-editor-control.php';

	// Remove the original "Widgets" section.
	foreach ( $manager->sections() as $section ) {
		if (
			$section instanceof WP_Customize_Sidebar_Section
		) {
			$manager->remove_section( $section->id );
			break;
		}
	}

	$manager->add_setting(
		'gutenberg_widget_blocks',
		array(
			'default'           => '{}',
			'type'              => 'gutenberg_widget_blocks',
			'capability'        => 'edit_theme_options',
			'transport'         => 'postMessage',
			'sanitize_callback' => 'gutenberg_customize_sanitize',
		)
	);

	$manager->add_section(
		'gutenberg_widget_blocks',
		array( 'title' => __( 'Widget Blocks', 'gutenberg' ) )
	);
	$manager->add_control(
		new WP_Sidebar_Block_Editor_Control(
			$manager,
			'gutenberg_widget_blocks',
			array(
				'section'  => 'gutenberg_widget_blocks',
				'settings' => 'gutenberg_widget_blocks',
			)
		)
	);
}

/**
 * Filters the Customizer widget settings arguments.
 * This is needed because the Customizer registers settings for the raw registered widgets, without going through the `sidebars_widgets` filter.
 * The `WP_Customize_Widgets` class expects sidebars to have an array of widgets registered, not a post ID.
 * This results in the value passed to `sanitize_js_callback` being `null` and throwing an error.
 *
 * TODO: Figure out why core is not running the `sidebars_widgets` filter for the relevant part of the code.
 * Then, either fix it or change this filter to parse the post IDs and then pass them to the original `sanitize_js_callback`.
 *
 * @param  array  $args Array of Customizer setting arguments.
 * @param  string $id Widget setting ID.
 * @return array  Maybe modified array of Customizer setting arguments.
 */
function filter_widget_customizer_setting_args( $args, $id = null ) {
	// Posts won't have a settings ID like widgets. We can use that to remove the sanitization callback.
	if ( ! isset( $id ) ) {
		unset( $args['sanitize_js_callback'] );
	}

	return $args;
}

if ( gutenberg_is_experiment_enabled( 'gutenberg-widgets-in-customizer' ) && gutenberg_use_widgets_block_editor() ) {
	add_action( 'customize_register', 'gutenberg_widgets_customize_register' );
	add_filter( 'widget_customizer_setting_args', 'filter_widget_customizer_setting_args' );
}
