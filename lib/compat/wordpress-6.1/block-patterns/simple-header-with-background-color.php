<?php
/**
 * Header: Simple header with background color.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Simple header with background color', 'Block pattern title' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","backgroundColor":"foreground","textColor":"background","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull has-background-color has-foreground-background-color has-text-color has-background"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"4em","top":"2em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignwide" style="padding-top:2em;padding-bottom:4em"><!-- wp:group {"layout":{"type":"flex"}} -->
					<div class="wp-block-group"><!-- wp:site-logo {"width":60} /-->
					
					<!-- wp:site-title {"style":{"elements":{"link":{"color":{"text":"var:preset|color|background"}}}}} /--></div>
					<!-- /wp:group -->
					
					<!-- wp:navigation {"ref":31,"__unstableLocation":"primary","layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} /--></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
