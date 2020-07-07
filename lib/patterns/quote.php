<?php
/**
 * Quote block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'         => __( 'Quote', 'gutenberg' ),
	'content'       => "<!-- wp:quote {\"className\":\"is-style-large\"} -->\n<blockquote class=\"wp-block-quote is-style-large\"><p>" . __( '"I know not all that may be coming, but be it what it will, I\'ll go to it laughing."', 'gutenberg' ) . '</p><cite>' . __( '— Herman Melville, Moby-Dick (1851)', 'gutenberg' ) . "</cite></blockquote>\n<!-- /wp:quote -->",
	'viewportWidth' => 800,
	'categories'    => array( 'text' ),
);
