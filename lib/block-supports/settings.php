<?php

function gutenberg_register_settings_support( $block_type ) {
	$settings_support = false;
	if ( property_exists( $block_type, 'supports' ) ) {
		$settings_support = _wp_array_get( $block_type->supports, array( 'settings' ), false );
	}

	if ( ! $settings_support ) {
		return;
	}

	if ( ! $block_type->attributes ) {
		$block_type->attributes = array();
	}

	if ( ! array_key_exists( 'settings', $block_type->attributes ) ) {
		$block_type->attributes['settings'] = array(
			'type' => 'object',
		);
	}
}

function gutenberg_render_settings_support( $block_content, $block ) {
	// Return early if the block does not have support for settings.
	$settings_support = false;
	$block_type       = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );
	if ( $block_type && property_exists( $block_type, 'supports' ) ) {
		$settings_support = _wp_array_get( $block_type->supports, array( 'settings' ), false );
	}
	if ( ! $settings_support ) {
		return $block_content;
	}

	// Return early if the block does not have settings applied.
	if ( ! isset( $block['attrs']['settings'] ) ) {
		return $block_content;
	}

	// TODO:
	// - Render all origins (this code assumes only the custom origin is set so far).
	// - Move the origin transformation to WP_Theme_JSON class.
	// - Do not render the classes if they're already defined in theme.json.
	$settings = $block['attrs']['settings'];
	if ( _wp_array_get( $settings, array( 'color', 'palette', 'custom' ), false ) ) {
		$settings['color']['palette'] = $settings['color']['palette']['custom'];
	}
	if ( _wp_array_get( $settings, array( 'color', 'duotone', 'custom' ), false ) ) {
		$settings['color']['duotone'] = $settings['color']['duotone']['custom'];
	}
	if ( _wp_array_get( $settings, array( 'color', 'gradients', 'custom' ), false ) ) {
		$settings['color']['gradients'] = $settings['color']['gradients']['custom'];
	}
	if ( _wp_array_get( $settings, array( 'typography', 'fontSizes', 'custom' ), false ) ) {
		$settings['color']['fontSizes'] = $settings['color']['fontSizes']['custom'];
	}

	$theme_json = new WP_Theme_JSON_Gutenberg( array( 'version' => 2, 'settings' => $settings ), 'custom' );
	$styles     = $theme_json->get_stylesheet( array( 'variables', 'presets' ) );
	gutenberg_enqueue_block_support_styles( $styles );

	return $block_content;
}

// Register the block support.
WP_Block_Supports::get_instance()->register(
	'settings',
	array(
		'register_attribute' => 'gutenberg_register_settings_support',
	)
);

add_filter( 'render_block', 'gutenberg_render_settings_support', 10, 2 );