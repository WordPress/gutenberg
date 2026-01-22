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
	register_block_pattern(
		'gutenberg/navigation-overlay-accent-bg',
		array(
			'title'       => __( 'Overlay with orange background', 'gutenberg' ),
			'description' => _x( 'A navigation overlay with orange background site title and tagline', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"Navigation Overlay"},"style":{"spacing":{"padding":{"right":"0","left":"0","top":"0","bottom":"0"}},"color":{"background":"#f57600"}},"layout":{"type":"default"}} -->
<div class="wp-block-group has-background" style="background-color:#f57600;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:columns -->
<div class="wp-block-columns"><!-- wp:column {"verticalAlignment":"bottom","width":"50%"} -->
<div class="wp-block-column is-vertically-aligned-bottom" style="flex-basis:50%"><!-- wp:group {"style":{"dimensions":{"minHeight":"100vh"},"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between","verticalAlignment":"stretch"}} -->
<div class="wp-block-group" style="min-height:100vh;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"left","verticalAlignment":"space-between"}} -->
<div class="wp-block-group"><!-- wp:navigation-overlay-close /-->

<!-- wp:group {"style":{"typography":{"lineHeight":"0.8"}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"bottom"}} -->
<div class="wp-block-group" style="line-height:0.8"><!-- wp:site-title {"fontSize":"large"} /-->

<!-- wp:site-tagline {"style":{"typography":{"lineHeight":"1.2"},"elements":{"link":{"color":{"text":"#000000a6"}}},"color":{"text":"#000000a6"}},"fontSize":"large"} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:column -->

<!-- wp:column {"width":"50%","style":{"spacing":{"padding":{"top":"var:preset|spacing|40","bottom":"var:preset|spacing|40","left":"var:preset|spacing|40","right":"var:preset|spacing|40"}}}} -->
<div class="wp-block-column" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40);flex-basis:50%"><!-- wp:navigation {"style":{"typography":{"lineHeight":"1"}},"fontSize":"large","layout":{"type":"flex","orientation":"vertical"}} /--></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_overlay_block_patterns', 20 );
