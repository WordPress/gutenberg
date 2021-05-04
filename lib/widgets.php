<?php
/**
 * Functions used in making widgets interopable with block editors.
 *
 * @package gutenberg
 */

/**
 * Checks if a screen containing the block editor is being loaded.
 *
 * @return boolean True if a screen containing the block editor is being loaded.
 */
function gutenberg_is_block_editor() {
	// If get_current_screen does not exist, we are neither in the standard block editor for posts, or the widget block editor.
	// We can safely return false.
	if ( ! function_exists( 'get_current_screen' ) ) {
		return false;
	}
	$screen = get_current_screen();
	return ! empty( $screen ) &&
		(
			$screen->is_block_editor() ||
			'appearance_page_gutenberg-widgets' === $screen->id ||
			( function_exists( 'gutenberg_is_edit_site_page' ) && gutenberg_is_edit_site_page( $screen->id ) )
		);
}

/**
 * Whether or not to use the block editor to manage widgets. Defaults to true
 * unless a theme has removed support for widgets-block-editor or a plugin has
 * filtered the return value of this function.
 *
 * @return boolean Whether or not to use the block editor to manage widgets.
 */
function gutenberg_use_widgets_block_editor() {
	/**
	 * Filters whether or not to use the block editor to manage widgets.
	 *
	 * @param boolean $use_widgets_block_editor Whether or not to use the block editor to manage widgets.
	 */
	return apply_filters(
		'gutenberg_use_widgets_block_editor',
		get_theme_support( 'widgets-block-editor' )
	);
}

/**
 * Emulates the Widgets screen `admin_print_styles` when at the block editor
 * screen.
 */
function gutenberg_block_editor_admin_print_styles() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_styles-widgets.php' );
	}
}
add_action( 'admin_print_styles', 'gutenberg_block_editor_admin_print_styles' );

/**
 * Emulates the Widgets screen `admin_print_scripts` when at the block editor
 * screen.
 */
function gutenberg_block_editor_admin_print_scripts() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/includes/ajax-actions.php */
		do_action( 'load-widgets.php' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		/** This action is documented in wp-admin/includes/ajax-actions.php */
		do_action( 'widgets.php' ); // phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		/** This action is documented in wp-admin/widgets.php */
		do_action( 'sidebar_admin_setup' );
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_scripts-widgets.php' );
	}
}
add_action( 'admin_print_scripts', 'gutenberg_block_editor_admin_print_scripts' );

/**
 * Emulates the Widgets screen `admin_print_footer_scripts` when at the block
 * editor screen.
 */
function gutenberg_block_editor_admin_print_footer_scripts() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_print_footer_scripts-widgets.php' );
	}
}
add_action( 'admin_print_footer_scripts', 'gutenberg_block_editor_admin_print_footer_scripts' );

/**
 * Emulates the Widgets screen `admin_footer` when at the block editor screen.
 */
function gutenberg_block_editor_admin_footer() {
	if ( gutenberg_is_block_editor() ) {
		/** This action is documented in wp-admin/admin-footer.php */
		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores
		do_action( 'admin_footer-widgets.php' );
	}
}
add_action( 'admin_footer', 'gutenberg_block_editor_admin_footer' );

/**
 * Adds a save widgets nonce required by the legacy widgets block.
 */
function gutenberg_print_save_widgets_nonce() {
	// The function wpWidgets.save needs this nonce to work as expected.
	echo implode(
		"\n",
		array(
			'<form method="post">',
			wp_nonce_field( 'save-sidebar-widgets', '_wpnonce_widgets', false ),
			'</form>',
		)
	);
}
add_action( 'admin_footer-widgets.php', 'gutenberg_print_save_widgets_nonce' );


/**
 * Returns the settings required by legacy widgets blocks.
 *
 * @return array Legacy widget settings.
 */
