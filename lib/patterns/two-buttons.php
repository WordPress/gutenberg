<?php
/**
 * Two Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Two buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"contentJustification\":\"center\"} -->\n<div class=\"wp-block-buttons is-content-justification-center\"><!-- wp:button {\"borderRadius\":2,\"style\":{\"color\":{\"background\":\"#ba0c49\",\"text\":\"#fffffa\"}}} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-text-color has-background\" style=\"border-radius:2px;background-color:#ba0c49;color:#fffffa\">" . __( 'Download now', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":2,\"style\":{\"color\":{\"text\":\"#ba0c49\"}},\"className\":\"is-style-outline\"} -->\n<div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link has-text-color\" style=\"border-radius:2px;color:#ba0c49\">" . __( 'About Cervantes', 'gutenberg' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
	'description'   => _x( 'Two buttons, one filled and one outlined, side by side.', 'Block pattern description', 'gutenberg' ),
);
