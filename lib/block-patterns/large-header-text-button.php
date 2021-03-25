<?php
/**
 * Large header with text and a button.
 *
 * @package WordPress
 */

return array(
	'title'       => __( 'Large header with text and a button.' ),
	'categories'  => array( 'header' ),
	'content'     => '<!-- wp:cover {"url":"https://cldup.com/kRh-P5G84E.jpg","id":613,"hasParallax":true,"dimRatio":40,"overlayColor":"black","minHeight":100,"minHeightUnit":"vh","contentPosition":"center center","align":"full"} -->
	<div class="wp-block-cover alignfull has-background-dim-40 has-black-background-color has-background-dim has-parallax" style="background-image:url(https://cldup.com/kRh-P5G84E.jpg);min-height:100vh"><div class="wp-block-cover__inner-container"><!-- wp:heading {"style":{"typography":{"fontSize":"48px","lineHeight":"1.2"}},"className":"alignwide has-white-color has-text-color"} -->
	<h2 class="alignwide has-white-color has-text-color" style="font-size:48px;line-height:1.2"><strong><em>' . __( 'Overseas:' ) . '</em></strong><br><strong><em>' . __( '1500 — 1960' ) . '</em></strong></h2>
	<!-- /wp:heading -->

	<!-- wp:columns {"align":"wide"} -->
	<div class="wp-block-columns alignwide"><!-- wp:column {"width":"60%"} -->
	<div class="wp-block-column" style="flex-basis:60%"><!-- wp:paragraph {"style":{"color":{"text":"#ffffff"}}} -->
	<p class="has-text-color" style="color:#ffffff">' . __( 'An exhibition about the different representations of the ocean throughout time, between the sixteenth and the twentieth century. Taking place in our Open Room in <em>Floor 2</em>.' ) . '</p>
	<!-- /wp:paragraph -->
	
	<!-- wp:buttons -->
	<div class="wp-block-buttons"><!-- wp:button {"borderRadius":0,"backgroundColor":"black","textColor":"white","className":"is-style-outline"} -->
	<div class="wp-block-button is-style-outline"><a class="wp-block-button__link has-white-color has-black-background-color has-text-color has-background no-border-radius">' . __( 'Visit' ) . '</a></div>
	<!-- /wp:button --></div>
	<!-- /wp:buttons --></div>
	<!-- /wp:column -->
	
	<!-- wp:column -->
	<div class="wp-block-column"></div>
	<!-- /wp:column --></div>
	<!-- /wp:columns --></div></div>
	<!-- /wp:cover -->',
	'description' => _x( 'Large header with background image and text and button on top', 'Block pattern description' ),
);
