<?php
/**
 * Header: Simple header.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Simple header', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"layout":{"inherit":true}} -->
					<div class="wp-block-group"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"1em","top":"1em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignwide" style="padding-top:1em;padding-bottom:1em"><!-- wp:group {"layout":{"type":"flex"}} -->
					<div class="wp-block-group"><!-- wp:site-logo {"width":60} /-->

					<!-- wp:site-title /--></div>
					<!-- /wp:group -->

					<!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
