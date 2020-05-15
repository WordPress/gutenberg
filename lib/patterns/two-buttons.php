<?php
/**
 * Two Buttons block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Two Buttons', 'gutenberg' ),
	'content'       => "<!-- wp:buttons {\"align\":\"center\"} -->\n<div class=\"wp-block-buttons aligncenter\"><!-- wp:button {\"backgroundColor\":\"very-dark-gray\",\"borderRadius\":0} -->\n<div class=\"wp-block-button\"><a class=\"wp-block-button__link has-background has-very-dark-gray-background-color no-border-radius\">Button One</a></div>\n<!-- /wp:button -->\n\n<!-- wp:button {\"textColor\":\"very-dark-gray\",\"borderRadius\":0,\"className\":\"is-style-outline\"} -->\n<div class=\"wp-block-button is-style-outline\"><a class=\"wp-block-button__link has-text-color has-very-dark-gray-color no-border-radius\">Button Two</a></div>\n<!-- /wp:button --></div>\n<!-- /wp:buttons -->",
	'viewportWidth' => 500,
	'categories'    => array( 'buttons' ),
);
