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
	_deprecated_function(
		'gutenberg_is_block_editor',
		'10.8',
		'WP_Screen::is_block_editor'
	);

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
 * Returns the settings required by legacy widgets blocks.
 *
 * @return array Legacy widget settings.
 */
function gutenberg_get_legacy_widget_settings() {
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
			'search',
			'text',
			'categories',
			'recent-posts',
			'recent-comments',
			'rss',
			'tag_cloud',
			'custom_html',
			'block',
		)
	);

	$settings['widgetTypesToHideFromLegacyWidgetBlock'] = $widget_types_to_hide_from_legacy_widget_block;

	return $settings;
}

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
 * Registers the WP_Widget_Block widget.
 */
function gutenberg_register_block_widget() {
	global $pagenow;

	register_widget( 'WP_Widget_Block' );

	// By default every widget on widgets.php is wrapped with a <form>.  This
	// means that you can sometimes end up with invalid HTML, e.g. when one of
	// the widgets is a Search block. To fix the problem, let's add a filter
	// that moves the form below the actual widget content.
	if ( 'widgets.php' === $pagenow ) {
		add_filter(
			'dynamic_sidebar_params',
			'gutenberg_override_sidebar_params_for_block_widget'
		);
	}
}

add_action( 'widgets_init', 'gutenberg_register_block_widget' );

/**
 * Sets show_instance_in_rest to true on all of the core WP_Widget subclasses.
 * When merged to Core, this property should be added to WP_Widget and set to
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

if ( ! function_exists( 'wp_use_widgets_block_editor' ) ) {
	add_action( 'widgets_init', 'gutenberg_set_show_instance_in_rest_on_core_widgets' );
}
