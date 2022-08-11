<?php
/**
 * Header: Logo, navigation, and social icons.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Logo, navigation, and social icons', 'Block pattern title' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","layout":{"inherit":true}} -->
					<div class="wp-block-group alignfull"><!-- wp:group {"align":"wide","style":{"spacing":{"padding":{"bottom":"4em","top":"2em"}}},"layout":{"type":"flex","justifyContent":"space-between"}} -->
					<div class="wp-block-group alignwide" style="padding-top:2em;padding-bottom:4em"><!-- wp:site-logo {"width":60} /-->
					
					<!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"right"}} --> <!-- wp:page-list {"isNavigationChild":true,"showSubmenuIcon":true,"openSubmenusOnClick":false} /-->
					
					<!-- wp:social-links {"className":"is-style-logos-only"} -->
					<ul class="wp-block-social-links is-style-logos-only"><!-- wp:social-link {"url":"#","service":"instagram"} /-->
					
					<!-- wp:social-link {"url":"#","service":"twitter"} /--></ul>
					<!-- /wp:social-links --><!-- /wp:navigation --></div>
					<!-- /wp:group --></div>
					<!-- /wp:group -->',
);
