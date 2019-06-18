<?php
/**
 * Bootstraping the Gutenberg Customizer widget blocks section.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Customize Register.
 *
 * Adds a section to the Customizer for editing widgets with Gutenberg.
 *
 * @param \WP_Customize_Manager $wp_customize An instance of the class that controls most of the Theme Customization API for WordPress 3.4 and newer.
 * @since 6.0.0
 */
function gutenberg_customize_register( $wp_customize ) {
	require dirname( __FILE__ ) . '/class-wp-customize-widget-blocks-control.php';
	$wp_customize->add_setting( 'gutenberg_widget_blocks' );
	$wp_customize->add_section(
		'gutenberg_widget_blocks',
		array( 'title' => __( 'Widget Blocks', 'gutenberg' ) )
	);
	$wp_customize->add_control( new WP_Customize_Widget_Blocks_Control(
		$wp_customize,
		'gutenberg_widget_blocks',
		array(
			'section'  => 'gutenberg_widget_blocks',
			'settings' => 'gutenberg_widget_blocks',
		)
	) );
}
add_action( 'customize_register', 'gutenberg_customize_register' );

/**
 * Filters the Customizer widget settings arguments.
 * This is needed because the Customizer registers settings for the raw registered widgets, without going through the `sidebars_widgets` filter.
 * The `WP_Customize_Widgets` class expects sidebars to have an array of widgets registered, not a post ID.
 * This results in the value passed to `sanitize_js_callback` being `null` and throwing an error.
 *
 * TODO: Figure out why core is not running the `sidebars_widgets` filter for the relevant part of the code.
 * Then, either fix it or change this filter to parse the post IDs and then pass them to the original `sanitize_js_callback`.
 *
 * @param array  $args Array of Customizer setting arguments.
 * @param string $id Widget setting ID.
 * @return array Maybe modified array of Customizer setting arguments.
 */
function filter_widget_customizer_setting_args( $args, $id = null ) {
	// Posts won't have a settings ID like widgets. We can use that to remove the sanitization callback.
	if ( ! isset( $id ) ) {
		unset( $args['sanitize_js_callback'] );
	}

	return $args;
}
add_filter( 'widget_customizer_setting_args', 'filter_widget_customizer_setting_args' );
