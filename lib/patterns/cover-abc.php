<?php
/**
 * Cover ABC block pattern.
 *
 * @package gutenberg
 */

return array(
	'title'      => __( 'Cover', 'gutenberg' ),
	'categories' => array( 'hero' ),
	'content'    => "<!-- wp:cover {\"minHeight\":470,\"gradient\":\"pale-ocean\",\"align\":\"wide\"} -->\n<div class=\"wp-block-cover alignwide has-background-dim has-pale-ocean-gradient-background\" style=\"min-height:470px\"><div class=\"wp-block-cover__inner-container\"><!-- wp:paragraph {\"align\":\"center\",\"placeholder\":\"Write title…\",\"customTextColor\":\"#114050\",\"customFontSize\":220} -->\n<p style=\"color:#114050;font-size:220px\" class=\"has-text-color has-text-align-center\">" . _x( 'abc!', 'pattern', 'gutenberg' ) . "</p>\n<!-- /wp:paragraph --></div></div>\n<!-- /wp:cover -->",
);
