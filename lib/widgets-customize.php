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
					'section'     => "sidebar-widgets-$sidebar_id",
					'settings'    => "sidebars_widgets[$sidebar_id]",
					'sidebar_id'  => $sidebar_id,
					'label'       => $sidebar['name'],
					'description' => $sidebar['description'],
				)
			)
		);
	}
}

/**
 * Swaps the customizer setting's sanitize_callback and sanitize_js_callback
 * arguments with our own implementation that adds raw_instance to the sanitized
 * value. This is only done if the widget has declared that it supports raw
 * instances via the show_instance_in_rest flag. This lets the block editor use
 * raw_instance to create blocks.
 *
 * When merged to Core, these changes should be made to
 * WP_Customize_Widgets::sanitize_widget_instance and
 * WP_Customize_Widgets::sanitize_widget_js_instance.
 *
 * @param array  $args Array of Customizer setting arguments.
 * @param string $id   Widget setting ID.
 */
function gutenberg_widgets_customize_add_unstable_instance( $args, $id ) {
	if ( gutenberg_use_widgets_block_editor() && preg_match( '/^widget_(?P<id_base>.+?)(?:\[(?P<widget_number>\d+)\])?$/', $id, $matches ) ) {
		$id_base = $matches['id_base'];

		$args['sanitize_callback'] = function( $value ) use ( $id_base ) {
			global $wp_customize;

			if ( isset( $value['raw_instance'] ) ) {
				$widget_object = gutenberg_get_widget_object( $id_base );
				if ( ! empty( $widget_object->show_instance_in_rest ) ) {
					return $value['raw_instance'];
				}
			}

			return $wp_customize->widgets->sanitize_widget_instance( $value );
		};

		$args['sanitize_js_callback'] = function( $value ) use ( $id_base ) {
			global $wp_customize;

			$sanitized_value = $wp_customize->widgets->sanitize_widget_js_instance( $value );

			$widget_object = gutenberg_get_widget_object( $id_base );
			if ( ! empty( $widget_object->show_instance_in_rest ) ) {
				$sanitized_value['raw_instance'] = (object) $value;
			}

			return $sanitized_value;
		};
	}

	return $args;
}

/**
 * Initialize the Gutenberg customize widgets page.
 */
function gutenberg_customize_widgets_init() {
	if ( ! gutenberg_use_widgets_block_editor() ) {
		return;
	}

	$customizer_context = new WP_Block_Editor_Context();
	$settings           = array_merge(
		gutenberg_get_default_block_editor_settings(),
		gutenberg_get_legacy_widget_settings()
	);

	// This purposefully does not rely on apply_filters( 'block_editor_settings', $settings, null );
	// Applying that filter would bring over multitude of features from the post editor, some of which
	// may be undesirable. Instead of using that filter, we simply pick just the settings that are needed.
	$settings = gutenberg_experimental_global_styles_settings( $settings );
	$settings = gutenberg_extend_block_editor_styles( $settings );

	gutenberg_initialize_editor(
		'widgets_customizer',
		'customize-widgets',
		array(
			'editor_settings' => $settings,
		)
	);

	wp_add_inline_script(
		'wp-blocks',
		sprintf( 'wp.blocks.setCategories( %s );', wp_json_encode( gutenberg_get_block_categories( $customizer_context ) ) ),
		'after'
	);

	wp_enqueue_script( 'wp-customize-widgets' );
	wp_enqueue_style( 'wp-customize-widgets' );
	wp_enqueue_script( 'wp-format-library' );
	wp_enqueue_style( 'wp-format-library' );
	do_action( 'enqueue_block_editor_assets' );
}

/**
 * Tells the script loader to load the scripts and styles of custom block on widgets editor screen.
 *
 * @param bool $is_block_editor_screen Current decision about loading block assets.
 * @return bool Filtered decision about loading block assets.
 */
function gutenberg_widgets_customize_load_block_editor_scripts_and_styles( $is_block_editor_screen ) {
	if (
		gutenberg_use_widgets_block_editor() &&
		is_callable( 'get_current_screen' ) &&
		'customize' === get_current_screen()->base
	) {
		return true;
	}

	return $is_block_editor_screen;
}

// Test for wp_use_widgets_block_editor(), as the existence of this in core
// implies that the Customizer already supports the widgets block editor.
if ( ! function_exists( 'wp_use_widgets_block_editor' ) ) {
	add_action( 'customize_register', 'gutenberg_widgets_customize_register' );
	add_filter( 'widget_customizer_setting_args', 'gutenberg_widgets_customize_add_unstable_instance', 10, 2 );
	add_action( 'customize_controls_enqueue_scripts', 'gutenberg_customize_widgets_init' );
	add_filter( 'should_load_block_editor_scripts_and_styles', 'gutenberg_widgets_customize_load_block_editor_scripts_and_styles' );
}
