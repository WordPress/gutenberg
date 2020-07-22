<?php
/**
 * Three Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Three buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"borderRadius\":50,\"style\":{\"color\":{\"gradient\":\"linear-gradient(135deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:50px;background:linear-gradient(135deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\">" . __( 'About Cervantes', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":50,\"style\":{\"color\":{\"gradient\":\"linear-gradient(317deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:50px;background:linear-gradient(317deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\">" . __( 'Contact us', 'gutenberg' ) . "</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"borderRadius\":50,\"style\":{\"color\":{\"gradient\":\"linear-gradient(42deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\"}},\"textColor\":\"white\"} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-white-color has-text-color has-background\" style=\"border-radius:50px;background:linear-gradient(42deg,rgb(135,9,53) 0%,rgb(179,22,22) 100%)\">" . __( 'Books', 'gutenberg' ) . "</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
	'description'   => _x( 'Three filled buttons with rounded corners, side by side.', 'Block pattern description', 'gutenberg' ),
);
