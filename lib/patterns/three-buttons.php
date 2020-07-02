<?php
/**
 * Three Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Three buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"style\":{\"color\":{\"background\":\"#fe7983\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"background-color:#fe7983\">" . __( 'One', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":50,\"style\":{\"color\":{\"background\":\"#ffe77c\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"border-radius:50px;background-color:#ffe77c\">" . __( 'Two', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":50,\"style\":{\"color\":{\"background\":\"#b2e1c0\"}},\"textColor\":\"black\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-black-color has-text-color has-background\" style=\"border-radius:50px;background-color:#b2e1c0\">" . __( 'Three', 'gutenberg' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
);
