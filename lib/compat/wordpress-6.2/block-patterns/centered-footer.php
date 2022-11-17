<?php
/**
 * Footer: Centered footer.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Centered footer', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full"} -->
					<div class="wp-block-group alignfull"><!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"4em","bottom":"2em"}}},"layout":{"inherit":false}} -->
					<div class="wp-block-group alignfull" style="padding-top:4em;padding-bottom:2em"><!-- wp:paragraph {"align":"center"} -->
					<p class="has-text-align-center">'
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
