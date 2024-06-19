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
		'show_on_front'          => __( 'Show on front' ),
		'page_on_front'          => __( 'Page on front' ),
		'posts_per_page'         => __( 'Maximum posts per page' ),
		'default_comment_status' => __( 'Allow comments on new posts' ),
	);

	if ( isset( $settings_label_map[ $option_name ] ) ) {
		$args['label'] = $settings_label_map[ $option_name ];
	}

	// Don't update schema when a setting isn't exposed via REST API.
	if ( ! isset( $args['show_in_rest'] ) ) {
		return $args;
	}

	// Don't update schema when label isn't provided.
	if ( ! isset( $args['label'] ) ) {
		return $args;
	}

	$schema = array( 'title' => $args['label'] );
	if ( ! is_array( $args['show_in_rest'] ) ) {
		$args['show_in_rest'] = array(
			'schema' => $schema,
		);
		return $args;
	}

	if ( ! empty( $args['show_in_rest']['schema'] ) ) {
		$args['show_in_rest']['schema'] = array_merge( $args['show_in_rest']['schema'], $schema );
	} else {
		$args['show_in_rest']['schema'] = $schema;
	}

	return $args;
}
add_filter( 'register_setting_args', 'gutenberg_update_initial_settings', 10, 4 );
