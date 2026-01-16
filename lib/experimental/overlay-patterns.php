<?php
/**
 * Block patterns registration for navigation overlays.
 *
 * @package gutenberg
 */

/**
 * Registers block patterns for navigation overlays.
 *
 * This function adds patterns that are specific to the navigation overlays
 * experiment. It runs after core patterns are registered to ensure all patterns
 * are available.
 *
 * @since 6.0.0
 */
function gutenberg_register_overlay_block_patterns() {
	register_block_pattern_category(
		'navigation',
		array(
			'label'       => _x( 'Navigation', 'Block pattern category', 'gutenberg' ),
			'description' => _x( 'Display your website navigation.', 'Block pattern category', 'gutenberg' ),
		)
	);

	register_block_pattern(
		'gutenberg/navigation-overlay',
		array(
			'title'       => __( 'Navigation Overlay', 'gutenberg' ),
			'description' => _x( 'A simple pattern with a navigation block and a navigation overlay close button.', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"' . esc_attr( __( 'Navigation Overlay', 'gutenberg' ) ) . '"},"style":{"spacing":{"padding":{"right":"var:preset|spacing|40","left":"var:preset|spacing|40","top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}},"dimensions":{"minHeight":"100vh"}},"backgroundColor":"white","layout":{"type":"default"}} -->
<div class="wp-block-group has-white-background-color has-background" style="min-height:100vh;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group alignwide"><!-- wp:navigation-overlay-close /--></div>
<!-- /wp:group -->

<!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical"}} /--></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_overlay_block_patterns', 20 );
