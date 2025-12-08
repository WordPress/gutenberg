<?php
/**
 * Block visibility block support flag.
 *
 * Handles both "hide everywhere" and responsive breakpoint visibility.
 *
 * @package gutenberg
 */

/**
 * Render visibility support for blocks.
 *
 * Handles two visibility modes:
 * 1. Hide everywhere: Renders empty string when blockVisibility is false
 * 2. Responsive breakpoints: Adds CSS classes for hiding at specific viewport sizes
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

	// Handle "hide everywhere" - return empty string to hide completely.
	if ( isset( $block['attrs']['metadata']['blockVisibility'] ) && false === $block['attrs']['metadata']['blockVisibility'] ) {
		return '';
	}

	// Handle responsive breakpoint visibility - add CSS classes.
	if ( isset( $block['attrs']['metadata']['blockVisibilityBreakpoints'] ) ) {
		$breakpoint_visibility = $block['attrs']['metadata']['blockVisibilityBreakpoints'];

		if ( $breakpoint_visibility && is_array( $breakpoint_visibility ) ) {
			// Build array of classes to add.
			$classes = array();
			if ( true === $breakpoint_visibility['mobile'] ) {
				$classes[] = 'wp-block-hidden-mobile';
			}
			if ( true === $breakpoint_visibility['tablet'] ) {
				$classes[] = 'wp-block-hidden-tablet';
			}
			if ( true === $breakpoint_visibility['desktop'] ) {
				$classes[] = 'wp-block-hidden-desktop';
			}

			// Add classes to the first element, presuming it's the wrapper.
			if ( ! empty( $classes ) ) {
				$tags = new WP_HTML_Tag_Processor( $block_content );
				if ( $tags->next_tag() ) {
					foreach ( $classes as $class ) {
						$tags->add_class( $class );
					}
					return $tags->get_updated_html();
				}
			}
		}
	}

	return $block_content;
}

/**
 * Enqueue frontend CSS for breakpoint visibility classes.
 */
function gutenberg_enqueue_block_visibility_breakpoints_styles() {
	$css = '
		@media (max-width: 599px) {
			.wp-block-hidden-mobile {
				display: none !important;
			}
		}

		@media (min-width: 600px) and (max-width: 959px) {
			.wp-block-hidden-tablet {
				display: none !important;
			}
		}

		@media (min-width: 960px) {
			.wp-block-hidden-desktop {
				display: none !important;
			}
		}
	';

	wp_add_inline_style( 'wp-block-library', $css );
}

if ( function_exists( 'wp_render_block_visibility_support' ) ) {
	remove_filter( 'render_block', 'wp_render_block_visibility_support' );
}
add_filter( 'render_block', 'gutenberg_render_block_visibility_support', 10, 2 );
add_action( 'wp_enqueue_scripts', 'gutenberg_enqueue_block_visibility_breakpoints_styles' );
