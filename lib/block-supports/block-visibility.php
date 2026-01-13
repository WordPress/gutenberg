<?php
/**
 * Block visibility block support flag.
 *
 * @package gutenberg
 */

/**
 * Render nothing if the block is hidden, or add viewport visibility styles.
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

	if ( false === $block_visibility ) {
		return '';
	}

	if ( ! gutenberg_is_experiment_enabled( 'gutenberg-hide-blocks-based-on-screen-size' ) ) {
		return $block_content;
	}

	if ( is_array( $block_visibility ) && ! empty( $block_visibility ) ) {
		/*
		 * Breakpoints definitions are in several places in WordPress packages.
		 * The following are taken from: https://github.com/WordPress/gutenberg/blob/trunk/packages/base-styles/_breakpoints.scss
		 * The array is in a future, potential JSON format, and will be centralized
		 * as the feature is developed.
		 *
		 * Breakpoints as array items are defined sequentially. The first item's size is the max value.
		 * Each subsequent item starts after the previous size (using > operator), and its size is the max.
		 * The last item starts after the previous size (using > operator), and it has no max.
		 */
		$breakpoints = array(
			array(
				'name' => 'Mobile',
				'slug' => 'mobile',
				'size' => '480px',
			),
			array(
				'name' => 'Tablet',
				'slug' => 'tablet',
				'size' => '782px',
			),
			array(
				'name' => 'Desktop',
				'slug' => 'desktop',
				'size' => '960px',
			),
		);

		/*
		 * Build media queries from breakpoint definitions using the CSS range syntax.
		 * Could be absorbed into the style engine,
		 * as well as classname building, and declaration of the display property, if required.
		 */
		$breakpoint_queries = array();
		$previous_size      = null;
		foreach ( $breakpoints as $index => $breakpoint ) {
			$slug = $breakpoint['slug'];
			$size = $breakpoint['size'];

			// First item: width <= size.
			if ( 0 === $index ) {
				$breakpoint_queries[ $slug ] = "@media (width <= $size)";
			} elseif ( count( $breakpoints ) - 1 === $index ) {
				// Last item: width > previous size.
				$breakpoint_queries[ $slug ] = "@media (width > $previous_size)";
			} else {
				// Middle items: previous size < width <= size.
				$breakpoint_queries[ $slug ] = "@media ($previous_size < width <= $size)";
			}

			$previous_size = $size;
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

		/*
		 * If the block is hidden on all breakpoints,
		 * do not render the block. If these values ever become user-defined,
		 * we might need to output the CSS regardless of the breakpoint count.
		 * For example, if there is one breakpoint defined and it's hidden.
		 */
		if ( count( $hidden_on ) === count( $breakpoint_queries ) ) {
			return '';
		}

		// Maintain consistent order of breakpoints for class name generation.
		sort( $hidden_on );

		$css_rules   = array();
		$class_names = array();

		foreach ( $hidden_on as $breakpoint ) {
			/*
			 * If these values ever become user-defined,
			 * they should be sanitized and kebab-cased.
			 */
			$visibility_class = 'wp-block-hidden-' . $breakpoint;
			$class_names[]    = $visibility_class;
			$css_rules[]      = array(
				'selector'     => '.' . $visibility_class,
				'declarations' => array(
					'display' => 'none !important',
				),
				'rules_group'  => $breakpoint_queries[ $breakpoint ],
			);
		}

		gutenberg_style_engine_get_stylesheet_from_css_rules(
			$css_rules,
			array(
				'context'  => 'block-supports',
				'prettify' => false,
			)
		);

		if ( ! empty( $block_content ) ) {
			$processor = new WP_HTML_Tag_Processor( $block_content );
			if ( $processor->next_tag() ) {
				$processor->add_class( implode( ' ', $class_names ) );
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
