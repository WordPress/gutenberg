<?php
/**
 * Options API changes for the Gutenberg plugin.
 *
 * @package gutenberg
 */

/**
 * Updates arguments for default settings available in WordPress.
 *
 * Note: During the core sync, the updates will be made to `register_initial_settings`.
*/
function gutenberg_update_initial_settings( $args, $defaults, $option_group, $option_name ) {
	$settings_label_map = array(
		'blogname'               => __( 'Title' ),
		'blogdescription'        => __( 'Tagline' ),
		'site_logo'              => __( 'Logo' ),
		'site_icon'              => __( 'Icon' ),
		'show_on_front'          => __( 'Show on front' ),
		'page_on_front'          => __( 'Page on front' ),
		'posts_per_page'         => __( 'Maximum posts per page' ),
		'default_comment_status' => __( 'Allow comments on new posts' ),
	);

	if ( isset( $settings_label_map[ $option_name ] ) ) {
		$args['title'] = $settings_label_map[ $option_name ];
	}

	return $args;
}
add_filter( 'register_setting_args', 'gutenberg_update_initial_settings', 10, 4 );
