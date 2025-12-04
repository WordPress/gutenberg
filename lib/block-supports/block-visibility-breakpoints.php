<?php
/**
 * Block visibility breakpoints block support flag.
 *
 * @package gutenberg
 */

/**
 * Add breakpoint visibility classes to block wrapper attributes.
 *
 * @param string $block_content Rendered block content.
 * @param array  $block         Block object.
 * @return string Filtered block content.
 */
function gutenberg_render_block_visibility_breakpoints_support(
	$block_content,
	$block
) {
	$block_type = WP_Block_Type_Registry::get_instance()->get_registered(
		$block['blockName']
	);

	if (
		! $block_type ||
		! block_has_support( $block_type, 'visibility', true )
	) {
		return $block_content;
	}

	if ( ! isset( $block['attrs']['metadata']['blockVisibilityBreakpoints'] ) ) {
		return $block_content;
	}

	$breakpoint_visibility = $block['attrs']['metadata']['blockVisibilityBreakpoints'];

	if ( ! $breakpoint_visibility ) {
		return $block_content;
	}

	// Build array of classes to add.
	$classes = array();
	if ( ! empty( $breakpoint_visibility['mobile'] ) ) {
		$classes[] = 'wp-block-hidden-mobile';
	}
	if ( ! empty( $breakpoint_visibility['tablet'] ) ) {
		$classes[] = 'wp-block-hidden-tablet';
	}
	if ( ! empty( $breakpoint_visibility['desktop'] ) ) {
		$classes[] = 'wp-block-hidden-desktop';
	}

	if ( empty( $classes ) ) {
		return $block_content;
	}

	// Add classes to the first element, presuming it's the wrapper.
	$tags = new WP_HTML_Tag_Processor( $block_content );
	if ( $tags->next_tag() ) {
		foreach ( $classes as $class ) {
			$tags->add_class( $class );
		}
	}

	return $tags->get_updated_html();
}

add_filter(
	'render_block',
	'gutenberg_render_block_visibility_breakpoints_support',
	10,
	2
);

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

add_action(
	'wp_enqueue_scripts',
	'gutenberg_enqueue_block_visibility_breakpoints_styles'
);
