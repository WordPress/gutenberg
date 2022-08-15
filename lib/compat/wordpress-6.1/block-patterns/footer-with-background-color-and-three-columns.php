<?php
/**
 * Footer: Footer with background color and three columns.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Footer with background color and three columns', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/footer' ),
	'categories' => array( 'footer' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"4em","bottom":"2em"}},"elements":{"link":{"color":{"text":"var:preset|color|background"}}}},"backgroundColor":"foreground","textColor":"background","layout":{"inherit":false}} -->
					<div class="wp-block-group alignfull has-background-color has-foreground-background-color has-text-color has-background has-link-color" style="padding-top:4em;padding-bottom:2em"><!-- wp:columns -->
					<div class="wp-block-columns"><!-- wp:column {"width":"50%"} -->
					<div class="wp-block-column" style="flex-basis:50%"><!-- wp:site-title {"style":{"typography":{"fontStyle":"normal","fontWeight":"700"}}} /-->
					
					<!-- wp:site-tagline /--></div>
					<!-- /wp:column -->
					
					<!-- wp:column -->
					<div class="wp-block-column"><!-- wp:paragraph -->
					<p><strong>Social Media</strong></p>
					<!-- /wp:paragraph -->
					
					<!-- wp:paragraph -->
					<p><a href="#">Facebook</a><br><a href="#">Instagram</a><br><a href="#">Twitter</a></p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:column -->
					
					<!-- wp:column -->
					<div class="wp-block-column"><!-- wp:paragraph -->
					<p><strong>Where We Are</strong></p>
					<!-- /wp:paragraph -->
					
					<!-- wp:paragraph -->
					<p>2020 Lomita Blvd, <br>Torrance, CA 90101<br>United States</p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:column --></div>
					<!-- /wp:columns -->
					
					<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"4em","bottom":"2em"}}},"layout":{"inherit":false}} -->
					<div class="wp-block-group alignfull" style="padding-top:4em;padding-bottom:2em"><!-- wp:paragraph {"align":"left"} -->
					<p class="has-text-align-left">Proudly Powered by <a href="https://wordpress.org">WordPress</a></p>
					<!-- /wp:paragraph --></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
