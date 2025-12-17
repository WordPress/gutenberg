<?php
/**
 * Block patterns registration.
 *
 * @package gutenberg
 */

/**
 * Registers additional core block patterns for the Gutenberg plugin.
 *
 * This function adds patterns that complement the existing WordPress core patterns.
 * It runs after core patterns are registered to ensure all patterns are available.
 *
 * @since 6.0.0
 */
function gutenberg_register_core_block_patterns() {
	register_block_pattern_category(
		'navigation',
		array(
			'label'       => _x( 'Navigation', 'Block pattern category' ),
			'description' => __( 'Display your website navigation.' ),
		)
	);

	register_block_pattern(
		'gutenberg/navigation-overlay',
		array(
			'title'       => __( 'Navigation Overlay', 'gutenberg' ),
			'description' => _x( 'A simple pattern with a navigation block and a navigation overlay close button.', 'Block pattern description', 'gutenberg' ),
			'content'     => '<!-- wp:group {"style":{"spacing":{"padding":{"right":"var:preset|spacing|40","left":"var:preset|spacing|40","top":"var:preset|spacing|40","bottom":"var:preset|spacing|40"}}},"layout":{"type":"flex","orientation":"vertical","flexWrap":"wrap"}} -->
<div class="wp-block-group" style="padding-top:var(--wp--preset--spacing--40);padding-right:var(--wp--preset--spacing--40);padding-bottom:var(--wp--preset--spacing--40);padding-left:var(--wp--preset--spacing--40)"><!-- wp:navigation-overlay-close -->
<button class="wp-block-navigation-overlay-close" type="button" aria-label="Close"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M13 11.8l6.1-6.3-1.1-1-6.1 6.2-6.1-6.2-1.1 1 6.1 6.3-6.5 6.7 1.1 1 6.5-6.6 6.5 6.6 1.1-1z"></path></svg></button>
<!-- /wp:navigation-overlay-close -->

<!-- wp:navigation {"layout":{"type":"flex","orientation":"vertical"}} /--></div>
<!-- /wp:group -->',
			'categories'  => array( 'navigation' ),
			'blockTypes'  => array( 'core/template-part/overlay' ),
		)
	);
}

add_action( 'init', 'gutenberg_register_core_block_patterns', 20 );
