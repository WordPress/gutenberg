<?php
/**
 * Two columns list
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Two columns list' ),
	'categories'  => array( 'arquitecture' ),
	'content'     => '<!-- wp:columns {"align":"full","backgroundColor":"white"} -->
	<div class="wp-block-columns alignfull has-white-background-color has-background"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"21px"}},"textColor":"black"} -->
	<p class="has-black-color has-text-color" style="font-size:21px"><strong>'. __("We have worked with:") .'</strong></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"49px","lineHeight":"1.2"},"color":{"link":"#0026ff","text":"#0026ff"}}} -->
	<p class="has-text-color has-link-color" style="--wp--style--color--link:#0026ff;color:#0026ff;font-size:49px;line-height:1.2"><a href="https://wordpress.org">'. __("EARTHFUND™<br>ARCHWEEKLY<br>FUTURE ROADS<br>BUILDING NY") .'</a></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer {"height":160} -->
	<div style="height:160px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"49px","lineHeight":"1.2"},"color":{"text":"#0026ff","link":"#0026ff"}}} -->
	<p class="has-text-color has-link-color" style="--wp--style--color--link:#0026ff;color:#0026ff;font-size:49px;line-height:1.2"><a href="https://wordpress.org">'. __("DUBAI ROOFS<br>MAY WATSON STUDIO<br>Y.O.L<br>RUDIMENTAR") .'</a></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->',
	'description' => _x( 'Two columns list', 'Block pattern description' ),
);
