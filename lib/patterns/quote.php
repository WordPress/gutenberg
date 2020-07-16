<?php
/**
 * Quote block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Quote', 'gutenberg' ),
	'content'       => "<!-- wp:group -->\n<div class=\"wp-block-group\"><div class=\"wp-block-group__inner-container\"><!-- wp:image {\"width\":125,\"height\":125,\"sizeSlug\":\"large\",\"className\":\"is-style-rounded\"} -->\n<figure class=\"wp-block-image size-large is-resized is-style-rounded\"><img src=\"https://s.w.org/images/core/5.5/avatar.png\" alt=\"\" width=\"125\" height=\"125\"/></figure>\n<!-- /wp:image -->\n\n<!-- wp:quote {\"align\":\"center\",\"className\":\"is-style-large\"} -->\n<blockquote class=\"wp-block-quote has-text-align-center is-style-large\"><p>" . __( '"I know not all that may be coming, but be it what it will, I\'ll go to it laughing."', 'gutenberg' ) . '</p><cite>' . __( '— Herman Melville, Moby-Dick (1851)', 'gutenberg' ) . "</cite></blockquote>\n<!-- /wp:quote -->\n\n<!-- wp:separator {\"className\":\"is-style-default\"} -->\n<hr class=\"wp-block-separator is-style-default\"/>\n<!-- /wp:separator --></div></div>\n<!-- /wp:group -->",
	'viewportWidth' => 800,
	'categories'    => array( 'text' ),
);
