<?php
/**
 * Header: Centered logo in navigation.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Centered logo in navigation', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"2em","bottom":"4em"}}},"layout":{"type":"flex","justifyContent":"center"}} -->
					<div class="wp-block-group alignfull" style="padding-top:2em;padding-bottom:4em"><!-- wp:navigation {"layout":{"type":"flex","setCascadingProperties":true,"justifyContent":"center"}} --><!-- wp:navigation-link {"label":"' . __( 'Home', 'gutenberg' ) . '","url":"#","kind":"custom","isTopLevelLink":true} /-->
					
					<!-- wp:navigation-link {"label":"' . __( 'About', 'gutenberg' ) . '","url":"#","kind":"custom","isTopLevelLink":true} /-->
					
					<!-- wp:site-logo {"width":60} /-->
					
					<!-- wp:navigation-link {"label":"' . __( 'Blog', 'gutenberg' ) . '","url":"#","kind":"custom","isTopLevelLink":true} /-->
					
					<!-- wp:navigation-link {"label":"' . __( 'Contact', 'gutenberg' ) . '","url":"#","kind":"custom","isTopLevelLink":true} /--><!-- /wp:navigation -->
					
					</div>
					<!-- /wp:group -->',
);
