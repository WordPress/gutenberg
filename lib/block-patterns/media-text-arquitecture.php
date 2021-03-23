<?php
/**
 * Media and text with image on the right
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Media and text with image on the right' ),
	'categories'  => array( 'text' ),
	'content'     => '<!-- wp:media-text {"align":"full","mediaId":1352,"mediaType":"image","verticalAlignment":"center"} -->
	<div class="wp-block-media-text alignfull is-stacked-on-mobile is-vertically-aligned-center"><figure class="wp-block-media-text__media"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/StockSnap_C7E4WYWEHZ-edited-768x1024.jpg" alt="" class="wp-image-1352 size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:heading {"textAlign":"center","level":3,"textColor":"black"} -->
	<h3 class="has-text-align-center has-black-color has-text-color"><strong>' . __( 'Open Spaces' ) . '</strong></h3>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"align":"center","fontSize":"extra-small"} -->
	<p class="has-text-align-center has-extra-small-font-size"><a href="#">' . __( 'See case study ↗' ) . '</a></p>
	<!-- /wp:paragraph --></div></div>
	<!-- /wp:media-text -->',
	'description' => _x( 'Media and text block with image to the left and text to the right', 'Block pattern description' ),
);
