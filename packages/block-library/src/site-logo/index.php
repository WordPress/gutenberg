<?php
/**
 * Server-side rendering of the `core/site-logo` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-logo` block on the server.
 *
 * @return string The render.
 */
function render_block_core_site_logo( $attributes ) {
	$image_attrs_filter = function ( $image_attrs ) use ( $attributes ) {
		return $image_attrs;
	};

	$adjust_width_height_filter = function ( $image ) use ( $attributes ) {
		if ( empty( $attributes['width'] ) ) {
			return $image;
		}
		$height = floatval( $attributes['width'] ) / ( floatval( $image[1] ) / floatval( $image[2] ) );
        return array( $image[0], intval( $attributes['width'] ), intval( $height ) );
    };

	add_filter( 'wp_get_attachment_image_src', $adjust_width_height_filter );
	//var_dump( $attributes );die;
	$custom_logo = get_custom_logo();
	$class_name = "wp-block-site-logo";
	if ( ! empty( $attributes['className'] ) ) {
		$class_name .= " {$attributes['className']}";
	}

	if ( ! empty( $attributes['align'] ) && in_array( $attributes['align'], array( 'center', 'left', 'right' ) ) ) {
		$class_name .= " align{$attributes['align']}";
	}

	/*if ( ! empty( $attributes['align'] ) && in_array( $attributes['align'], array( 'center', 'left', 'right' ) ) ) {
		$html = sprintf( '<div class="wp-block-custom-logo">%s</div>', $html );
	}*/

	$html = sprintf( '<div class="%s"><a href="' . get_bloginfo( 'url' ) . '" rel="home" title="' . get_bloginfo( 'name' ) . '">%s</a></div>', $class_name, $custom_logo );
	remove_filter( 'wp_get_attachment_image_src', $adjust_width_height_filter );
	return $html;
}


/**
 * Registers the `core/site-logo` block on the server.
 */
function register_block_core_site_logo() {
	if ( gutenberg_is_experiment_enabled( 'gutenberg-full-site-editing' ) ) {
		register_block_type(
			'core/site-logo',
			array(
				'render_callback' => 'render_block_core_site_logo',
			)
		);
		add_filter( 'pre_set_theme_mod_custom_logo', 'sync_site_logo_to_theme_mod' );
		add_filter( 'theme_mod_custom_logo', 'override_custom_logo_theme_mod' );
	}
}
add_action( 'init', 'register_block_core_site_logo' );

function override_custom_logo_theme_mod( $custom_logo ) {
	$sitelogo = get_option( 'sitelogo' );
	return false === $sitelogo ? $custom_logo : $sitelogo;
}

function sync_site_logo_to_theme_mod( $custom_logo ) {
	if ( $custom_logo ) {
		update_option( 'sitelogo', $custom_logo );
	}
	return $custom_logo;
}

function register_block_core_site_logo_setting() {
	register_setting(
		'general',
		'sitelogo',
		array(
			'show_in_rest' => array(
				'name' => 'sitelogo',
			),
			'type'         => 'string',
			'description'  => __( 'Site logo.' ),
		)
	);
}

add_action( 'rest_api_init', 'register_block_core_site_logo_setting', 10 );
