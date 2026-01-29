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

<!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical"},"showSubmenuIcon":false,"submenuVisibility":"always"} /--></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);

	register_block_pattern(
		'gutenberg/navigation-overlay-black-bg',
		array(
			'title'       => __( 'Overlay with black background', 'gutenberg' ),
			'description' => _x( 'A navigation overlay with black background and big white text', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"' . esc_attr( __( 'Navigation Overlay', 'gutenberg' ) ) . '"},"style":{"spacing":{"padding":{"right":"var:preset|spacing|40","left":"var:preset|spacing|40","top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}},"dimensions":{"minHeight":"100vh"},"elements":{"link":{"color":{"text":"var:preset|color|white"}}},"color":{"background":"#000000"}},"textColor":"white","layout":{"type":"default"}} -->
<div class="wp-block-group has-white-color has-text-color has-background has-link-color" style="background-color:#000000;min-height:100vh;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"top":"var:preset|spacing|30","bottom":"var:preset|spacing|30","left":"var:preset|spacing|30","right":"var:preset|spacing|30"}}},"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between","verticalAlignment":"top"}} -->
<div class="wp-block-group alignwide" style="padding-top:var(--wp--preset--spacing--30);padding-right:var(--wp--preset--spacing--30);padding-bottom:var(--wp--preset--spacing--30);padding-left:var(--wp--preset--spacing--30)"><!-- wp:navigation {"style":{"typography":{"lineHeight":"1"}},"fontSize":"xx-large","layout":{"type":"flex","orientation":"vertical"}} /-->

<!-- wp:navigation-overlay-close {"displayMode":"text","style":{"elements":{"link":{"color":{"text":"var:preset|color|white"}}},"spacing":{"padding":{"top":"0","bottom":"0","left":"0","right":"0"}}},"textColor":"white"} /--></div>
<!-- /wp:group --></div>
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
			'content'     => '<!-- wp:group {"metadata":{"name":"' . esc_attr( __( 'Navigation Overlay', 'gutenberg' ) ) . '"},"style":{"spacing":{"padding":{"right":"var:preset|spacing|50","left":"var:preset|spacing|50","top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}},"color":{"background":"#f57600"},"dimensions":{"minHeight":"100vh"},"elements":{"link":{"color":{"text":"var:preset|color|black"}}}},"textColor":"black","layout":{"type":"grid","columnCount":2,"minimumColumnWidth":"600px","rowCount":2,"isManualPlacement":true}} -->
<div class="wp-block-group has-black-color has-text-color has-background has-link-color" style="background-color:#f57600;min-height:100vh;padding-top:var(--wp--preset--spacing--50);padding-right:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50);padding-left:var(--wp--preset--spacing--50)"><!-- wp:group {"style":{"layout":{"columnStart":1,"rowStart":1}},"layout":{"type":"default"}} -->
<div class="wp-block-group"><!-- wp:navigation-overlay-close {"style":{"layout":{"columnStart":1,"rowStart":1}}} /--></div>
<!-- /wp:group -->

<!-- wp:group {"style":{"typography":{"lineHeight":"0.8"},"layout":{"columnStart":1,"rowStart":2}},"layout":{"type":"flex","orientation":"vertical","verticalAlignment":"bottom"}} -->
<div class="wp-block-group" style="line-height:0.8"><!-- wp:site-title {"fontSize":"large"} /-->

<!-- wp:site-tagline {"style":{"typography":{"lineHeight":"1.2"},"elements":{"link":{"color":{"text":"#000000a6"}}},"color":{"text":"#000000a6"}},"fontSize":"large"} /--></div>
<!-- /wp:group -->

<!-- wp:spacer {"height":"10rem","style":{"layout":{"columnStart":2,"rowStart":2}}} -->
<div style="height:10rem" aria-hidden="true" class="wp-block-spacer"></div>
<!-- /wp:spacer -->

<!-- wp:navigation {"overlayMenu":"never","style":{"typography":{"lineHeight":"1"},"layout":{"columnStart":2,"rowStart":1}},"fontSize":"large","layout":{"type":"flex","orientation":"vertical"}} /--></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
	register_block_pattern(
		'gutenberg/navigation-overlay-centered-with-extras',
		array(
			'title'       => __( 'Overlay with site info and CTA', 'gutenberg' ),
			'description' => _x( 'A navigation overlay with vertically and horizontally centered navigation, site info, and a CTA', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"' . esc_attr( __( 'Navigation Overlay', 'gutenberg' ) ) . '"},"style":{"spacing":{"padding":{"right":"var:preset|spacing|40","left":"var:preset|spacing|40","top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}},"dimensions":{"minHeight":"100vh"},"elements":{"link":{"color":{"text":"var:preset|color|black"}}}},"backgroundColor":"white","textColor":"black","layout":{"type":"default"}} -->
<div class="wp-block-group has-black-color has-white-background-color has-text-color has-background has-link-color" style="min-height:100vh;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group alignwide"><!-- wp:navigation-overlay-close /--></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","layout":{"type":"constrained"}} -->
<div class="wp-block-group alignwide"><!-- wp:site-logo {"width":80,"isLink":false,"align":"center","className":"is-style-rounded"} /-->

<!-- wp:site-title {"textAlign":"center","fontSize":"large"} /-->

<!-- wp:site-tagline {"textAlign":"center","fontSize":"medium"} /-->

<!-- wp:group {"style":{"spacing":{"padding":{"top":"var:preset|spacing|50","bottom":"var:preset|spacing|50"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--50);padding-bottom:var(--wp--preset--spacing--50)"><!-- wp:navigation {"overlayMenu":"never","style":{"typography":{"textTransform":"uppercase"}},"fontSize":"x-large","layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} /--></div>
<!-- /wp:group -->

<!-- wp:group {"align":"full","style":{"border":{"top":{"color":"#eeeeee","width":"1px"}},"spacing":{"padding":{"top":"var:preset|spacing|60","bottom":"var:preset|spacing|60"}}},"layout":{"type":"constrained"}} -->
<div class="wp-block-group alignfull" style="border-top-color:#eeeeee;border-top-width:1px;padding-top:var(--wp--preset--spacing--60);padding-bottom:var(--wp--preset--spacing--60)"><!-- wp:paragraph {"style":{"typography":{"textAlign":"center"}}} -->
<p class="has-text-align-center">' . esc_html( __( 'Find out how we can help your business.', 'gutenberg' ) ) . ' <a href="#">' . esc_html( __( 'Learn more', 'gutenberg' ) ) . '</a></p>
<!-- /wp:paragraph -->

<!-- wp:buttons {"layout":{"type":"flex","justifyContent":"center"}} -->
<div class="wp-block-buttons"><!-- wp:button {"style":{"typography":{"textTransform":"uppercase"}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" style="text-transform:uppercase">' . esc_html( __( 'Get started today!', 'gutenberg' ) ) . '</a></div>
<!-- /wp:button -->

<!-- wp:button -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button"></a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
	register_block_pattern(
		'gutenberg/navigation-overlay-centered',
		array(
			'title'       => __( 'Overlay with centered navigation', 'gutenberg' ),
			'description' => _x( 'A navigation overlay with vertically and horizontally centered navigation', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"metadata":{"name":"' . esc_attr( __( 'Navigation Overlay', 'gutenberg' ) ) . '"},"style":{"spacing":{"padding":{"right":"var:preset|spacing|40","left":"var:preset|spacing|40","top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}},"dimensions":{"minHeight":"100vh"},"elements":{"link":{"color":{"text":"var:preset|color|black"}}},"color":{"background":"#eeeeee"}},"textColor":"black","layout":{"type":"default"}} -->
<div class="wp-block-group has-black-color has-text-color has-background has-link-color" style="background-color:#eeeeee;min-height:100vh;padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group alignwide"><!-- wp:navigation-overlay-close /--></div>
<!-- /wp:group -->

<!-- wp:group {"align":"wide","style":{"dimensions":{"minHeight":"90vh"}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"center","verticalAlignment":"center"}} -->
<div class="wp-block-group alignwide" style="min-height:90vh"><!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical","justifyContent":"center"}} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/navigation-overlay' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_overlay_block_patterns', 20 );
