<?php
/**
 * Temporary compatibility shims for features present in Gutenberg.
 * This file should be removed when WordPress 5.9.0 becomes the lowest
 * supported version by this plugin.
 *
 * @package gutenberg
 */

if ( ! function_exists( 'get_allowed_block_template_part_areas' ) ) {
	/**
	 * Returns a filtered list of allowed area values for template parts.
	 *
	 * @return array The supported template part area values.
	 */
	function get_allowed_block_template_part_areas() {
		$default_area_definitions = array(
			array(
				'area'        => WP_TEMPLATE_PART_AREA_UNCATEGORIZED,
				'label'       => __( 'General', 'gutenberg' ),
				'description' => __(
					'General templates often perform a specific role like displaying post content, and are not tied to any particular area.',
					'gutenberg'
				),
				'icon'        => 'layout',
				'area_tag'    => 'div',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_HEADER,
				'label'       => __( 'Header', 'gutenberg' ),
				'description' => __(
					'The Header template defines a page area that typically contains a title, logo, and main navigation.',
					'gutenberg'
				),
				'icon'        => 'header',
				'area_tag'    => 'header',
			),
			array(
				'area'        => WP_TEMPLATE_PART_AREA_FOOTER,
				'label'       => __( 'Footer', 'gutenberg' ),
				'description' => __(
					'The Footer template defines a page area that typically contains site credits, social links, or any other combination of blocks.',
					'gutenberg'
				),
				'icon'        => 'footer',
				'area_tag'    => 'footer',
			),
		);

		/**
		 * Filters the list of allowed template part area values.
		 *
		 * @param array $default_areas An array of supported area objects.
		 */
		return apply_filters( 'default_wp_template_part_areas', $default_area_definitions );
	}
}
