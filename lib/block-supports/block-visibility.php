<?php
/**
 * Block visibility block support flag.
 *
 * @package gutenberg
 */

/**
 * Render nothing if the block is hidden, or add responsive visibility styles.
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

	$block_visibility = $block['attrs']['metadata']['blockVisibility'] ?? null;

	// If blockVisibility is false, hide the block completely.
	if ( false === $block_visibility ) {
		return '';
	}

	// Check if the responsive breakpoint experiment is enabled.
	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-hide-blocks-based-on-screen-size' ) ) {
		return $block_content;
	}

	// If blockVisibility is an object with breakpoint settings, generate responsive styles.
	if ( is_array( $block_visibility ) && ! empty( $block_visibility ) ) {
		/*
		 * Breakpoints definitions are in several places in WordPress packages.
		 * The following are taken from: https://github.com/WordPress/gutenberg/blob/trunk/packages/base-styles/_breakpoints.scss
		 * THe array is in a future, potential JSON format.
		 */
		$breakpoints = array(
			'mobile'  => array(
				'max' => '599px',
			),
			'tablet'  => array(
				'min' => '600px',
				'max' => '959px',
			),
			'desktop' => array(
				'min' => '960px',
			),
		);

		/*
		 * Build media queries from breakpoint definitions.
		 * Could be absorbed into the style engine,
		 * as well as classname building, and declaration of the display property, if required.
		 */
		$breakpoint_queries = array();
		foreach ( $breakpoints as $name => $values ) {
			$query_parts = array();
			if ( isset( $values['min'] ) ) {
				$query_parts[] = '(min-width: ' . $values['min'] . ')';
			}
			if ( isset( $values['max'] ) ) {
				$query_parts[] = '(max-width: ' . $values['max'] . ')';
			}
			if ( ! empty( $query_parts ) ) {
				$breakpoint_queries[ $name ] = '@media ' . implode( ' and ', $query_parts );
			}
		}

		$hidden_on = array();

		// Collect which breakpoints the block is hidden on (only known breakpoints).
		foreach ( $block_visibility as $breakpoint => $is_visible ) {
			if ( false === $is_visible && isset( $breakpoint_queries[ $breakpoint ] ) ) {
				$hidden_on[] = $breakpoint;
			}
		}

		// If no breakpoints have visibility set to false, return unchanged.
		if ( empty( $hidden_on ) ) {
			return $block_content;
		}

		// If the block is hidden on all breakpoints, return empty string.
		if ( count( $hidden_on ) === count( $breakpoint_queries ) ) {
			return '';
		}

		// Generate a unique class name based on which breakpoints are hidden.
		sort( $hidden_on );

		// Sanitize breakpoint names for use in HTML class attribute.
		$sanitized_hidden_on = array_map( 'sanitize_html_class', $hidden_on );
		$sanitized_hidden_on = array_filter( $sanitized_hidden_on );

		// If all breakpoint names were invalid after sanitization, return unchanged.
		if ( empty( $sanitized_hidden_on ) ) {
			return $block_content;
		}

		$visibility_class = 'wp-block-hidden-' . implode( '-', $sanitized_hidden_on );

		// Generate CSS rules for each hidden breakpoint.
		$css_rules = array();

		foreach ( $hidden_on as $breakpoint ) {
			if ( isset( $breakpoint_queries[ $breakpoint ] ) ) {
				$css_rules[] = array(
					'selector'     => '.' . $visibility_class,
					'declarations' => array(
						'display' => 'none !important',
					),
					'rules_group'  => $breakpoint_queries[ $breakpoint ],
				);
			}
		}

		// Use the style engine to enqueue the CSS.
		if ( ! empty( $css_rules ) ) {
			gutenberg_style_engine_get_stylesheet_from_css_rules(
				$css_rules,
				array(
					'context'  => 'block-supports',
					'prettify' => false,
				)
			);

			// Add the visibility class to the block content.
			if ( ! empty( $block_content ) ) {
				$processor = new WP_HTML_Tag_Processor( $block_content );
				if ( $processor->next_tag() ) {
					$processor->add_class( $visibility_class );
					$block_content = $processor->get_updated_html();
				}
			}
		}
	}

	return $block_content;
}

if ( function_exists( 'wp_render_block_visibility_support' ) ) {
	remove_filter( 'render_block', 'wp_render_block_visibility_support' );
}
add_filter( 'render_block', 'gutenberg_render_block_visibility_support', 10, 2 );
