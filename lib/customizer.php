<?php
/**
 * Bootstraping the Gutenberg Customizer widget blocks section.
 *
 * Widget area edits made in the Customizer are synced to Customizer
 * changesets as an object, encoded as a JSON string, where the keys
 * are widget area IDs and the values are serialized block content.
 * This file takes care of that syncing using the 2-way data binding
 * supported by `WP_Customize_Control`s. The process is as follows:
 *
 * - On load, the client checks if the current changeset has
 * widget areas that it can parse and use to hydrate the store.
 * It will load all widget areas for the current theme, but if
 * the changeset has content for a given area, it will replace
 * its actual published content with the changeset's.
 *
 * - On edit, the client updates the 2-way bound input with a new object that maps
 * widget area IDs and the values are serialized block content, encoded
 * as a JSON string.
 *
 * - On publish, a PHP action will parse the JSON string in the
 * changeset and update all the widget areas in it, to store the
 * new content.
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
 * @param \WP_Customize_Manager $wp_customize An instance of the class that controls most of the Theme Customization API for WordPress 3.4 and newer.
 * @since 6.1.0
 */
function gutenberg_customize_register( $wp_customize ) {
	require dirname( __FILE__ ) . '/class-wp-customize-widget-blocks-control.php';
	$wp_customize->add_setting(
		'gutenberg_widget_blocks',
		array(
			'default'           => '{}',
			'type'              => 'gutenberg_widget_blocks',
			'capability'        => 'edit_theme_options',
			'transport'         => 'postMessage',
			'sanitize_callback' => 'gutenberg_customize_sanitize',
		)
	);
	$wp_customize->add_section(
		'gutenberg_widget_blocks',
		array( 'title' => __( 'Widget Blocks (Experimental)', 'gutenberg' ) )
	);
	$wp_customize->add_control(
		new WP_Customize_Widget_Blocks_Control(
			$wp_customize,
			'gutenberg_widget_blocks',
			array(
				'section'  => 'gutenberg_widget_blocks',
				'settings' => 'gutenberg_widget_blocks',
			)
		)
	);
}
add_action( 'customize_register', 'gutenberg_customize_register' );

/**
 * Specifies how to save the `gutenberg_widget_blocks` setting. It parses the JSON string and updates the
 * referenced widget areas with the new content.
 *
 * @param string                $value   The value that is being published.
 * @param \WP_Customize_Setting $setting The setting instance.
 */
function gutenberg_customize_update( $value, $setting ) {
	foreach ( json_decode( $value ) as $sidebar_id => $sidebar_content ) {
		$id_referenced_in_sidebar = Experimental_WP_Widget_Blocks_Manager::get_post_id_referenced_in_sidebar( $sidebar_id );

		$post_id = wp_insert_post(
			array(
				'ID'           => $id_referenced_in_sidebar,
				'post_content' => $sidebar_content,
				'post_type'    => 'wp_area',
			)
		);

		if ( 0 === $id_referenced_in_sidebar ) {
			Experimental_WP_Widget_Blocks_Manager::reference_post_id_in_sidebar( $sidebar_id, $post_id );
		}
	}
}
add_action( 'customize_update_gutenberg_widget_blocks', 'gutenberg_customize_update', 10, 2 );

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
add_filter( 'widget_customizer_setting_args', 'filter_widget_customizer_setting_args' );
