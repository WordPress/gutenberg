<?php
/**
 * Two columns of text with offset heading
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Two columns of text with offset heading' ),
	'categories'  => array( 'columns', 'text' ),
	'content'     => '<!-- wp:group {"align":"full","style":{"color":{"background":"#f2f0e9"}}} -->
	<div class="wp-block-group alignfull has-background" style="background-color:#f2f0e9"><!-- wp:columns {"align":"full"} -->
	<div class="wp-block-columns alignfull"><!-- wp:column {"width":"60%"} -->
	<div class="wp-block-column" style="flex-basis:60%"><!-- wp:spacer {"height":70} -->
	<div style="height:70px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:paragraph {"style":{"typography":{"lineHeight":"1.1","fontSize":"5vw"}},"textColor":"black"} -->
	<p class="has-black-color has-text-color" style="font-size:5vw;line-height:1.1"><strong>' . __( 'Ancient Sea Representations' ) . '</strong></p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer {"height":95} -->
	<div style="height:95px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer -->
	
	<!-- wp:separator {"color":"black","className":"is-style-wide"} -->
	<hr class="wp-block-separator has-text-color has-background has-black-background-color has-black-color is-style-wide"/>
	<!-- /wp:separator --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns -->
	
	<!-- wp:columns {"align":"full"} -->
	<div class="wp-block-columns alignfull"><!-- wp:column -->
	<div class="wp-block-column"><!-- wp:spacer {"height":350} -->
	<div style="height:350px" aria-hidden="true" class="wp-block-spacer"></div>
	<!-- /wp:spacer --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:paragraph {"textColor":"black","fontSize":"extra-small"} -->
	<p class="has-black-color has-text-color has-extra-small-font-size">' . __( 'Winding veils round their heads, the women walked on deck. They were now moving steadily down the river, passing the dark shapes of ships at anchor, and London was a swarm of lights with a pale yellow canopy drooping above it. There were the lights of the great theatres, the lights of the long streets, lights that indicated huge squares of domestic comfort, lights that hung high in air.' ) . '</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"><!-- wp:paragraph {"textColor":"black","fontSize":"extra-small"} -->
	<p class="has-black-color has-text-color has-extra-small-font-size">' . __( 'No darkness would ever settle upon those lamps, as no darkness had settled upon them for hundreds of years. It seemed dreadful that the town should blaze for ever in the same spot; dreadful at least to people going away to adventure upon the sea, and beholding it as a circumscribed mound, eternally burnt, eternally scarred. From the deck of the ship the great city appeared a crouched and cowardly figure, a sedentary miser.' ) . '</p>
	<!-- /wp:paragraph --></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns --></div>
	<!-- /wp:group -->',
	'description' => _x( 'Two columns of text with offset heading', 'Block pattern description' ),
);
