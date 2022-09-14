<?php
/**
 * Header: Centered header.
 *
 * @package WordPress
 */

return array(
	'title'      => _x( 'Centered header', 'Block pattern title', 'gutenberg' ),
	'blockTypes' => array( 'core/template-part/header' ),
	'categories' => array( 'header' ),
	'content'    => '<!-- wp:group {"align":"full","style":{"spacing":{"padding":{"top":"2em","bottom":"4em"}}}} -->
					<div class="wp-block-group alignfull" style="padding-top:2em;padding-bottom:4em"><!-- wp:site-logo {"align":"center"} /-->
					
					<!-- wp:site-title {"textAlign":"center","fontSize":"large"} /-->
					
					<!-- wp:navigation {"layout":{"type":"flex","justifyContent":"center"}} /--></div>
					<!-- /wp:group -->',
);
