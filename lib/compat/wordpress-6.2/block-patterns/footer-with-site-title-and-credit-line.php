<?php
/**
 * Footer: Footer with site title and credit line.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Footer with site title and credit line', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"2em","top":"4em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignwide" style="padding-top:4em;padding-bottom:2em"><!-- wp:site-title {"style":{"typography":{"fontStyle":"normal","fontWeight":"700"}}} /-->
					
					<!-- wp:paragraph -->
					<p>'
					. sprintf(
						/* translators: %s: WordPress */
						__( 'Proudly powered by %s', 'gutenberg' ),
						'<a href="https://wordpress.org">WordPress</a>'
					) .
					'</p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
