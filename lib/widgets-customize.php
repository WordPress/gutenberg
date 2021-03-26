<?php
/**
 * Bootstrapping the Gutenberg widgets editor in the customizer.
 *
 * @package gutenberg
 */

/**
 * Gutenberg's Customize Register.
 *
 * Adds a section to the Customizer for editing widgets with Gutenberg.
 *
 * @param \WP_Customize_Manager $manager An instance of the class that controls most of the Theme Customization API for WordPress 3.4 and newer.
 */
function gutenberg_widgets_customize_register( $manager ) {
	global $wp_registered_sidebars;

	if ( ! gutenberg_use_widgets_block_editor() ) {
		return;
	}

	require_once __DIR__ . '/class-wp-sidebar-block-editor-control.php';

	foreach ( $manager->sections() as $section ) {
		if ( $section instanceof WP_Customize_Sidebar_Section ) {
			$section->description = '';
		}
	}
	foreach ( $manager->controls() as $control ) {
		if (
			$control instanceof WP_Widget_Area_Customize_Control ||
			$control instanceof WP_Widget_Form_Customize_Control
		) {
			$manager->remove_control( $control->id );
		}
	}

	foreach ( $wp_registered_sidebars as $sidebar_id => $sidebar ) {
		$manager->add_setting(
			"sidebars_widgets[$sidebar_id]",
			array(
				'capability' => 'edit_theme_options',
				'transport'  => 'postMessage',
			)
		);

		$manager->add_control(
			new WP_Sidebar_Block_Editor_Control(
				$manager,
				"sidebars_widgets[$sidebar_id]",
				array(
					'section'    => "sidebar-widgets-$sidebar_id",
					'settings'   => "sidebars_widgets[$sidebar_id]",
					'sidebar_id' => $sidebar_id,
				)
			)
		);
	}
}

/**
 * Our own implementation of WP_Customize_Widgets::sanitize_widget_instance
 * which uses __unstable_instance if it exists.
 *
 * @param array $value Widget instance to sanitize.
 * @return array|void Sanitized widget instance.
 */
function gutenberg_widgets_customize_sanitize_widget_instance( $value ) {
	global $wp_customize;

	if ( isset( $value['__unstable_instance'] ) ) {
		return $value['__unstable_instance'];
	}

	return $wp_customize->widgets->sanitize_widget_instance( $value );
}

/**
 * Our own implementation of WP_Customize_Widgets::sanitize_widget_js_instance
 * which adds __unstable_instance.
 *
 * @param array $value Widget instance to convert to JSON.
 * @return array JSON-converted widget instance.
 */
function gutenberg_widgets_customize_sanitize_widget_js_instance( $value ) {
	global $wp_customize;

	$sanitized_value = $wp_customize->widgets->sanitize_widget_js_instance( $value );

	$sanitized_value['__unstable_instance'] = $value;

	return $sanitized_value;
}

/**
 * TEMPORARY HACK! \o/
 *
 * Swaps the customizer setting's sanitize_callback and sanitize_js_callback
 * arguments with our own implementation that adds __unstable_instance to the
 * sanitized value.
 *
 * This lets the block editor use __unstable_instance to create blocks.
 *
 * A proper fix would be to only add the raw instance when the widget is a block
 * widget and to update the Legacy Widget block to work with encoded instance
 * values. See https://github.com/WordPress/gutenberg/issues/28902.
 *
 * @param array  $args Array of Customizer setting arguments.
 * @param string $id   Widget setting ID.
 */
function gutenberg_widgets_customize_add_unstable_instance( $args, $id ) {
	if ( 0 === strpos( $id, 'widget_' ) ) {
		$args['sanitize_callback']    = 'gutenberg_widgets_customize_sanitize_widget_instance';
		$args['sanitize_js_callback'] = 'gutenberg_widgets_customize_sanitize_widget_js_instance';
	}

	return $args;
}

if ( gutenberg_is_experiment_enabled( 'gutenberg-widgets-in-customizer' ) ) {
	add_action( 'customize_register', 'gutenberg_widgets_customize_register' );
	add_filter( 'widget_customizer_setting_args', 'gutenberg_widgets_customize_add_unstable_instance', 10, 2 );
}
