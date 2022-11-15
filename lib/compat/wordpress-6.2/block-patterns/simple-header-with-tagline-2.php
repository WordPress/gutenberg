<?php
/**
 * Header: Simple header with tagline.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Simple header with tagline', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"4em","top":"2em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignwide" style="padding-top:2em;padding-bottom:4em"><!-- wp:group {"layout":{"type":"flex"}} -->
					<div class="wp-block-group"><!-- wp:site-logo {"width":60} /-->
					
					<!-- wp:group -->
					<div class="wp-block-group"><!-- wp:site-title /-->
					
					<!-- wp:site-tagline {"style":{"spacing":{"margin":{"top":"0px"}}}} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->
					
					<!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
