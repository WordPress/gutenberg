<?php
/**
 * Cover image with quote on top
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Quote' ),
	'categories'  => array( 'nature' ),
	'content'     => '<!-- wp:cover {"url":"https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/tree-forest-grass-wilderness-plant-wood-153393-pxhere.com_.jpg","id":261,"dimRatio":60,"minHeight":800,"align":"full"} -->
	<div class="wp-block-cover alignfull has-background-dim-60 has-background-dim" style="min-height:800px"><img class="wp-block-cover__image-background wp-image-261" alt="" src="https://blockpatterndesigns.mystagingwebsite.com/wp-content/uploads/2021/02/tree-forest-grass-wilderness-plant-wood-153393-pxhere.com_.jpg" data-object-fit="cover"/><div class="wp-block-cover__inner-container"><!-- wp:columns {"align":"wide"} -->
	<div class="wp-block-columns alignwide"><!-- wp:column {"width":"55%"} -->
	<div class="wp-block-column" style="flex-basis:55%"><!-- wp:heading {"style":{"typography":{"fontSize":"200px"},"color":{"text":"#ffe074"}}} -->
	<h2 class="has-text-color" style="color:#ffe074;font-size:200px">'. __("Forest.") . '</h2>
	<!-- /wp:heading -->
	
	<!-- wp:spacer {"height":330} -->
	<div style="height:330px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:paragraph {"style":{"color":{"text":"#ffe074"},"typography":{"lineHeight":"1.3","fontSize":"12px"}}} -->
	<p class="has-text-color" style="color:#ffe074;font-size:12px;line-height:1.3"><em>'. __("Even a child knows how valuable the forest is. The fresh, breathtaking smell of trees. Echoing birds flying above that dense magnitude. A stable climate, a sustainable diverse life and a source of culture. Yet, forests and other ecosystems hang in the balance, threatened to become croplands, pasture, and plantations.") . '</em></p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns --></div></div>
	<!-- /wp:cover -->',
	'description' => _x( 'Cover image with quote on top', 'Block pattern description' ),
);
