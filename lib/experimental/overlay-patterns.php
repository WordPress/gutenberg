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
		'gutenberg/navigation-overlay-half-width',
		array(
			'title'       => __( 'Half width overlay', 'gutenberg' ),
			'description' => _x( 'A navigation overlay that spans half the width of the viewport', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"Navigation Overlay"},"style":{"spacing":{"padding":{"right":"0","left":"0","top":"0","bottom":"0"}},"dimensions":{"minHeight":"100vh"},"color":{"background":"#ffffff61"}},"layout":{"type":"default"}} -->
<div class="wp-block-group has-background" style="background-color:#ffffff61;min-height:100vh;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0"><!-- wp:columns {"verticalAlignment":"top"} -->
<div class="wp-block-columns are-vertically-aligned-top"><!-- wp:column {"verticalAlignment":"top","width":"50%"} -->
<div class="wp-block-column is-vertically-aligned-top" style="flex-basis:50%"></div>
<!-- /wp:column -->

<!-- wp:column {"verticalAlignment":"top","width":"50%","style":{"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}},"color":{"background":"#eeeeee"}},"layout":{"type":"constrained"}} -->
<div class="wp-block-column is-vertically-aligned-top has-background" style="background-color:#eeeeee;padding-top:0;padding-right:0;padding-bottom:0;padding-left:0;flex-basis:50%"><!-- wp:group {"align":"full","style":{"dimensions":{"minHeight":"100vh"},"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50","left":"var:preset|spacing|50","right":"var:preset|spacing|50"}}},"layout":{"type":"grid","columnCount":1}} -->
<div class="wp-block-group alignfull" style="min-height:100vh;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"right":"0","left":"0"}}},"layout":{"type":"default"}} -->
<div class="wp-block-group alignwide" style="padding-right:0;padding-left:0"><!-- wp:group {"align":"wide","style":{"spacing":{"margin":{"bottom":"var:preset|spacing|60"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group alignwide" style="margin-bottom:var(--wp--preset--spacing--60)"><!-- wp:navigation-overlay-close /--></div>
<!-- /wp:group -->

<!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical","justifyContent":"left"}} /--></div>
<!-- /wp:group -->

<!-- wp:group {"layout":{"type":"flex","orientation":"vertical","justifyContent":"stretch","verticalAlignment":"bottom"}} -->
<div class="wp-block-group"><!-- wp:search {"label":"Search","showLabel":false,"width":100,"widthUnit":"%","buttonText":"Search","buttonPosition":"button-inside","buttonUseIcon":true} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:column --></div>
<!-- /wp:columns --></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_overlay_block_patterns', 20 );
