<?php
/**
 * Media + Text
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Media + text' ),
	'categories'  => array( 'arquitecture' ),
	'content'     => '<!-- wp:columns {"align":"full","backgroundColor":"white"} -->
	<div class="wp-block-columns alignfull has-white-background-color has-background"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:image {"align":"full","id":330,"sizeSlug":"large","linkDestination":"none"} -->
	<figure class="wp-block-image alignfull size-large"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/StockSnap_C7E4WYWEHZ-edited-768x1024.jpg" alt="" class="wp-image-330"/></figure>
	<!-- /wp:image --></div>
	<!-- /wp:column -->
	
	<!-- wp:column {"verticalAlignment":"center"} -->
	<div class="wp-block-column is-vertically-aligned-center"><!-- wp:heading {"textAlign":"center","level":3,"textColor":"black"} -->
	<h3 class="has-text-align-center has-black-color has-text-color"><strong>'. __("Open Spaces") .'</strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"align":"center","style":{"color":{"text":"#0026ff"}},"fontSize":"extra-small"} -->
	<p class="has-text-align-center has-text-color has-extra-small-font-size" style="color:#0026ff"><a href="https://blockpatterndesigns.mystagingwebsite.com">'. __("See case study ↗") .'</a></p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->',
	'description' => _x( 'Media and text block with image to the left and text to the right', 'Block pattern description' ),
);
