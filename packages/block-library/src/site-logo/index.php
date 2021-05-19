<?php
/**
 * Server-side rendering of the `core/site-logo` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/site-logo` block on the server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string The render.
 */
function render_block_core_site_logo( $attributes ) {
	$adjust_width_height_filter = function ( $image ) use ( $attributes ) {
		if ( empty( $attributes['width'] ) ) {
			return $image;
		}
		$height = (float) $attributes['width'] / ( (float) $image[1] / (float) $image[2] );
		return array( $image[0], (int) $attributes['width'], (int) $height );
	};

	add_filter( 'wp_get_attachment_image_src', $adjust_width_height_filter );

	$custom_logo = get_custom_logo();

	if ( empty( $custom_logo ) ) {
		return ''; // Return early if no custom logo is set, avoiding extraneous wrapper div.
	}

	if ( ! $attributes['isLink'] ) {
		// Remove the link.
		$custom_logo = preg_replace( '#<a.*?>(.*?)</a>#i', '\1', $custom_logo );
	}

	if ( $attributes['isLink'] && '_blank' === $attributes['linkTarget'] ) {
		// Add the link target after the rel="home".
		// Add an aria-label for informing that the page opens in a new tab.
		$aria_label  = 'aria-label="' . esc_attr__( '(Home link, opens in a new tab)' ) . '"';
		$custom_logo = str_replace( 'rel="home"', 'rel="home" target="' . $attributes['linkTarget'] . '"' . $aria_label, $custom_logo );
	}

	$classnames = array();
	if ( ! empty( $attributes['className'] ) ) {
		$classnames[] = $attributes['className'];
	}

	if ( ! empty( $attributes['align'] ) && in_array( $attributes['align'], array( 'center', 'left', 'right' ), true ) ) {
		$classnames[] = "align{$attributes['align']}";
	}

	if ( empty( $attributes['width'] ) ) {
		$classnames[] = 'is-default-size';
	}

	$wrapper_attributes = get_block_wrapper_attributes( array( 'class' => implode( ' ', $classnames ) ) );
	$html               = sprintf( '<div %s>%s</div>', $wrapper_attributes, $custom_logo );
	remove_filter( 'wp_get_attachment_image_src', $adjust_width_height_filter );
	return $html;
}


/**
 * Registers the `core/site-logo` block on the server.
 */
function register_block_core_site_logo() {
	register_block_type_from_metadata(
		__DIR__ . '/site-logo',
		array(
			'render_callback' => 'render_block_core_site_logo',
		)
	);
}
add_action( 'init', 'register_block_core_site_logo' );

/**
 * Expose the custom_logo theme-mod in the settings REST API.
 */
register_setting(
	'general',
	'custom_logo',
	array(
		'type'         => 'integer',
		'show_in_rest' => true,
	)
);

/**
 * Filters the value of a setting recognized by the REST API.
 *
 * Hijacks the value for custom_logo theme-mod.
 *
 * @param mixed  $result Value to use for the requested setting. Can be a scalar
 *                       matching the registered schema for the setting, or null to
 *                       follow the default get_option() behavior.
 * @param string $name   Setting name (as shown in REST API responses).
 *
 * @return null|array
 */
function gutenberg_rest_pre_get_setting_filter_custom_logo( $result, $name ) {
	error_log( print_r( $name, true ) );
	if ( 'custom_logo' === $name ) {
		return get_theme_mod( 'custom_logo' );
	}
}
add_filter( 'rest_pre_get_setting', 'gutenberg_rest_pre_get_setting_filter_custom_logo', 10, 2 );

/**
 * Filters whether to preempt a setting value update via the REST API.
 *
 * Hijacks the saving method for the custom_logo theme-mod.
 *
 * @param bool   $result Whether to override the default behavior for updating the
 *                       value of a setting.
 * @param string $name   Setting name (as shown in REST API responses).
 * @param mixed  $value  Updated setting value.
 *
 * @return bool
 */
function gutenberg_rest_pre_update_setting_filter_custom_logo( $result, $name, $value ) {
	return 'custom_logo' === $name
		? set_theme_mod( 'custom_logo', $value )
		: $result;
}

add_filter( 'rest_pre_update_setting', 'gutenberg_rest_pre_update_setting_filter_custom_logo', 10, 3 );
