<?php
/**
 * Three Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Three buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#febe7b\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"border-radius:3px;background-color:#febe7b\">" . __( 'Chapter 1', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#ada9ff\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"border-radius:3px;background-color:#ada9ff\">" . __( 'Chapter 2', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#b6e0a3\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"border-radius:3px;background-color:#b6e0a3\">" . __( 'Chapter 3', 'gutenberg' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
);
