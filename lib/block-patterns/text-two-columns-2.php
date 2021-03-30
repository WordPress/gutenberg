<?php
/**
 * Two columns of text.
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Two columns of text' ),
	'categories'  => array( 'columns', 'text' ),
	'content'     => '<!-- wp:columns {"align":"full"} -->
	<div class="wp-block-columns"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"21px"}, "color":{"text":"#000000"}}} -->
	<p class="has-text-color" style="font-size:21px;color:#000000;"><strong>' . __( 'We have worked with:' ) . '</strong></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"24px","lineHeight":"1.2"}}} -->
	<p style="font-size:24px;line-height:1.2"><a href="https://wordpress.org">' . __( 'EARTHFUND™<br>ARCHWEEKLY<br>FUTURE ROADS<br>BUILDING NY' ) . '</a></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer {"height":160} -->
	<div style="height:160px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"24px","lineHeight":"1.2"}}} -->
	<p style="font-size:24px;line-height:1.2"><a href="https://wordpress.org">' . __( 'DUBAI ROOFS<br>MAY WATSON STUDIO<br>Y.O.L<br>RUDIMENTAR' ) . '</a></p>
	<!-- /wp:paragraph -->
	
	<!-- wp:spacer -->
	<div style="height:100px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->',
	'description' => _x( 'Two columns of text', 'Block pattern description' ),
);
