<?php
/**
 * Header: Site title and vertical navigation.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Site title and vertical navigation', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:columns {"isStackedOnMobile":false,"align":"wide","style":{"spacing":{"padding":{"top":"2em","bottom":"4em"}}}} -->
					<div class="wp-block-columns alignwide is-not-stacked-on-mobile" style="padding-top:2em;padding-bottom:4em"><!-- wp:column -->
					<div class="wp-block-column"><!-- wp:group -->
					<div class="wp-block-group"><!-- wp:site-title {"style":{"typography":{"fontStyle":"normal","fontWeight":"700"}}} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:column -->
					
					<!-- wp:column -->
					<div class="wp-block-column"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"0em","top":"0em"}}},"layout":{"type":"flex","justifyContent":"right"}} -->
					<div class="wp-block-group alignwide" style="padding-top:0em;padding-bottom:0em"><!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right","orientation":"vertical"}} /-->
					</div>
					<!-- /wp:group --></div>
					<!-- /wp:column --></div>
					<!-- /wp:columns --></div>
					<!-- /wp:group -->',
);
