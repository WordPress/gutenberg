<?php
/**
 * Footer: Centered footer with social links.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Centered footer with social links', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"4em","bottom":"2em"}}},"layout":{"inherit":false}} -->
					<div class="wp-block-group alignfull" style="padding-top:4em;padding-bottom:2em"><!-- wp:site-title {"textAlign":"center","style":{"typography":{"fontStyle":"normal","fontWeight":"700"}}} /-->
					
					<!-- wp:site-tagline {"textAlign":"center"} /-->
					
					<!-- wp:spacer {"height":"8px"} -->
					<div style="height:8px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
					
					<!-- wp:social-links {"className":"is-style-logos-only","layout":{"type":"flex","justifyContent":"center"}} -->
					<ul class="wp-block-social-links is-style-logos-only"><!-- wp:social-link {"url":"#","service":"instagram"} /-->
					
					<!-- wp:social-link {"url":"#","service":"twitter"} /--></ul>
					<!-- /wp:social-links -->
					
					<!-- wp:spacer {"height":"8px"} -->
					<div style="height:8px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
					
					<!-- wp:paragraph {"align":"center"} -->
					<p class="has-text-align-center">'
					. sprintf(
						/* translators: %s: WordPress */
						__( 'Proudly powered by %s', 'gutenberg' ),
						'<a href="https://wordpress.org">WordPress</a>'
					) .
					'</p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:group -->',
);
