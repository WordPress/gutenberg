<?php
/**
 * Media & text with image on the right
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Media & text with image on the right' ),
	'categories'  => array( 'header' ),
	'content'     => '<!-- wp:media-text {"align":"full","mediaPosition":"right","mediaId":615,"mediaLink":"https://blockpatterndesigns.mystagingwebsite.com/block-patterns-art/508741ldsdl/","mediaType":"image","mediaWidth":56,"verticalAlignment":"center","className":"is-style-default"} -->
	<div class="wp-block-media-text alignfull has-media-on-the-right is-stacked-on-mobile is-vertically-aligned-center is-style-default" style="grid-template-columns:auto 56%"><figure class="wp-block-media-text__media"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/03/508741ldsdl-1024x870.jpg" alt="" class="wp-image-615 size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:heading {"style":{"color":{"text":"#000000"}},"className":"has-text-color"} -->
	<h2 class="has-text-color" style="color:#000000"><strong>' . __( 'Shore with Blue Sea' ) . '</strong></h2>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"17px"},"color":{"text":"#636363"}}} -->
	<p class="has-text-color" style="color:#636363;font-size:17px">' . __( 'Eleanor Harris&nbsp;(American, 1901-1942)' ) . '</p>
	<!-- /wp:paragraph --></div></div>
	<!-- /wp:media-text -->',
	'description' => _x( 'Media and text block with image to the right and text to the left', 'Block pattern description' ),
);
