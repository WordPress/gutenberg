<?php
/**
 * Block visibility block support flag.
 *
 * @package gutenberg
 */

/**
 * Add 'display' to allowed CSS properties for the style engine.
 *
 * @param array $styles Array of allowed CSS properties.
 * @return array Modified array with 'display' added.
 */
function gutenberg_add_display_to_safe_style_css( $styles ) {
	$styles[] = 'display';
	return $styles;
}
add_filter( 'safe_style_css', 'gutenberg_add_display_to_safe_style_css' );

/**
 * Get the breakpoint media queries for responsive visibility.
 *
 * @return array Associative array of viewport => media query.
 */
function gutenberg_get_responsive_visibility_breakpoints() {
	return array(
		'desktop' => '@media screen and (min-width: 782px)',
		'tablet'  => '@media screen and (min-width: 600px) and (max-width: 781px)',
		'mobile'  => '@media screen and (max-width: 599px)',
	);
}

/**
 * Render nothing if the block is hidden, or add responsive visibility classes.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_block_visibility_support( $block_content, $block ) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered( $block['blockName'] );

	if ( ! $block_type || ! block_has_support( $block_type, 'visibility', true ) ) {
		return $block_content;
	}

	if ( ! isset( $block['attrs']['metadata']['blockVisibility'] ) ) {
		return $block_content;
	}

	$block_visibility = $block['attrs']['metadata']['blockVisibility'];

	// If blockVisibility is false, hide the block completely (original behavior).
	if ( false === $block_visibility ) {
		return '';
	}

	// If blockVisibility is an object, handle responsive visibility.
	if ( is_array( $block_visibility ) ) {
		$allowed_devices = array( 'desktop', 'tablet', 'mobile' );
		$hidden_devices  = array();

		foreach ( $block_visibility as $device => $is_hidden ) {
			// Only allow whitelisted device names.
			if ( false === $is_hidden && in_array( $device, $allowed_devices, true ) ) {
				$hidden_devices[] = $device;
			}
		}

		// If all devices are hidden, return empty.
		if ( count( $hidden_devices ) === 3 &&
			in_array( 'desktop', $hidden_devices, true ) &&
			in_array( 'tablet', $hidden_devices, true ) &&
			in_array( 'mobile', $hidden_devices, true )
		) {
			return '';
		}

		// If there are responsive hiding rules, add a class and generate CSS.
		if ( ! empty( $hidden_devices ) ) {
			// Generate a unique class name based on the hidden devices.
			sort( $hidden_devices );
			$visibility_class = 'wp-block-visibility-' . implode( '-', $hidden_devices );

			// Generate CSS rules using the style engine.
			$breakpoints = gutenberg_get_responsive_visibility_breakpoints();
			$css_rules   = array();

			foreach ( $hidden_devices as $device ) {
				if ( isset( $breakpoints[ $device ] ) ) {
					$css_rules[] = array(
						'selector'     => '.' . $visibility_class,
						'declarations' => array(
							'display' => 'none',
						),
						'rules_group'  => $breakpoints[ $device ],
					);
				}
			}

			if ( ! empty( $css_rules ) ) {
				gutenberg_style_engine_get_stylesheet_from_css_rules(
					$css_rules,
					array(
						'context' => 'block-supports',
					)
				);
			}

			// Add the visibility class to the block.
			$processor = new WP_HTML_Tag_Processor( $block_content );
			if ( $processor->next_tag() ) {
				$existing_class = $processor->get_attribute( 'class' );
				$new_class      = $existing_class ? $existing_class . ' ' . $visibility_class : $visibility_class;
				$processor->set_attribute( 'class', $new_class );
				$block_content = $processor->get_updated_html();
			}
		}
	}

	return $block_content;
}

if ( function_exists( 'wp_render_block_visibility_support' ) ) {
	remove_filter( 'render_block', 'wp_render_block_visibility_support' );
}
add_filter( 'render_block', 'gutenberg_render_block_visibility_support', 10, 2 );