function gutenberg_get_legacy_widget_settings() {
	global $wp_widget_factory;

	$settings = array();

	$widget_types_to_hide_from_legacy_widget_block = apply_filters(
		'widget_types_to_hide_from_legacy_widget_block',
		array(
			'pages',
			'calendar',
			'archives',
			'media_audio',
			'media_image',
			'media_gallery',
			'media_video',
			'meta',
			'search',
			'text',
			'categories',
			'recent-posts',
			'recent-comments',
			'rss',
			'tag_cloud',
			'nav_menu',
			'custom_html',
			'block',
		)
	);

	// Backwards compatibility. Remove this in or after Gutenberg 10.5.
	if ( has_filter( 'widgets_to_exclude_from_legacy_widget_block' ) ) {
		/**
		 * Filters the list of widget classes that should **not** be offered by the legacy widget block.
		 *
		 * Returning an empty array will make all the widgets available.
		 *
		 * @param array $widgets An array of excluded widgets classnames.
		 *
		 * @since 5.6.0
		 */
		$widgets_to_exclude_from_legacy_widget_block = apply_filters(
			'widgets_to_exclude_from_legacy_widget_block',
			array(
				'WP_Widget_Block',
				'WP_Widget_Pages',
				'WP_Widget_Calendar',
				'WP_Widget_Archives',
				'WP_Widget_Media_Audio',
				'WP_Widget_Media_Image',
				'WP_Widget_Media_Gallery',
				'WP_Widget_Media_Video',
				'WP_Widget_Meta',
				'WP_Widget_Search',
				'WP_Widget_Text',
				'WP_Widget_Categories',
				'WP_Widget_Recent_Posts',
				'WP_Widget_Recent_Comments',
				'WP_Widget_RSS',
				'WP_Widget_Tag_Cloud',
				'WP_Nav_Menu_Widget',
				'WP_Widget_Custom_HTML',
			)
		);

		_deprecated_hook(
			'widgets_to_exclude_from_legacy_widget_block',
			'10.3',
			"wp.hooks.addFilter( 'legacyWidget.isWidgetTypeHidden', ... )"
		);

		foreach ( $wp_widget_factory->widgets as $widget ) {
			if (
				in_array( get_class( $widget ), $widgets_to_exclude_from_legacy_widget_block, true ) &&
				! in_array( $widget->id_base, $widget_types_to_hide_from_legacy_widget_block, true )
			) {
				$widget_types_to_hide_from_legacy_widget_block[] = $widget->id_base;
			}
		}
	}

	$settings['widgetTypesToHideFromLegacyWidgetBlock'] = $widget_types_to_hide_from_legacy_widget_block;

	return $settings;
}

/**
 * Extends default editor settings with values supporting legacy widgets.
 *
 * This can be removed when plugin support requires WordPress 5.8.0+.
 *
 * @param array $settings Default editor settings.
 *
 * @return array Filtered editor settings.
 */
function gutenberg_legacy_widget_settings( $settings ) {
	return array_merge( $settings, gutenberg_get_legacy_widget_settings() );
}
// This can be removed when plugin support requires WordPress 5.8.0+.
if ( function_exists( 'get_block_editor_settings' ) ) {
	add_filter( 'block_editor_settings_all', 'gutenberg_legacy_widget_settings' );
} else {
	add_filter( 'block_editor_settings', 'gutenberg_legacy_widget_settings' );
}

/**
 * Function to enqueue admin-widgets as part of the block editor assets.
 */
function gutenberg_enqueue_widget_scripts() {
	wp_enqueue_script( 'admin-widgets' );
}

add_action( 'enqueue_block_editor_assets', 'gutenberg_enqueue_widget_scripts' );

/**
 * Overrides dynamic_sidebar_params to make sure Blocks are not wrapped in <form> tag.
 *
 * @param  array $arg Dynamic sidebar params.
 * @return array Updated dynamic sidebar params.
 */
function gutenberg_override_sidebar_params_for_block_widget( $arg ) {
	if ( 'Block' === $arg[0]['widget_name'] ) {
		$arg[0]['before_form']           = '';
		$arg[0]['before_widget_content'] = '<div class="widget-content">';
		$arg[0]['after_widget_content']  = '</div><form class="block-widget-form">';
		$arg[0]['after_form']            = '</form>';
	}

	return $arg;
}

/**
 * Registers the WP_Widget_Block widget
 */
function gutenberg_register_widgets() {
	if ( ! gutenberg_use_widgets_block_editor() ) {
		return;
	}

	register_widget( 'WP_Widget_Block' );
	// By default every widget on widgets.php is wrapped with a <form>.
	// This means that you can sometimes end up with invalid HTML, e.g. when
	// one of the widgets is a Search block.
	//
	// To fix the problem, let's add a filter that moves the form below the actual
	// widget content.
	global $pagenow;
	if ( 'widgets.php' === $pagenow ) {
		add_filter(
			'dynamic_sidebar_params',
			'gutenberg_override_sidebar_params_for_block_widget'
		);
	}
}

add_action( 'widgets_init', 'gutenberg_register_widgets' );

/**
 * Sets show_instance_in_rest to true on all of the core WP_Widget subclasses.
 * When merge dto Core, this property should be added to WP_Widget and set to
 * true on each WP_Widget subclass.
 */
function gutenberg_set_show_instance_in_rest_on_core_widgets() {
	global $wp_widget_factory;

	$core_widgets = array(
		'WP_Widget_Pages',
		'WP_Widget_Calendar',
		'WP_Widget_Archives',
		'WP_Widget_Media_Audio',
		'WP_Widget_Media_Image',
		'WP_Widget_Media_Gallery',
		'WP_Widget_Media_Video',
		'WP_Widget_Meta',
		'WP_Widget_Search',
		'WP_Widget_Text',
		'WP_Widget_Categories',
		'WP_Widget_Recent_Posts',
		'WP_Widget_Recent_Comments',
		'WP_Widget_RSS',
		'WP_Widget_Tag_Cloud',
		'WP_Nav_Menu_Widget',
		'WP_Widget_Custom_HTML',
	);

	foreach ( $core_widgets as $widget ) {
		if ( isset( $wp_widget_factory->widgets[ $widget ] ) ) {
			$wp_widget_factory->widgets[ $widget ]->show_instance_in_rest = true;
		}
	}
}
add_action( 'widgets_init', 'gutenberg_set_show_instance_in_rest_on_core_widgets' );
