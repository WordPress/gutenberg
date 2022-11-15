<?php
/**
 * Footer: Footer with search, site title, and credit line.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Footer with search, site title, and credit line', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"4em","bottom":"2em"}}},"layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull" style="padding-top:4em;padding-bottom:2em"><!-- wp:columns {"align":"wide"} -->
					<div class="wp-block-columns alignwide"><!-- wp:column {"width":"100%"} -->
					<div class="wp-block-column" style="flex-basis:100%"><!-- wp:group {"align":"wide"} -->
					<div class="wp-block-group alignwide"><!-- wp:search {"label":"' . __( 'Search', 'gutenberg' ) . '","showLabel":false,"width":100,"widthUnit":"%","buttonText":"' . __( 'Search', 'gutenberg' ) . '","buttonUseIcon":true} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:column -->
					
					<!-- wp:column {"width":"100%"} -->
					<div class="wp-block-column" style="flex-basis:100%"></div>
					<!-- /wp:column --></div>
					<!-- /wp:columns -->
					
					<!-- wp:spacer {"height":"140px"} -->
					<div style="height:140px" aria-hidden="true" class="wp-block-spacer"></div>
					<!-- /wp:spacer -->
					
					<!-- wp:columns {"align":"wide"} -->
					<div class="wp-block-columns alignwide"><!-- wp:column -->
					<div class="wp-block-column"><!-- wp:site-title {"style":{"typography":{"fontStyle":"normal","fontWeight":"700"}}} /--></div>
					<!-- /wp:column -->
					
					<!-- wp:column -->
					<div class="wp-block-column"><!-- wp:paragraph {"align":"right"} -->
					<p class="has-text-align-right">'
					. sprintf(
						/* translators: %s: WordPress */
						__( 'Proudly powered by %s', 'gutenberg' ),
						'<a href="https://wordpress.org">WordPress</a>'
					) .
					'</p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:column --></div>
					<!-- /wp:columns --></div>
					<!-- /wp:group -->',
);
