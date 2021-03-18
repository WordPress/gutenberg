<?php
/**
 * Three columns list
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Three columns list' ),
	'categories'  => array( 'art' ),
	'content'     => '<!-- wp:columns {"align":"full","backgroundColor":"white","textColor":"black"} -->
	<div class="wp-block-columns alignfull has-black-color has-white-background-color has-text-color has-background"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3} -->
	<h3><strong><a href="http://wordpress.org" data-type="URL" data-id="wordpress.org">'. __("Virtual Tour ↗") .'</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>'. __("Get a virtual tour of the museum. Ideal for schools and events.") .'</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3} -->
	<h3><strong><a href="https://wordpress.org">'. __("Open Exhibitions ↗") .'</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>'. __("Stay updated and see our current exhibitions here.") .'</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:heading {"level":3} -->
	<h3><strong><a href="https://wordpress.org">'. __("Useful Info ↗") .'</a></strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph -->
	<p>'. __("Get to know our opening times, ticket prices and discounts.") .'</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->',
	'description' => _x( 'Three columns list', 'Block pattern description' ),
);
