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
		$breakpoint_queries = array(
			'mobile'  => '@media (max-width: 599px)',
			'tablet'  => '@media (min-width: 600px) and (max-width: 959px)',
			'desktop' => '@media (min-width: 960px)',
		);

		$hidden_on = array();

		// Collect which breakpoints the block is hidden on.
		foreach ( $block_visibility as $breakpoint => $is_visible ) {
			if ( false === $is_visible ) {
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
		$visibility_class = 'wp-block-hidden-' . implode( '-', $hidden_on );

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
