<?php
/**
 * Three Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Three buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#007cba\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:3px;background-color:#007cba\">" . __( 'Authors', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#007cba\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:3px;background-color:#007cba\">" . __( 'Publishers', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":3,\"style\":{\"color\":{\"background\":\"#1e1e1e\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:3px;background-color:#1e1e1e\">" . __( 'Books', 'gutenberg' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
);
