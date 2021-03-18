<?php
/**
 * Cover with two columns
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Cover with two columns' ),
	'categories'  => array( 'nature' ),
	'content'     => '<!-- wp:cover {"customOverlayColor":"#51503b","minHeight":800,"align":"full"} -->
	<div class="wp-block-cover alignfull has-background-dim" style="background-color:#51503b;min-height:800px"><div class="wp-block-cover__inner-container"><!-- wp:columns {"align":"wide"} -->
	<div class="wp-block-columns alignwide"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:separator {"customColor":"#ffe074","className":"is-style-wide"} -->
	<hr class="wp-block-separator has-text-color has-background is-style-wide" style="background-color:#ffe074;color:#ffe074"/>
	<!-- /wp:separator -->
	
	<!-- wp:heading {"style":{"color":{"text":"#ffe074"},"typography":{"fontSize":"200px"}}} -->
	<h2 class="has-text-color" style="color:#ffe074;font-size:200px">'. __("80%*") . '</h2>
	<!-- /wp:heading -->
	
	<!-- wp:paragraph {"style":{"typography":{"fontSize":"12px","lineHeight":"1.3"},"color":{"text":"#ffe074","link":"#ffe074"}}} -->
	<p class="has-text-color has-link-color" style="--wp--style--color--link:#ffe074;color:#ffe074;font-size:12px;line-height:1.3"><em>'. __("*Is how much industrial agriculture contributes to deforestation across the globe. Nature always wears the colors of the spirit. To a man laboring under calamity, the heat of his own fire hath sadness in it.") . '</em></p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:image {"id":265,"sizeSlug":"large","linkDestination":"none"} -->
	<figure class="wp-block-image size-large"><img src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/tree-nature-forest-light-plant-sunshine-1100731-pxhere.com_-1024x681.jpg" alt="" class="wp-image-265"/></figure>
	<!-- /wp:image --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns --></div></div>
	<!-- /wp:cover -->',
	'description' => _x( 'Cover with two columns with text on the left one and an image on the right one', 'Block pattern description' ),
);
