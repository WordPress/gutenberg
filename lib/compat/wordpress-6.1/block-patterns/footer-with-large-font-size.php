<?php
/**
 * Footer: Footer with Large Font Size.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Footer with Large Font Size', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"blockGap":"15px","padding":{"top":"30px","right":"30px","bottom":"30px","left":"30px"}}},"layout":{"type":"flex","orientation":"vertical","justifyContent":"left"}} -->
					<div class="wp-block-group alignfull" style="padding-top:30px;padding-right:30px;padding-bottom:30px;padding-left:30px;"><!-- wp:site-title {"textAlign":"center","fontSize":"large"} /-->
					
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
