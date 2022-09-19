<?php

function theme_json_current_theme_has_support( ){
	return WP_Theme_JSON_Resolver_Gutenberg::theme_has_support();
}

function theme_json_default_filter_for_classic_themes( $theme_json_data ) {
	if ( theme_json_current_theme_has_support() ) {
		$new_data = array(
			'version'  => 2,
			'settings' => array( /* we should maintain the presets by core */ ),
			'styles'   => array( /* clear this? add only the base-layout-styles? */ ),
		);
		$theme_json_data->update_with( $new_data );
	}
	return $theme_json_data;
}
add_filter( 'theme_json_default', 'theme_json_default_filter_for_classic_themes');

function theme_json_blocks_filter_for_classic_themes( $theme_json_data ) {
	if ( theme_json_current_theme_has_support() ) {
		$new_data = array(
			'version'  => 2,
			'settings' => array(),
			'styles'   => array( /* add button styles for classic here */ ),
		);
		$theme_json_data->update_with( $new_data );
	}
	return $theme_json_data;
}
add_filter( 'theme_json_blocks', 'theme_json_blocks_filter_for_classic_themes' );

function theme_json_reset_for_classic_themes( $theme_json_data ) {
	if ( theme_json_current_theme_has_support() ) {
		$new_data = array(
			'version'  => 2,
			'settings' => array(),
			'styles'   => array(),
		);
		$theme_json_data->update_with( $new_data );
	}

	error_log( 'theme_json_data ' . print_r( $theme_json_data, true ) );
	return $theme_json_data;
}
add_filter( 'theme_json_theme', 'theme_json_reset_for_classic_themes' );
add_filter( 'theme_json_user', 'theme_json_reset_for_classic_themes' );
