<?php
/**
 * Media + Text
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Media + text' ),
	'categories'  => array( 'art' ),
	'content'     => '<!-- wp:cover {"customOverlayColor":"#ffffff","minHeight":100,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
	<div class="wp-block-cover alignfull has-background-dim" style="background-color:#ffffff;min-height:100vh"><div class="wp-block-cover__inner-container"><!-- wp:media-text {"align":"full","mediaPosition":"right","mediaId":615,"mediaLink":"https://blockpatterndesigns.mystagingwebsite.com/block-patterns-art/508741ldsdl/","mediaType":"image","mediaWidth":56,"verticalAlignment":"center","className":"is-style-default"} -->
	<div class="wp-block-media-text alignfull has-media-on-the-right is-stacked-on-mobile is-vertically-aligned-center is-style-default" style="grid-template-columns:auto 56%"><figure class="wp-block-media-text__media"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/03/508741ldsdl-1024x870.jpg" alt="" class="wp-image-615 size-full"/></figure><div class="wp-block-media-text__content"><!-- wp:heading {"style":{"typography":{"fontSize":"35px"}},"textColor":"black"} -->
	<h2 class="has-black-color has-text-color" style="font-size:35px"><strong>'. __("Shore with Blue Sea") .'</strong></h2>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"17px"},"color":{"text":"#636363"}}} -->
	<p class="has-text-color" style="color:#636363;font-size:17px">'. __("Eleanor Harris&nbsp;(American, 1901-1942)") .'</p>
	<!-- /wp:paragraph --></div></div>
	<!-- /wp:media-text --></div></div>
	<!-- /wp:cover -->',
	'description' => _x( 'Media and text block with image to the right and text to the left', 'Block pattern description' ),
);
