<?php
/**
 * Three columns of text.
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Three columns of text' ),
	'categories'  => array( 'columns', 'text' ),
	'content'     => '<!-- wp:columns {"align":"full","style":{"color":{"text":"#000000","background":"#ffffff"}}} -->
	<div class="wp-block-columns alignfull has-text-color has-background" style="background-color:#ffffff;color:#000000"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"24px","lineHeight":"1.3"}}} -->
	<h3 style="font-size:24px;line-height:1.3"><strong><a href="http://wordpress.org" data-type="URL" data-id="wordpress.org">' . __( 'Virtual Tour ↗' ) . '</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>' . __( 'Get a virtual tour of the museum. Ideal for schools and events.' ) . '</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"24px","lineHeight":"1.3"}}} -->
	<h3 style="font-size:24px;line-height:1.3"><strong><a href="https://wordpress.org">' . __( 'Current Shows ↗' ) . '</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>' . __( 'Stay updated and see our current exhibitions here.' ) . '</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3,"style":{"typography":{"fontSize":"24px","lineHeight":"1.3"}}} -->
	<h3 style="font-size:24px;line-height:1.3"><strong><a href="https://wordpress.org">' . __( 'Useful Info ↗' ) . '</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>' . __( 'Get to know our opening times, ticket prices and discounts.' ) . '</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->',
	'description' => _x( 'Three columns of text', 'Block pattern description' ),
);
